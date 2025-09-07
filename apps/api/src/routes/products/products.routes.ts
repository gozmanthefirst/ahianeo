import { createRoute, z } from "@hono/zod-openapi";
import { ProductExtendedSchema } from "@repo/db/validators/product-validators";

import { ALLOWED_FILE_TYPES } from "@/lib/file";
import { CreateProductSchema, UpdateProductSchema } from "@/lib/schemas";
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

export const createProduct = createRoute({
  path: "/products",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Create a new product",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: CreateProductSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: successContent({
      description: "Product created",
      schema: ProductExtendedSchema,
      resObj: {
        details: "Product created successfully",
        data: productsExamples.productExtended,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(
            productsExamples.createProductValErrs,
          ),
          fields: productsExamples.createProductValErrs,
        },
        categoryNotFound: {
          summary: "Category not found",
          code: "INVALID_DATA",
          details: "One or more categories not found",
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
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: errorContent({
      description: "Invalid file data",
      examples: {
        noImages: {
          summary: "No images provided",
          code: "INVALID_FILE",
          details: "At least 1 image is required",
        },
        tooManyImages: {
          summary: "Too many images",
          code: "INVALID_FILE",
          details: "Maximum 3 images allowed",
        },
        fileSizeError: {
          summary: "File size too large",
          code: "INVALID_FILE",
          details: "Image 1: File size must be less than 1MB",
        },
        fileTypeError: {
          summary: "Invalid file type",
          code: "INVALID_FILE",
          details: `Image 1: File type must be one of: ${ALLOWED_FILE_TYPES.join(", ")}`,
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

export const updateProduct = createRoute({
  path: "/products/{id}",
  method: "put",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Update an existing product",
  request: {
    params: createIdUUIDParamsSchema("Product ID"),
    body: {
      content: {
        "multipart/form-data": {
          schema: UpdateProductSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Product updated",
      schema: ProductExtendedSchema,
      resObj: {
        details: "Product updated successfully",
        data: productsExamples.productExtended,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(
            productsExamples.createProductValErrs,
          ),
          fields: productsExamples.createProductValErrs,
        },
        categoryNotFound: {
          summary: "Category not found",
          code: "INVALID_DATA",
          details: "One or more categories not found",
        },
        invalidImageKey: {
          summary: "Invalid image key",
          code: "INVALID_DATA",
          details:
            "Invalid image key: 'invalid-key' doesn't exist in this product",
          fields: {
            keepImageKeys:
              "Invalid image key: 'invalid-key' doesn't exist in this product",
          },
        },
        invalidUUID: {
          summary: "Invalid product ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
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
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "Product not found",
      "Product not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: errorContent({
      description: "Invalid file data",
      examples: {
        noImages: {
          summary: "No images after update",
          code: "INVALID_FILE",
          details: "Product must have at least 1 image",
        },
        tooManyImages: {
          summary: "Too many images",
          code: "INVALID_FILE",
          details: "Maximum 3 images allowed",
        },
        fileSizeError: {
          summary: "File size too large",
          code: "INVALID_FILE",
          details: "Image 1: File size must be less than 1MB",
        },
        fileTypeError: {
          summary: "Invalid file type",
          code: "INVALID_FILE",
          details: `Image 1: File type must be one of: ${ALLOWED_FILE_TYPES.join(", ")}`,
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

export const deleteProduct = createRoute({
  path: "/products/{id}",
  method: "delete",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Delete a product",
  request: {
    params: createIdUUIDParamsSchema("Product ID"),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Product deleted",
      schema: ProductExtendedSchema,
      resObj: {
        details: "Product deleted successfully",
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
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "Product not found",
      "Product not found",
    ),
    [HttpStatusCodes.CONFLICT]: errorContent({
      description: "Product has dependencies",
      examples: {
        hasCartItems: {
          summary: "Product in carts",
          code: "CONFLICT",
          details: "Product cannot be deleted as it exists in user carts",
        },
        hasOrderItems: {
          summary: "Product in orders",
          code: "CONFLICT",
          details: "Product cannot be deleted as it exists in orders",
        },
        hasBothDependencies: {
          summary: "Product in carts and orders",
          code: "CONFLICT",
          details: "Product cannot be deleted as it exists in carts and orders",
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

export type GetAllproductsRoute = typeof getAllProducts;
export type GetProductRoute = typeof getProduct;
export type CreateProductRoute = typeof createProduct;
export type UpdateProductRoute = typeof updateProduct;
export type DeleteProductRoute = typeof deleteProduct;
