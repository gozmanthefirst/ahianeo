import db, { eq } from "@repo/db";
import { product, productCategory } from "@repo/db/schemas/product-schema";
import slugify from "slugify";
import { z } from "zod";

import { ALLOWED_FILE_TYPES, validateProductImages } from "@/lib/file";
import { deleteImageFromR2, uploadImageToR2 } from "@/lib/r2";
import { SizeColorSchema } from "@/lib/schemas";
import type { AppRouteHandler } from "@/lib/types";
import { getProductById, getProducts } from "@/queries/product-queries";
import type {
  CreateProductRoute,
  DeleteProductRoute,
  GetAllproductsRoute,
  GetProductRoute,
  UpdateProductRoute,
} from "@/routes/products/products.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import { parseJsonField } from "@/utils/json";
import { getErrDetailsFromErrFields } from "@/utils/openapi-helpers";

export const getAllProducts: AppRouteHandler<GetAllproductsRoute> = async (
  c,
) => {
  const products = await getProducts();

  return c.json(
    successResponse(products, "All products retrieved successfully"),
    HttpStatusCodes.OK,
  );
};

export const getProduct: AppRouteHandler<GetProductRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const productExtended = await getProductById(id);

  if (!productExtended) {
    return c.json(
      errorResponse("NOT_FOUND", "Product not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(
    successResponse(productExtended, "Product retrieved successfully"),
    HttpStatusCodes.OK,
  );
};

export const createProduct: AppRouteHandler<CreateProductRoute> = async (c) => {
  const rawFormData = c.req.valid("form");

  // Validate and transform form data
  const validationErrors: Record<string, string> = {};

  // Validate and transform price
  let price: string;
  if (rawFormData.price) {
    const priceNum = Number.parseFloat(rawFormData.price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      validationErrors.price = "Price must be a positive number";
    } else {
      price = priceNum.toFixed(2);
    }
  }

  // Validate and transform stockQuantity
  let stockQuantity: number = 0;
  if (rawFormData.stockQuantity) {
    const stockNum = Number.parseInt(rawFormData.stockQuantity, 10);
    if (Number.isNaN(stockNum) || stockNum < 0) {
      validationErrors.stockQuantity =
        "Stock quantity must be a non-negative number";
    } else {
      stockQuantity = stockNum;
    }
  } else {
    validationErrors.stockQuantity = "Stock quantity is required";
  }

  // Validate and transform sizes using Zod
  const sizesResult = parseJsonField(
    rawFormData.sizes,
    z.array(SizeColorSchema),
    "Sizes",
  );
  let sizes: { name: string; inStock: boolean }[] = [];
  if (!sizesResult.success) {
    validationErrors.sizes = sizesResult.error;
  } else {
    sizes = sizesResult.data;
  }

  if (sizes && sizes.length > 0) {
    const sizeNames = sizes.map((s) => s.name.toLowerCase());
    const uniqueSizeNames = new Set(sizeNames);
    if (sizeNames.length !== uniqueSizeNames.size) {
      validationErrors.sizes = "Size names must be unique (case-insensitive)";
    }
  }

  // Validate and transform colors using Zod
  const colorsResult = parseJsonField(
    rawFormData.colors,
    z.array(SizeColorSchema),
    "Colors",
  );
  let colors: { name: string; inStock: boolean }[] = [];
  if (!colorsResult.success) {
    validationErrors.colors = colorsResult.error;
  } else {
    colors = colorsResult.data;
  }

  if (colors && colors.length > 0) {
    const colorNames = colors.map((c) => c.name.toLowerCase());
    const uniqueColorNames = new Set(colorNames);
    if (colorNames.length !== uniqueColorNames.size) {
      validationErrors.colors = "Color names must be unique (case-insensitive)";
    }
  }

  // Validate and transform categoryIds using Zod
  const categoryIdsResult = parseJsonField(
    rawFormData.categoryIds,
    z.array(z.uuid({ error: "Must be a valid UUID" })),
    "Category IDs",
  );
  let categoryIds: string[] = [];
  if (!categoryIdsResult.success) {
    validationErrors.categoryIds = categoryIdsResult.error;
  } else {
    categoryIds = categoryIdsResult.data;
  }

  // Return validation errors if any
  if (Object.keys(validationErrors).length > 0) {
    return c.json(
      errorResponse(
        "INVALID_DATA",
        getErrDetailsFromErrFields(validationErrors),
        validationErrors,
      ),
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  // Validate images
  try {
    validateProductImages(rawFormData.images);
  } catch (error) {
    return c.json(
      errorResponse(
        "INVALID_FILE",
        error instanceof Error ? error.message : "Image validation failed",
      ),
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  const user = c.get("user");

  // Check if categories exist
  const existingCategories = await db.query.category.findMany({
    where: (category, { inArray }) => inArray(category.id, categoryIds),
  });

  if (existingCategories.length !== categoryIds.length) {
    return c.json(
      errorResponse("INVALID_DATA", "One or more categories not found"),
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  // Fetch all products to check for slug conflicts
  const products = await db.query.product.findMany({
    columns: { slug: true },
  });

  // Generate unique slug
  let slug = slugify(rawFormData.name, { lower: true, strict: true });
  let counter = 0;

  while (true) {
    const finalSlug = counter === 0 ? slug : `${slug}-${counter}`;
    const existingProduct = products.find((p) => p.slug === finalSlug);

    if (!existingProduct) {
      slug = finalSlug;
      break;
    }
    counter++;
  }

  // Upload images to R2
  const uploadPromises = rawFormData.images.map((image) =>
    uploadImageToR2(image, "products"),
  );
  const uploadedImages = await Promise.all(uploadPromises);

  try {
    const result = await db.transaction(async (tx) => {
      // Create product
      const [newProduct] = await tx
        .insert(product)
        .values({
          name: rawFormData.name.trim(),
          slug,
          description: rawFormData.description?.trim(),
          price: price,
          stockQuantity,
          sizes,
          colors,
          createdBy: user.id,
          images: uploadedImages.map((img) => ({ url: img.url, key: img.key })),
        })
        .returning();

      // Create product-category relationships
      if (categoryIds.length > 0) {
        await tx.insert(productCategory).values(
          categoryIds.map((categoryId) => ({
            productId: newProduct.id,
            categoryId,
          })),
        );
      }

      return newProduct;
    });

    // Fetch the complete product with relations
    const productWithRelations = await getProductById(result.id);

    return c.json(
      successResponse(productWithRelations, "Product created successfully"),
      HttpStatusCodes.CREATED,
    );
  } catch (error) {
    // If database transaction fails, clean up uploaded images
    const deletePromises = uploadedImages.map((img) =>
      deleteImageFromR2(img.key).catch(console.error),
    );
    await Promise.allSettled(deletePromises);

    console.error("Error creating product:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to create product"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const updateProduct: AppRouteHandler<UpdateProductRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const rawFormData = c.req.valid("form");

  // Get existing product first
  const existingProduct = await getProductById(id);
  if (!existingProduct) {
    return c.json(
      errorResponse("NOT_FOUND", "Product not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  // Validate and transform form data
  const validationErrors: Record<string, string> = {};

  // Validate and transform price (if provided)
  let price: string | undefined;
  if (rawFormData.price !== undefined) {
    const priceNum = Number.parseFloat(rawFormData.price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      validationErrors.price = "Price must be a positive number";
    } else {
      price = priceNum.toFixed(2);
    }
  }

  // Validate and transform stockQuantity (if provided)
  let stockQuantity: number | undefined;
  if (rawFormData.stockQuantity !== undefined) {
    const stockNum = Number.parseInt(rawFormData.stockQuantity, 10);
    if (Number.isNaN(stockNum) || stockNum < 0) {
      validationErrors.stockQuantity =
        "Stock quantity must be a non-negative number";
    } else {
      stockQuantity = stockNum;
    }
  }

  // Validate and transform sizes using Zod (if provided)
  let sizes: { name: string; inStock: boolean }[] | undefined;
  if (rawFormData.sizes !== undefined) {
    const sizesResult = parseJsonField(
      rawFormData.sizes,
      z.array(SizeColorSchema),
      "Sizes",
    );
    if (!sizesResult.success) {
      validationErrors.sizes = sizesResult.error;
    } else {
      sizes = sizesResult.data;
    }
  }

  if (sizes && sizes.length > 0) {
    const sizeNames = sizes.map((s) => s.name.toLowerCase());
    const uniqueSizeNames = new Set(sizeNames);
    if (sizeNames.length !== uniqueSizeNames.size) {
      validationErrors.sizes = "Size names must be unique (case-insensitive)";
    }
  }

  // Validate and transform colors using Zod (if provided)
  let colors: { name: string; inStock: boolean }[] | undefined;
  if (rawFormData.colors !== undefined) {
    const colorsResult = parseJsonField(
      rawFormData.colors,
      z.array(SizeColorSchema),
      "Colors",
    );
    if (!colorsResult.success) {
      validationErrors.colors = colorsResult.error;
    } else {
      colors = colorsResult.data;
    }
  }

  if (colors && colors.length > 0) {
    const colorNames = colors.map((c) => c.name.toLowerCase());
    const uniqueColorNames = new Set(colorNames);
    if (colorNames.length !== uniqueColorNames.size) {
      validationErrors.colors = "Color names must be unique (case-insensitive)";
    }
  }

  // Validate and transform categoryIds using Zod (if provided)
  let categoryIds: string[] | undefined;
  if (rawFormData.categoryIds !== undefined) {
    const categoryIdsResult = parseJsonField(
      rawFormData.categoryIds,
      z.array(z.uuid({ error: "Must be a valid UUID" })),
      "Category IDs",
    );
    if (!categoryIdsResult.success) {
      validationErrors.categoryIds = categoryIdsResult.error;
    } else {
      categoryIds = categoryIdsResult.data;
    }
  }

  // Validate and transform keepImageKeys (if provided)
  let keepImageKeys: string[] = [];
  if (rawFormData.keepImageKeys !== undefined) {
    const keepImageKeysResult = parseJsonField(
      rawFormData.keepImageKeys,
      z.array(z.string()),
      "Keep Image Keys",
    );
    if (!keepImageKeysResult.success) {
      validationErrors.keepImageKeys = keepImageKeysResult.error;
    } else {
      // Deduplicate keys
      keepImageKeys = Array.from(new Set(keepImageKeysResult.data));

      // Validate that all keepImageKeys exist in the current product
      const currentImageKeys = existingProduct.images.map((img) => img.key);
      const invalidKeys = keepImageKeys.filter(
        (key) => !currentImageKeys.includes(key),
      );

      if (invalidKeys.length > 0) {
        if (invalidKeys.length === 1) {
          validationErrors.keepImageKeys = `Invalid image key: '${invalidKeys[0]}' doesn't exist in this product`;
        } else {
          validationErrors.keepImageKeys = `Invalid image keys: '${invalidKeys.join("', '")}' don't exist in this product`;
        }
      }
    }
  } else {
    // If no keepImageKeys provided, keep all existing images
    keepImageKeys = existingProduct.images.map((img) => img.key);
  }

  // Validate new images (if provided)
  const newImages = rawFormData.newImages || [];
  if (newImages.length > 0) {
    try {
      // Use a modified validation that doesn't require minimum images
      newImages.forEach((file, index) => {
        if (file.size > 1024 * 1024) {
          throw new Error(
            `Image ${index + 1}: File size must be less than 1MB`,
          );
        }
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          throw new Error(
            `Image ${index + 1}: File type must be one of: ${ALLOWED_FILE_TYPES.join(", ")}`,
          );
        }
      });
    } catch (error) {
      return c.json(
        errorResponse(
          "INVALID_FILE",
          error instanceof Error ? error.message : "Image validation failed",
        ),
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
      );
    }
  }

  // Validate total image count (kept + new)
  const totalImageCount = keepImageKeys.length + newImages.length;
  if (totalImageCount < 1) {
    validationErrors.images = "Product must have at least 1 image";
  } else if (totalImageCount > 3) {
    validationErrors.images = "Maximum 3 images allowed";
  }

  // Return validation errors if any
  if (Object.keys(validationErrors).length > 0) {
    return c.json(
      errorResponse(
        "INVALID_DATA",
        getErrDetailsFromErrFields(validationErrors),
        validationErrors,
      ),
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  // Check if categories exist (only if categoryIds provided)
  if (categoryIds && categoryIds.length > 0) {
    const existingCategories = await db.query.category.findMany({
      where: (category, { inArray }) => inArray(category.id, categoryIds),
    });

    if (existingCategories.length !== categoryIds.length) {
      return c.json(
        errorResponse("INVALID_DATA", "One or more categories not found"),
        HttpStatusCodes.BAD_REQUEST,
      );
    }
  }

  // Generate unique slug if name is being updated
  let slug: string | undefined;
  if (rawFormData.name && rawFormData.name !== existingProduct.name) {
    // Fetch all products to check for slug conflicts (excluding current product)
    const products = await db.query.product.findMany({
      columns: { slug: true, id: true },
    });

    const baseSlug = slugify(rawFormData.name, { lower: true, strict: true });
    let counter = 0;

    while (true) {
      const finalSlug = counter === 0 ? baseSlug : `${baseSlug}-${counter}`;
      const existingProduct = products.find(
        (p) => p.slug === finalSlug && p.id !== id,
      );

      if (!existingProduct) {
        slug = finalSlug;
        break;
      }
      counter++;
    }
  }

  // Upload new images to R2
  let uploadedImages: { url: string; key: string }[] = [];
  if (newImages.length > 0) {
    const uploadPromises = newImages.map((image) =>
      uploadImageToR2(image, "products"),
    );
    uploadedImages = await Promise.all(uploadPromises);
  }

  try {
    const result = await db.transaction(async (tx) => {
      // Prepare update data
      // biome-ignore lint/suspicious/noExplicitAny: required
      const updateData: any = {};

      if (rawFormData.name) updateData.name = rawFormData.name.trim();
      if (rawFormData.description !== undefined)
        updateData.description = rawFormData.description?.trim();
      if (price !== undefined) updateData.price = price;
      if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
      if (sizes !== undefined) updateData.sizes = sizes;
      if (colors !== undefined) updateData.colors = colors;
      if (slug !== undefined) updateData.slug = slug;

      // Handle images: combine kept images with new images
      if (rawFormData.keepImageKeys !== undefined || newImages.length > 0) {
        const keptImages = existingProduct.images.filter((img) =>
          keepImageKeys.includes(img.key),
        );
        updateData.images = [...keptImages, ...uploadedImages];
      }

      // Update product
      const [updatedProduct] = await tx
        .update(product)
        .set(updateData)
        .where(eq(product.id, id))
        .returning();

      // Update product-category relationships if categoryIds provided
      if (categoryIds !== undefined) {
        // Delete existing relationships
        await tx
          .delete(productCategory)
          .where(eq(productCategory.productId, id));

        // Insert new relationships
        if (categoryIds.length > 0) {
          await tx.insert(productCategory).values(
            categoryIds.map((categoryId) => ({
              productId: id,
              categoryId,
            })),
          );
        }
      }

      return updatedProduct;
    });

    // Delete old images that weren't kept (only if images were updated)
    if (rawFormData.keepImageKeys !== undefined || newImages.length > 0) {
      const imagesToDelete = existingProduct.images
        .filter((img) => !keepImageKeys.includes(img.key))
        .map((img) => img.key);

      if (imagesToDelete.length > 0) {
        const deletePromises = imagesToDelete.map((key) =>
          deleteImageFromR2(key).catch(console.error),
        );
        await Promise.allSettled(deletePromises);
      }
    }

    // Fetch the complete updated product with relations
    const productWithRelations = await getProductById(result.id);

    return c.json(
      successResponse(productWithRelations, "Product updated successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    // If database transaction fails, clean up newly uploaded images
    if (uploadedImages.length > 0) {
      const deletePromises = uploadedImages.map((img) =>
        deleteImageFromR2(img.key).catch(console.error),
      );
      await Promise.allSettled(deletePromises);
    }

    console.error("Error updating product:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to update product"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const deleteProduct: AppRouteHandler<DeleteProductRoute> = async (c) => {
  const { id } = c.req.valid("param");

  // Get existing product first
  const existingProduct = await getProductById(id);
  if (!existingProduct) {
    return c.json(
      errorResponse("NOT_FOUND", "Product not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  // Check for dependencies - cart items
  const cartItems = await db.query.cartItem.findMany({
    where: (cartItem, { eq }) => eq(cartItem.productId, id),
    columns: { id: true },
  });

  // Check for dependencies - order items
  const orderItems = await db.query.orderItem.findMany({
    where: (orderItem, { eq }) => eq(orderItem.productId, id),
    columns: { id: true },
  });

  // Block deletion if product has dependencies
  if (cartItems.length > 0 || orderItems.length > 0) {
    let conflictMessage = "Product cannot be deleted as it exists in ";
    const dependencies = [];

    if (cartItems.length > 0) {
      dependencies.push("user carts");
    }

    if (orderItems.length > 0) {
      dependencies.push("orders");
    }

    conflictMessage += dependencies.join(" and ");

    return c.json(
      errorResponse("CONFLICT", conflictMessage),
      HttpStatusCodes.CONFLICT,
    );
  }

  try {
    // Delete product in transaction (cascades to productCategory)
    await db.transaction(async (tx) => {
      // Delete product (productCategory will cascade automatically)
      const [deletedProduct] = await tx
        .delete(product)
        .where(eq(product.id, id))
        .returning();

      return deletedProduct;
    });

    // After successful deletion, clean up images from R2
    if (existingProduct.images.length > 0) {
      const deletePromises = existingProduct.images.map((img) =>
        deleteImageFromR2(img.key).catch((error) => {
          console.error(`Failed to delete image ${img.key} from R2:`, error);
          // Don't throw error - product is already deleted
        }),
      );
      await Promise.allSettled(deletePromises);
    }

    return c.json(
      successResponse(existingProduct, "Product deleted successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete product"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
