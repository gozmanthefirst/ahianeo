import { createRoute } from "@hono/zod-openapi";
import {
  AddToCartSchema,
  CartSelectSchema,
  UpdateCartItemSchema,
} from "@repo/db/validators/cart-validators";

import HttpStatusCodes from "@/utils/http-status-codes";
import { cartExamples } from "@/utils/openapi-examples";
import {
  createIdUUIDParamsSchema,
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Cart"];

export const getUserCart = createRoute({
  path: "/cart",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Get user's cart",
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Cart retrieved",
      schema: CartSelectSchema,
      resObj: {
        details: "Cart retrieved successfully",
        data: cartExamples.cartWithItems,
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

export const addToCart = createRoute({
  path: "/cart/items",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Add product to cart",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AddToCartSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Product added to cart",
      schema: CartSelectSchema,
      resObj: {
        details: "Product added to cart successfully",
        data: cartExamples.cartWithItems,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(cartExamples.addToCartValErrs),
          fields: cartExamples.addToCartValErrs,
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
      "Product not found",
      "Product not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: errorContent({
      description: "Insufficient stock",
      examples: {
        insufficientStock: {
          summary: "Not enough stock",
          code: "INSUFFICIENT_STOCK",
          details:
            "Not enough stock available. Requested: 5, Available: 3. Maximum you can add: 3",
        },
        outOfStock: {
          summary: "Product out of stock",
          code: "INSUFFICIENT_STOCK",
          details: "Product is currently out of stock. Available: 0",
        },
        existingCartItem: {
          summary: "Insufficient stock with existing cart item",
          code: "INSUFFICIENT_STOCK",
          details:
            "Not enough stock available. You have 2 in cart, requested 5 more, but only 4 available total. Maximum you can add: 2",
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

export const updateCartItem = createRoute({
  path: "/cart/items/{id}",
  method: "put",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Update cart item quantity",
  request: {
    params: createIdUUIDParamsSchema("Cart Item ID"),
    body: {
      content: {
        "application/json": {
          schema: UpdateCartItemSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Cart item updated",
      schema: CartSelectSchema,
      resObj: {
        details: "Cart item updated successfully",
        data: cartExamples.cartWithItems,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(
            cartExamples.updateCartItemValErrs,
          ),
          fields: cartExamples.updateCartItemValErrs,
        },
        invalidUUID: {
          summary: "Invalid cart item ID",
          code: "INVALID_DATA",
          details: "Cart item ID must be a valid UUID",
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.FORBIDDEN]: genericErrorContent(
      "FORBIDDEN",
      "Forbidden",
      "You can only update items in your own cart",
    ),
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "Cart item not found",
      "Cart item not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: errorContent({
      description: "Insufficient stock",
      examples: {
        insufficientStock: {
          summary: "Not enough stock",
          code: "INSUFFICIENT_STOCK",
          details:
            "Not enough stock available. Requested: 10, Available: 7. Maximum quantity: 7",
        },
        outOfStock: {
          summary: "Product out of stock",
          code: "INSUFFICIENT_STOCK",
          details: "Product is currently out of stock. Available: 0",
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

export const deleteCartItem = createRoute({
  path: "/cart/items/{id}",
  method: "delete",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Delete cart item",
  request: {
    params: createIdUUIDParamsSchema("Cart Item ID"),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Cart item deleted",
      schema: CartSelectSchema,
      resObj: {
        details: "Cart item removed successfully",
        data: cartExamples.cartWithItems,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidUUID: {
          summary: "Invalid cart item ID",
          code: "INVALID_DATA",
          details: "Cart item ID must be a valid UUID",
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.FORBIDDEN]: genericErrorContent(
      "FORBIDDEN",
      "Forbidden",
      "You can only remove items from your own cart",
    ),
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "Cart item not found",
      "Cart item not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const clearCart = createRoute({
  path: "/cart",
  method: "delete",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Clear all items from cart",
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Cart cleared",
      schema: CartSelectSchema,
      resObj: {
        details: "Cart cleared successfully",
        data: cartExamples.emptyCart,
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

export type GetUserCartRoute = typeof getUserCart;
export type AddToCartRoute = typeof addToCart;
export type UpdateCartItemRoute = typeof updateCartItem;
export type DeleteCartItemRoute = typeof deleteCartItem;
export type ClearCartRoute = typeof clearCart;
