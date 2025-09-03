import db from "@repo/db";
import { category } from "@repo/db/schemas/product-schema";
import slugify from "slugify";

import type { AppRouteHandler } from "@/lib/types";
import { getCategoryById } from "@/queries/category-queries";
import type { CreateCategoryRoute } from "@/routes/categories/categories.routes";
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

  const [newCategory] = await db.insert(category).values(payload).returning();

  return c.json(
    successResponse(newCategory, "Category created successfully"),
    HttpStatusCodes.CREATED,
  );
};
