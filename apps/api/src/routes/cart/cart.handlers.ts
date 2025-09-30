import { db } from "@repo/db";

import type { AppRouteHandler } from "@/lib/types";
import {
  addCartItem,
  clearCartItems,
  deleteCartItem,
  getCartItem,
  getCartItemWithDetails,
  getOrCreateUserCart,
  getUserCartWithItems,
  updateCartItemQuantity,
} from "@/queries/cart-queries";
import { getProductById } from "@/queries/product-queries";
import type {
  AddToCartRoute,
  ClearCartRoute,
  DeleteCartItemRoute,
  GetUserCartRoute,
  UpdateCartItemRoute,
} from "@/routes/cart/cart.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";

export const getUserCart: AppRouteHandler<GetUserCartRoute> = async (c) => {
  const user = c.get("user");

  try {
    const userCart = await getOrCreateUserCart(user.id);

    if (!userCart) {
      return c.json(
        errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve cart"),
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    let totalItems = 0;
    let totalAmount = 0;

    const cartItemsWithSubtotals = userCart.cartItems.map((item) => {
      const subAmount = (
        parseFloat(item.product.price) * item.quantity
      ).toFixed(2);
      totalItems += item.quantity;
      totalAmount += parseFloat(subAmount);

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        quantity: item.quantity,
        subAmount,
        product: item.product,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const cartResponse = {
      id: userCart.id,
      userId: userCart.userId,
      cartItems: cartItemsWithSubtotals,
      totalItems,
      totalAmount: totalAmount.toFixed(2),
      createdAt: userCart.createdAt,
      updatedAt: userCart.updatedAt,
    };

    return c.json(
      successResponse(cartResponse, "Cart retrieved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error retrieving user cart:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve cart"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const addToCart: AppRouteHandler<AddToCartRoute> = async (c) => {
  const user = c.get("user");
  const { productId, quantity } = c.req.valid("json");

  try {
    // Validate product exists and get current stock
    const product = await getProductById(productId);

    if (!product) {
      return c.json(
        errorResponse("NOT_FOUND", "Product not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Get or create user cart
    const userCart = await getOrCreateUserCart(user.id);
    if (!userCart) {
      return c.json(
        errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve cart"),
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    // Check if product already in cart
    const existingCartItem = await getCartItem(userCart.id, productId);

    let totalRequestedQuantity = quantity;
    if (existingCartItem) {
      totalRequestedQuantity = existingCartItem.quantity + quantity;
    }

    const productStockQty = product.stockQuantity || 0;

    // Validate stock availability
    if (totalRequestedQuantity > productStockQty) {
      let errorMessage: string;

      if (productStockQty === 0) {
        errorMessage = "Product is currently out of stock. Available: 0";
      } else if (existingCartItem) {
        const maxCanAdd = productStockQty - existingCartItem.quantity;
        errorMessage = `Not enough stock available. You have ${existingCartItem.quantity} in cart, requested ${quantity} more, but only ${productStockQty} available total. Maximum you can add: ${maxCanAdd}`;
      } else {
        errorMessage = `Not enough stock available. Requested: ${quantity}, Available: ${productStockQty}. Maximum you can add: ${productStockQty}`;
      }

      return c.json(
        errorResponse("INSUFFICIENT_STOCK", errorMessage),
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
      );
    }

    // Add/update cart item in transaction
    await db.transaction(async () => {
      if (existingCartItem) {
        await updateCartItemQuantity(
          existingCartItem.id,
          totalRequestedQuantity,
        );
      } else {
        await addCartItem(userCart.id, productId, quantity);
      }
    });

    const updatedCart = await getUserCartWithItems(user.id);

    if (!updatedCart) {
      return c.json(
        errorResponse(
          "INTERNAL_SERVER_ERROR",
          "Failed to retrieve updated cart",
        ),
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    // Calculate totals
    let totalItems = 0;
    let totalAmount = 0;

    const cartItemsWithSubtotals = updatedCart.cartItems.map((item) => {
      const subAmount = (
        parseFloat(item.product.price) * item.quantity
      ).toFixed(2);
      totalItems += item.quantity;
      totalAmount += parseFloat(subAmount);

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        quantity: item.quantity,
        subAmount,
        product: item.product,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const cartResponse = {
      id: updatedCart.id,
      userId: updatedCart.userId,
      cartItems: cartItemsWithSubtotals,
      totalItems,
      totalAmount: totalAmount.toFixed(2),
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt,
    };

    return c.json(
      successResponse(cartResponse, "Product added to cart successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error adding product to cart:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to add product to cart"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const updateCartItem: AppRouteHandler<UpdateCartItemRoute> = async (
  c,
) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { quantity } = c.req.valid("json");

  try {
    // Get cart item with cart and product details
    const cartItemWithDetails = await getCartItemWithDetails(id);

    if (!cartItemWithDetails) {
      return c.json(
        errorResponse("NOT_FOUND", "Cart item not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Verify ownership - cart item belongs to user's cart
    if (cartItemWithDetails.cart.userId !== user.id) {
      return c.json(
        errorResponse(
          "FORBIDDEN",
          "You can only update items in your own cart",
        ),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    // Validate stock availability (only if quantity is increasing)
    if (quantity > cartItemWithDetails.quantity) {
      const productStockQty = cartItemWithDetails.product.stockQuantity || 0;

      if (quantity > productStockQty) {
        let errorMessage: string;

        if (productStockQty === 0) {
          errorMessage = "Product is currently out of stock. Available: 0";
        } else {
          errorMessage = `Not enough stock available. Requested: ${quantity}, Available: ${productStockQty}. Maximum quantity: ${productStockQty}`;
        }

        return c.json(
          errorResponse("INSUFFICIENT_STOCK", errorMessage),
          HttpStatusCodes.UNPROCESSABLE_ENTITY,
        );
      }
    }

    // Update cart item quantity in transaction
    await db.transaction(async () => {
      await updateCartItemQuantity(id, quantity);
    });

    // Fetch updated cart with all relations and calculations
    const updatedCart = await getUserCartWithItems(user.id);
    if (!updatedCart) {
      return c.json(
        errorResponse(
          "INTERNAL_SERVER_ERROR",
          "Failed to retrieve updated cart",
        ),
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    // Calculate totals
    let totalItems = 0;
    let totalAmount = 0;

    const cartItemsWithSubtotals = updatedCart.cartItems.map((item) => {
      const subAmount = (
        parseFloat(item.product.price) * item.quantity
      ).toFixed(2);
      totalItems += item.quantity;
      totalAmount += parseFloat(subAmount);

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        quantity: item.quantity,
        subAmount,
        product: item.product,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const cartResponse = {
      id: updatedCart.id,
      userId: updatedCart.userId,
      cartItems: cartItemsWithSubtotals,
      totalItems,
      totalAmount: totalAmount.toFixed(2),
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt,
    };

    return c.json(
      successResponse(cartResponse, "Cart item updated successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error updating cart item:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to update cart item"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const removeCartItem: AppRouteHandler<DeleteCartItemRoute> = async (
  c,
) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  try {
    // Get cart item with cart details for ownership validation
    const cartItemWithDetails = await getCartItemWithDetails(id);

    if (!cartItemWithDetails) {
      return c.json(
        errorResponse("NOT_FOUND", "Cart item not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Verify ownership - cart item belongs to user's cart
    if (cartItemWithDetails.cart.userId !== user.id) {
      return c.json(
        errorResponse(
          "FORBIDDEN",
          "You can only remove items from your own cart",
        ),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    // Delete cart item in transaction
    await db.transaction(async () => {
      await deleteCartItem(id);
    });

    // Fetch updated cart with all relations and calculations
    const updatedCart = await getUserCartWithItems(user.id);
    if (!updatedCart) {
      return c.json(
        errorResponse(
          "INTERNAL_SERVER_ERROR",
          "Failed to retrieve updated cart",
        ),
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    // Calculate totals
    let totalItems = 0;
    let totalAmount = 0;

    const cartItemsWithSubtotals = updatedCart.cartItems.map((item) => {
      const subAmount = (
        parseFloat(item.product.price) * item.quantity
      ).toFixed(2);
      totalItems += item.quantity;
      totalAmount += parseFloat(subAmount);

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        quantity: item.quantity,
        subAmount,
        product: item.product,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const cartResponse = {
      id: updatedCart.id,
      userId: updatedCart.userId,
      cartItems: cartItemsWithSubtotals,
      totalItems,
      totalAmount: totalAmount.toFixed(2),
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt,
    };

    return c.json(
      successResponse(cartResponse, "Cart item removed successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error removing cart item:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to remove cart item"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const clearUserCart: AppRouteHandler<ClearCartRoute> = async (c) => {
  const user = c.get("user");

  try {
    // Get or create user cart
    const userCart = await getOrCreateUserCart(user.id);

    if (!userCart) {
      return c.json(
        errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve cart"),
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    // Clear all cart items in transaction
    await db.transaction(async () => {
      await clearCartItems(userCart.id);
    });

    // Return empty cart structure
    const emptyCartResponse = {
      id: userCart.id,
      userId: userCart.userId,
      cartItems: [],
      totalItems: 0,
      totalAmount: "0.00",
      createdAt: userCart.createdAt,
      updatedAt: userCart.updatedAt,
    };

    return c.json(
      successResponse(emptyCartResponse, "Cart cleared successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error clearing cart:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to clear cart"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
