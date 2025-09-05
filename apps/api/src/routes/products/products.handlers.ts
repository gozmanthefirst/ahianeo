import db from "@repo/db"; // Make sure inArray is imported
import { product, productCategory } from "@repo/db/schemas/product-schema";
import slugify from "slugify";

import { validateProductImages } from "@/lib/file";
import { deleteImageFromR2, uploadImageToR2 } from "@/lib/r2";
import type { AppRouteHandler } from "@/lib/types";
import { getProductById, getProducts } from "@/queries/product-queries";
import type {
  CreateProductRoute,
  GetAllproductsRoute,
  GetProductRoute,
} from "@/routes/products/products.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";

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

  // Validate and transform sizes
  let sizes: { name: string; inStock: boolean }[] = [];
  if (rawFormData.sizes) {
    try {
      const parsedSizes = JSON.parse(rawFormData.sizes);
      if (!Array.isArray(parsedSizes)) {
        validationErrors.sizes = "Sizes must be an array";
      } else {
        for (const [index, size] of parsedSizes.entries()) {
          if (typeof size !== "object" || size === null) {
            validationErrors.sizes = `Size ${index + 1} must be an object`;
            break;
          }
          if (typeof size.name !== "string" || size.name.trim().length === 0) {
            validationErrors.sizes = `Size ${index + 1} must have a valid name`;
            break;
          }
          if (typeof size.inStock !== "boolean") {
            validationErrors.sizes = `Size ${index + 1} must have a boolean inStock property`;
            break;
          }
        }
        if (!validationErrors.sizes) {
          sizes = parsedSizes;
        }
      }
    } catch {
      validationErrors.sizes = "Sizes must be valid JSON";
    }
  }

  // Validate and transform colors
  let colors: { name: string; inStock: boolean }[] = [];
  if (rawFormData.colors) {
    try {
      const parsedColors = JSON.parse(rawFormData.colors);
      if (!Array.isArray(parsedColors)) {
        validationErrors.colors = "Colors must be an array";
      } else {
        for (const [index, color] of parsedColors.entries()) {
          if (typeof color !== "object" || color === null) {
            validationErrors.colors = `Color ${index + 1} must be an object`;
            break;
          }
          if (
            typeof color.name !== "string" ||
            color.name.trim().length === 0
          ) {
            validationErrors.colors = `Color ${index + 1} must have a valid name`;
            break;
          }
          if (typeof color.inStock !== "boolean") {
            validationErrors.colors = `Color ${index + 1} must have a boolean inStock property`;
            break;
          }
        }
        if (!validationErrors.colors) {
          colors = parsedColors;
        }
      }
    } catch {
      validationErrors.colors = "Colors must be valid JSON";
    }
  }

  // Validate and transform categoryIds
  let categoryIds: string[] = [];
  if (rawFormData.categoryIds) {
    try {
      const parsedCategoryIds = JSON.parse(rawFormData.categoryIds);
      if (!Array.isArray(parsedCategoryIds)) {
        validationErrors.categoryIds = "Category IDs must be an array";
      } else {
        for (const [index, categoryId] of parsedCategoryIds.entries()) {
          if (typeof categoryId !== "string") {
            validationErrors.categoryIds = `Category ID ${index + 1} must be a string`;
            break;
          }
          // Validate UUID format
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(categoryId)) {
            validationErrors.categoryIds = `Category ID ${index + 1} must be a valid UUID`;
            break;
          }
        }
        if (!validationErrors.categoryIds) {
          categoryIds = parsedCategoryIds;
        }
      }
    } catch {
      validationErrors.categoryIds = "Category IDs must be valid JSON";
    }
  }

  // Return validation errors if any
  if (Object.keys(validationErrors).length > 0) {
    return c.json(
      errorResponse("INVALID_DATA", "Validation failed", validationErrors),
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
