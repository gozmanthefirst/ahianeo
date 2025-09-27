import { createDb, eq } from "@repo/db";
import { category } from "@repo/db/schemas/product-schema";
import slugify from "slugify";

import type { AppRouteHandler } from "@/lib/types";
import { getCategoryById } from "@/queries/category-queries";
import type {
  CreateCategoryRoute,
  DeleteCategoryRoute,
  UpdateCategoryRoute,
} from "@/routes/categories/categories.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type {
  GetAllCategoriesRoute,
  GetCategoryRoute,
} from "./categories.routes";

export const getAllCategories: AppRouteHandler<GetAllCategoriesRoute> = async (
  c,
) => {
  try {
    const db = createDb(c.env.DATABASE_URL);

    const categories = await db.query.category.findMany();

    return c.json(
      successResponse(categories, "All categories retrieved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error retrieving categories:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve categories"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const getCategory: AppRouteHandler<GetCategoryRoute> = async (c) => {
  const { id } = c.req.valid("param");

  try {
    const categoryWithProducts = await getCategoryById(id, c.env);

    if (!categoryWithProducts) {
      return c.json(
        errorResponse("NOT_FOUND", "Category not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    return c.json(
      successResponse(categoryWithProducts, "Category retrieved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error retrieving category:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve category"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const createCategory: AppRouteHandler<CreateCategoryRoute> = async (
  c,
) => {
  const categoryData = c.req.valid("json");
  const db = createDb(c.env.DATABASE_URL);

  const trimmedName = categoryData.name.trim();
  if (!trimmedName) {
    return c.json(
      errorResponse("INVALID_DATA", "Category name cannot be empty"),
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  try {
    const result = await db.transaction(async (tx) => {
      // Check for existing name (case-insensitive)
      const existingCategory = await tx.query.category.findFirst({
        where: (category, { sql }) =>
          sql`LOWER(${category.name}) = LOWER(${trimmedName})`,
      });

      if (existingCategory) {
        throw new Error("CATEGORY_EXISTS");
      }

      // Generate unique slug
      const allCategories = await tx.query.category.findMany({
        columns: { slug: true },
      });

      let slug = slugify(trimmedName, { lower: true, strict: true });
      let counter = 0;

      while (true) {
        const finalSlug = counter === 0 ? slug : `${slug}-${counter}`;
        const existingSlug = allCategories.find(
          (cat) => cat.slug === finalSlug,
        );

        if (!existingSlug) {
          slug = finalSlug;
          break;
        }
        counter++;
      }

      const [newCategory] = await tx
        .insert(category)
        .values({ name: trimmedName, slug })
        .returning();

      return newCategory;
    });

    return c.json(
      successResponse(result, "Category created successfully"),
      HttpStatusCodes.CREATED,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_EXISTS") {
      return c.json(
        errorResponse("CONFLICT", "Category name already exists"),
        HttpStatusCodes.CONFLICT,
      );
    }

    console.error("Error creating category:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to create category"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const updateCategory: AppRouteHandler<UpdateCategoryRoute> = async (
  c,
) => {
  const { id } = c.req.valid("param");
  const categoryData = c.req.valid("json");

  try {
    const trimmedName = categoryData.name.trim();
    if (!trimmedName) {
      return c.json(
        errorResponse("INVALID_DATA", "Category name cannot be empty"),
        HttpStatusCodes.BAD_REQUEST,
      );
    }

    const categoryToUpdate = await getCategoryById(id, c.env);

    if (!categoryToUpdate) {
      return c.json(
        errorResponse("NOT_FOUND", "Category not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Case-insensitive comparison
    if (trimmedName.toLowerCase() === categoryToUpdate.name.toLowerCase()) {
      return c.json(
        successResponse(categoryToUpdate, "Category updated successfully"),
        HttpStatusCodes.OK,
      );
    }

    try {
      const db = createDb(c.env.DATABASE_URL);

      const result = await db.transaction(async (tx) => {
        // Fetch all categories except current one and check in JavaScript
        const allCategories = await tx.query.category.findMany({
          where: (category, { ne }) => ne(category.id, id),
          columns: { id: true, name: true },
        });

        // Check for case-insensitive name match
        const existingCategory = allCategories.find(
          (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase(),
        );

        if (existingCategory) {
          throw new Error("CATEGORY_EXISTS");
        }

        // Generate unique slug
        const allCategoriesForSlug = await tx.query.category.findMany({
          columns: { slug: true, id: true },
        });

        let slug = slugify(trimmedName, { lower: true, strict: true });
        let counter = 0;

        while (true) {
          const finalSlug = counter === 0 ? slug : `${slug}-${counter}`;
          const existingSlug = allCategoriesForSlug.find(
            (cat) => cat.slug === finalSlug && cat.id !== id,
          );

          if (!existingSlug) {
            slug = finalSlug;
            break;
          }
          counter++;
        }

        const [updatedCategory] = await tx
          .update(category)
          .set({ name: trimmedName, slug })
          .where(eq(category.id, id))
          .returning();

        return updatedCategory;
      });

      return c.json(
        successResponse(result, "Category updated successfully"),
        HttpStatusCodes.OK,
      );
    } catch (error) {
      if (error instanceof Error && error.message === "CATEGORY_EXISTS") {
        return c.json(
          errorResponse("CONFLICT", "Category name already exists"),
          HttpStatusCodes.CONFLICT,
        );
      }

      console.error("Error updating category:", error);
      return c.json(
        errorResponse("INTERNAL_SERVER_ERROR", "Failed to update category"),
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  } catch (error) {
    console.error("Error updating category:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to update category"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const deleteCategory: AppRouteHandler<DeleteCategoryRoute> = async (
  c,
) => {
  const { id } = c.req.valid("param");

  try {
    const db = createDb(c.env.DATABASE_URL);

    const result = await db.transaction(async (tx) => {
      const categoryToDelete = await tx.query.category.findFirst({
        where: (category, { eq }) => eq(category.id, id),
        with: {
          productCategories: {
            columns: { id: true },
          },
        },
      });

      if (!categoryToDelete) {
        throw new Error("CATEGORY_NOT_FOUND");
      }

      if (categoryToDelete.productCategories.length > 0) {
        throw new Error("CATEGORY_HAS_PRODUCTS");
      }

      const [deletedCategory] = await tx
        .delete(category)
        .where(eq(category.id, id))
        .returning();

      return deletedCategory;
    });

    return c.json(
      successResponse(result, "Category deleted successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CATEGORY_NOT_FOUND") {
        return c.json(
          errorResponse("NOT_FOUND", "Category not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      if (error.message === "CATEGORY_HAS_PRODUCTS") {
        return c.json(
          errorResponse("CONFLICT", "Category has associated products"),
          HttpStatusCodes.CONFLICT,
        );
      }
    }

    console.error("Error deleting category:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete category"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
