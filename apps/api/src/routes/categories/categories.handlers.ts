import db, { eq } from "@repo/db";
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
  const categories = await db.query.category.findMany();

  return c.json(
    successResponse(categories, "All categories retrieved successfully"),
    HttpStatusCodes.OK,
  );
};

export const getCategory: AppRouteHandler<GetCategoryRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const categoryWithProducts = await getCategoryById(id);

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
};

export const createCategory: AppRouteHandler<CreateCategoryRoute> = async (
  c,
) => {
  const categoryData = c.req.valid("json");

  const categories = await db.query.category.findMany();

  const existingCategoryName = categories.find(
    (cat) => cat.name.toLowerCase() === categoryData.name.toLowerCase(),
  );

  if (existingCategoryName) {
    return c.json(
      errorResponse("CONFLICT", "Category name already exists"),
      HttpStatusCodes.CONFLICT,
    );
  }

  let slug = slugify(categoryData.name, { lower: true, strict: true });
  let counter = 0;

  while (true) {
    const finalSlug = counter === 0 ? slug : `${slug}-${counter}`;
    const existingCategory = categories.find((cat) => cat.slug === finalSlug);

    if (!existingCategory) {
      slug = finalSlug;
      break;
    }
    counter++;
  }

  const payload = {
    name: categoryData.name,
    slug,
  };

  const [newCategory] = await db
    .insert(category)
    .values(payload)
    .onConflictDoNothing({ target: category.name })
    .returning();

  return c.json(
    successResponse(newCategory, "Category created successfully"),
    HttpStatusCodes.CREATED,
  );
};

export const updateCategory: AppRouteHandler<UpdateCategoryRoute> = async (
  c,
) => {
  const { id } = c.req.valid("param");
  const categoryData = c.req.valid("json");

  const categoryToUpdate = await getCategoryById(id);

  if (!categoryToUpdate) {
    return c.json(
      errorResponse("NOT_FOUND", "Category not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  if (categoryData.name === categoryToUpdate.name) {
    return c.json(
      successResponse(categoryToUpdate, "Category updated successfully"),
      HttpStatusCodes.OK,
    );
  }

  const categories = await db.query.category.findMany();

  const existingCategoryName = categories.find(
    (cat) =>
      cat.name.toLowerCase() === categoryData.name.toLowerCase() &&
      cat.id !== id,
  );

  if (existingCategoryName) {
    return c.json(
      errorResponse("CONFLICT", "Category name already exists"),
      HttpStatusCodes.CONFLICT,
    );
  }

  let slug = slugify(categoryData.name, { lower: true, strict: true });
  let counter = 0;

  while (true) {
    const finalSlug = counter === 0 ? slug : `${slug}-${counter}`;
    const existingCategory = categories.find(
      (cat) => cat.slug === finalSlug && cat.id !== id,
    );

    if (!existingCategory) {
      slug = finalSlug;
      break;
    }
    counter++;
  }

  const payload = {
    name: categoryData.name,
    slug,
  };

  const [newCategory] = await db
    .update(category)
    .set({ name: payload.name, slug: payload.slug })
    .where(eq(category.id, id))
    .returning();

  return c.json(
    successResponse(newCategory, "Category updated successfully"),
    HttpStatusCodes.OK,
  );
};

export const deleteCategory: AppRouteHandler<DeleteCategoryRoute> = async (
  c,
) => {
  const { id } = c.req.valid("param");

  const categoryToDelete = await getCategoryById(id);

  if (!categoryToDelete) {
    return c.json(
      errorResponse("NOT_FOUND", "Category not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  if (categoryToDelete.products.length > 0) {
    return c.json(
      errorResponse("CONFLICT", "Category has associated products"),
      HttpStatusCodes.CONFLICT,
    );
  }

  const [deletedCategory] = await db
    .delete(category)
    .where(eq(category.id, id))
    .returning();

  return c.json(
    successResponse(deletedCategory, "Category deleted successfully"),
    HttpStatusCodes.OK,
  );
};
