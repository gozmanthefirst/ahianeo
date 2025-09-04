import { createRoute, z } from "@hono/zod-openapi";
import { ProductExtendedSchema } from "@repo/db/validators/product-validators";

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

const tags = ["Products"];

export const getAllProducts = createRoute({
  path: "/products",
  method: "get",
  tags,
  description: "Get all products",
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "All products retrieved",
      schema: z.array(ProductExtendedSchema),
      resObj: {
        details: "All products retrieved successfully",
        data: [productsExamples.productExtended],
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

export const getProduct = createRoute({
  path: "/products/{id}",
  method: "get",
  tags,
  description: "Get a product",
  request: {
    params: createIdUUIDParamsSchema("Product ID"),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Product retrieved",
      schema: ProductExtendedSchema,
      resObj: {
        details: "Product retrieved successfully",
        data: productsExamples.productExtended,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidUUID: {
          summary: "Invalid product ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
        },
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "Product not found",
      "Product not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type GetAllproductsRoute = typeof getAllProducts;
export type GetProductRoute = typeof getProduct;
