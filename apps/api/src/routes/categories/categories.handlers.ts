import db from "@repo/db";

import type { AppRouteHandler } from "@/lib/types";
import { getCategoryById } from "@/queries/category-queries";
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
