import { createRoute, z } from "@hono/zod-openapi";
import {
  CreateCheckoutResponseSchema,
  OrderSelectSchema,
} from "@repo/db/validators/order-validators";

import HttpStatusCodes from "@/utils/http-status-codes";
import { authExamples, orderExamples } from "@/utils/openapi-examples";
import {
  createIdUUIDParamsSchema,
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Orders"];

export const getUserOrders = createRoute({
  path: "/orders",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Get user's order history",
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User orders retrieved",
      schema: z.array(OrderSelectSchema),
      resObj: {
        details: "User orders retrieved successfully",
        data: [orderExamples.createCheckoutResponse.order],
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const getUserOrder = createRoute({
  path: "/orders/{id}",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Get user's order details",
  request: {
    params: createIdUUIDParamsSchema("Order ID"),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Order details retrieved",
      schema: OrderSelectSchema,
      resObj: {
        details: "Order details retrieved successfully",
        data: orderExamples.createCheckoutResponse.order,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidUUID: {
          summary: "Invalid order ID",
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
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "Order not found",
      "Order not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

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

export type GetUserOrdersRoute = typeof getUserOrders;
export type GetUserOrderRoute = typeof getUserOrder;
export type CreateCheckoutRoute = typeof createCheckout;
