import { createDb, eq } from "@repo/db";
import { cart, cartItem } from "@repo/db/schemas/cart-schema";

import type { Environment } from "@/lib/env";

/**
 * Creates a new cart for the specified user
 */
export const createCartForUser = async (userId: string, env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const [newCart] = await db
    .insert(cart)
    .values({
      userId,
    })
    .returning();

  return newCart;
};

/**
 * Gets a user's cart with all cart items and products
 */
export const getUserCartWithItems = async (
  userId: string,
  env: Environment,
) => {
  const db = createDb(env.DATABASE_URL);

  const userCart = await db.query.cart.findFirst({
    where: (cart, { eq }) => eq(cart.userId, userId),
    with: {
      cartItems: {
        with: {
          product: true,
        },
      },
    },
  });

  return userCart;
};

/**
 * Gets or creates a cart for the user (fallback for existing users)
 */
export const getOrCreateUserCart = async (userId: string, env: Environment) => {
  // First try to get existing cart
  let userCart = await getUserCartWithItems(userId, env);

  // If no cart exists, create one
  if (!userCart) {
    await createCartForUser(userId, env);

    // Fetch the cart with relations
    userCart = await getUserCartWithItems(userId, env);
  }

  return userCart;
};

/**
 * Gets a specific cart item for a product in a cart
 */
export const getCartItem = async (
  cartId: string,
  productId: string,
  env: Environment,
) => {
  const db = createDb(env.DATABASE_URL);

  const cartItem = await db.query.cartItem.findFirst({
    where: (cartItem, { eq, and }) =>
      and(eq(cartItem.cartId, cartId), eq(cartItem.productId, productId)),
  });

  return cartItem;
};

/**
 * Adds a new item to the cart
 */
export const addCartItem = async (
  cartId: string,
  productId: string,
  quantity: number,
  env: Environment,
) => {
  const db = createDb(env.DATABASE_URL);

  const [newCartItem] = await db
    .insert(cartItem)
    .values({
      cartId,
      productId,
      quantity,
    })
    .returning();

  return newCartItem;
};

/**
 * Updates the quantity of an existing cart item
 */
export const updateCartItemQuantity = async (
  cartItemId: string,
  quantity: number,
  env: Environment,
) => {
  const db = createDb(env.DATABASE_URL);

  const [updatedCartItem] = await db
    .update(cartItem)
    .set({ quantity })
    .where(eq(cartItem.id, cartItemId))
    .returning();

  return updatedCartItem;
};

/**
 * Gets a cart item with cart and product details for ownership validation
 */
export const getCartItemWithDetails = async (
  cartItemId: string,
  env: Environment,
) => {
  const db = createDb(env.DATABASE_URL);

  const cartItemWithDetails = await db.query.cartItem.findFirst({
    where: eq(cartItem.id, cartItemId),
    with: {
      cart: true,
      product: true,
    },
  });

  return cartItemWithDetails;
};

/**
 * Deletes a cart item by ID
 */
export const deleteCartItem = async (cartItemId: string, env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const [deletedCartItem] = await db
    .delete(cartItem)
    .where(eq(cartItem.id, cartItemId))
    .returning();

  return deletedCartItem;
};

/**
 * Clears all items from a user's cart
 */
export const clearCartItems = async (cartId: string, env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const deletedItems = await db
    .delete(cartItem)
    .where(eq(cartItem.cartId, cartId))
    .returning();

  return deletedItems;
};

/**
 * Clear all cart items for a specific user (by user ID)
 */
export const clearCartItemsByUserId = async (
  userId: string,
  env: Environment,
) => {
  const db = createDb(env.DATABASE_URL);

  // First get the user's cart
  const userCart = await db.query.cart.findFirst({
    where: (cart, { eq }) => eq(cart.userId, userId),
  });

  if (!userCart) {
    return;
  }

  // Clear all items from the cart
  const deletedItems = await db
    .delete(cartItem)
    .where(eq(cartItem.cartId, userCart.id))
    .returning();

  return deletedItems;
};
