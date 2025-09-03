import { createRoute, z } from "@hono/zod-openapi";
import {
  CategorySelectSchema,
  CreateCategorySchema,
  ProductSelectSchema,
} from "@repo/db/validators/product-validators";

import HttpStatusCodes from "@/utils/http-status-codes";
import { authExamples, productsExamples } from "@/utils/openapi-examples";
import {
  createIdUUIDParamsSchema,
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Categories"];

export const getAllCategories = createRoute({
  path: "/categories",
  method: "get",
  tags,
  description: "Get all categories",
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "All categories retrieved",
      schema: z.array(CategorySelectSchema),
      resObj: {
        details: "All categories retrieved successfully",
        data: [productsExamples.category],
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const getCategory = createRoute({
  path: "/categories/{id}",
  method: "get",
  tags,
  description: "Get a category with its products",
  request: {
    params: createIdUUIDParamsSchema("Category ID"),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Category retrieved",
      schema: z.object({
        category: CategorySelectSchema,
        products: z.array(ProductSelectSchema),
      }),
      resObj: {
        details: "Category retrieved successfully",
        data: {
          category: productsExamples.category,
          products: [productsExamples.product],
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidUUID: {
          summary: "Invalid category ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
        },
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "Category not found",
      "Category not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const createCategory = createRoute({
  path: "/categories",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Create a new category",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateCategorySchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: successContent({
      description: "Category created",
      schema: CategorySelectSchema,
      resObj: {
        details: "Category created successfully",
        data: {
          ...productsExamples.category,
          name: "New category",
          slug: "new-category",
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(
            productsExamples.createCategoryValErrs,
          ),
          fields: productsExamples.createCategoryValErrs,
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.FORBIDDEN]: errorContent({
      description: "Forbidden",
      examples: {
        requiredRole: {
          summary: "Required role missing",
          code: "FORBIDDEN",
          details: "User does not have the required role",
        },
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type GetAllCategoriesRoute = typeof getAllCategories;
export type GetCategoryRoute = typeof getCategory;
export type CreateCategoryRoute = typeof createCategory;
