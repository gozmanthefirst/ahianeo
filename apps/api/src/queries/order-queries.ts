import db, { eq, sql } from "@repo/db";
import { order, orderItem } from "@repo/db/schemas/order-schema";
import { product } from "@repo/db/schemas/product-schema";

/**
 * Generate a random order number
 */
export const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString().slice(2, 8).padStart(6, "0");
  return `ORD-${year}-${randomSuffix}`;
};

/**
 * Create a new order (simplified for Stripe Checkout)
 */
export const createOrder = async (
  userId: string,
  email: string,
  totalAmount: string,
  stripeSessionId?: string | null,
) => {
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
) => {
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
 * Get order by ID with all relations
 */
export const getOrderById = async (orderId: string) => {
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
 * Get order by Stripe Checkout Session ID
 */
export const getOrderByStripeSessionId = async (sessionId: string) => {
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

// Add this function that was referenced but missing
export const getOrderByStripePaymentIntentId = async (
  paymentIntentId: string,
) => {
  // This is for backward compatibility with old PaymentIntent-based orders
  const orderWithItems = await db.query.order.findFirst({
    where: (order, { eq }) =>
      eq(order.stripeCheckoutSessionId, paymentIntentId), // Using same field
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
  paymentStatus?: string,
  paymentMethod?: string,
) => {
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
 * Get user's cart by user ID (for clearing)
 */
export const getUserCartId = async (userId: string) => {
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
) => {
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
) => {
  for (const item of orderItems) {
    await db
      .update(product)
      .set({
        stockQuantity: sql`${product.stockQuantity} + ${item.quantity}`,
      })
      .where(eq(product.id, item.productId));
  }
};
