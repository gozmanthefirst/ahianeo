import { createDb, desc, eq, sql } from "@repo/db";
import { order, orderItem } from "@repo/db/schemas/order-schema";
import { product } from "@repo/db/schemas/product-schema";

import type { Environment } from "@/lib/env";

/**
 * Get all orders with customer information (admin only)
 */
export const getAllOrders = async (env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const allOrders = await db.query.order.findMany({
    with: {
      orderItems: {
        with: {
          product: true,
        },
      },
      customer: true,
    },
    orderBy: [desc(order.createdAt)],
  });

  return allOrders;
};

/**
 * Get order by ID with customer information (admin only)
 */
export const getAdminOrderById = async (orderId: string, env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const orderWithItems = await db.query.order.findFirst({
    where: (order, { eq }) => eq(order.id, orderId),
    with: {
      orderItems: {
        with: {
          product: true,
        },
      },
      customer: true,
    },
  });

  return orderWithItems;
};

/**
 * Get user's orders with order items and products
 */
export const getUserOrders = async (userId: string, env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const userOrders = await db.query.order.findMany({
    where: (order, { eq }) => eq(order.userId, userId),
    with: {
      orderItems: {
        with: {
          product: true,
        },
      },
    },
    orderBy: [desc(order.createdAt)],
  });

  return userOrders;
};

/**
 * Generate a random order number
 */
export const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString().slice(2, 8).padStart(6, "0");
  return `ORD-${year}-${randomSuffix}`;
};

/**
 * Create a new order
 */
export const createOrder = async (
  userId: string,
  email: string,
  totalAmount: string,
  env: Environment,
  stripeSessionId?: string | null,
) => {
  const db = createDb(env.DATABASE_URL);
  const orderNumber = generateOrderNumber();

  const [newOrder] = await db
    .insert(order)
    .values({
      orderNumber,
      userId,
      email,
      totalAmount,
      stripeCheckoutSessionId: stripeSessionId,
      status: "pending",
      paymentStatus: "pending",
    })
    .returning();

  return newOrder;
};

/**
 * Create order items from cart items
 */
export const createOrderItems = async (
  orderId: string,
  cartItems: Array<{
    productId: string;
    quantity: number;
    unitPrice: string;
  }>,
  env: Environment,
) => {
  const db = createDb(env.DATABASE_URL);

  const orderItemsData = cartItems.map((item) => {
    const subTotal = (parseFloat(item.unitPrice) * item.quantity).toFixed(2);
    return {
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subTotal,
    };
  });

  const newOrderItems = await db
    .insert(orderItem)
    .values(orderItemsData)
    .returning();

  return newOrderItems;
};

/**
 * Get order by ID with all relations (no customer)
 */
export const getOrderById = async (orderId: string, env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const orderWithItems = await db.query.order.findFirst({
    where: (order, { eq }) => eq(order.id, orderId),
    with: {
      orderItems: {
        with: {
          product: true,
        },
      },
    },
  });

  return orderWithItems;
};

/**
 * Get order by Stripe Checkout Session ID
 */
export const getOrderByStripeSessionId = async (
  sessionId: string,
  env: Environment,
) => {
  const db = createDb(env.DATABASE_URL);

  const orderWithItems = await db.query.order.findFirst({
    where: (order, { eq }) => eq(order.stripeCheckoutSessionId, sessionId),
    with: {
      orderItems: {
        with: {
          product: true,
        },
      },
      customer: true,
    },
  });

  return orderWithItems;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: string,
  env: Environment,
  paymentStatus?: string,
  paymentMethod?: string,
) => {
  const db = createDb(env.DATABASE_URL);

  const updateData: Record<string, string> = { status };

  if (paymentStatus) {
    updateData.paymentStatus = paymentStatus;
  }

  if (paymentMethod) {
    updateData.paymentMethod = paymentMethod;
  }

  const [updatedOrder] = await db
    .update(order)
    .set(updateData)
    .where(eq(order.id, orderId))
    .returning();

  return updatedOrder;
};

/**
 * Get user's cart by user ID
 */
export const getUserCartId = async (userId: string, env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const userCart = await db.query.cart.findFirst({
    where: (cart, { eq }) => eq(cart.userId, userId),
  });

  return userCart;
};

/**
 * Reserve stock for order items
 */
export const reserveStock = async (
  cartItems: Array<{
    productId: string;
    quantity: number;
  }>,
  env: Environment,
) => {
  const db = createDb(env.DATABASE_URL);

  for (const item of cartItems) {
    await db
      .update(product)
      .set({
        stockQuantity: sql`${product.stockQuantity} - ${item.quantity}`,
      })
      .where(eq(product.id, item.productId));
  }
};

/**
 * Restore stock (when payment fails)
 */
export const restoreStock = async (
  orderItems: Array<{
    productId: string;
    quantity: number;
  }>,
  env: Environment,
) => {
  const db = createDb(env.DATABASE_URL);

  for (const item of orderItems) {
    await db
      .update(product)
      .set({
        stockQuantity: sql`${product.stockQuantity} + ${item.quantity}`,
      })
      .where(eq(product.id, item.productId));
  }
};
