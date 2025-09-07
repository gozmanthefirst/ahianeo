import { createRoute } from "@hono/zod-openapi";
import { CreateCheckoutResponseSchema } from "@repo/db/validators/order-validators";

import HttpStatusCodes from "@/utils/http-status-codes";
import { orderExamples } from "@/utils/openapi-examples";
import {
  errorContent,
  genericErrorContent,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Orders"];

export const createCheckout = createRoute({
  path: "/orders/create-checkout",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Create order",
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Order created successfully",
      schema: CreateCheckoutResponseSchema,
      resObj: {
        details: "Order created successfully",
        data: orderExamples.createCheckoutResponse,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        emptyCart: {
          summary: "Empty cart",
          code: "INVALID_DATA",
          details: "Cart is empty. Add items to cart before creating order.",
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: errorContent({
      description: "Cart or stock issues",
      examples: {
        insufficientStock: {
          summary: "Insufficient stock",
          code: "INSUFFICIENT_STOCK",
          details: `Not enough stock for "Product". Requested: 5, Available: 3`,
        },
        productNoLongerExists: {
          summary: "Product no longer exists",
          code: "INVALID_CART_STATE",
          details:
            'Product with ID "123e4567-e89b-12d3-a456-426614174000" no longer exists',
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

export type CreateCheckoutRoute = typeof createCheckout;
