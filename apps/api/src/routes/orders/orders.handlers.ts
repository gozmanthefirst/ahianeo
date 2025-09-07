import db, { eq } from "@repo/db";
import { order } from "@repo/db/schemas/order-schema";

import env from "@/lib/env";
import { stripe } from "@/lib/stripe";
import type { AppRouteHandler } from "@/lib/types";
import { getUserCartWithItems } from "@/queries/cart-queries";
import {
  createOrder,
  createOrderItems,
  getOrderById,
  reserveStock,
} from "@/queries/order-queries";
import type { CreateCheckoutRoute } from "@/routes/orders/orders.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";

export const createCheckout: AppRouteHandler<CreateCheckoutRoute> = async (
  c,
) => {
  const user = c.get("user");

  try {
    // Get user's cart with items
    const userCart = await getUserCartWithItems(user.id);

    if (!userCart || userCart.cartItems.length === 0) {
      return c.json(
        errorResponse(
          "INVALID_DATA",
          "Cart is empty. Add items to cart before creating order.",
        ),
        HttpStatusCodes.BAD_REQUEST,
      );
    }

    // Validate cart items and stock availability
    const cartValidationErrors: string[] = [];
    let totalAmount = 0;

    for (const cartItem of userCart.cartItems) {
      // Check if product still exists
      if (!cartItem.product) {
        cartValidationErrors.push(
          `Product with ID ${cartItem.productId} no longer exists.`,
        );
        continue;
      }

      // Check stock availability
      const availableStock = cartItem.product.stockQuantity || 0;
      if (cartItem.quantity > availableStock) {
        cartValidationErrors.push(
          `Not enough stock for "${cartItem.product.name}". Requested: ${cartItem.quantity}, Available: ${availableStock}`,
        );
        continue;
      }

      // Calculate total
      totalAmount += parseFloat(cartItem.product.price) * cartItem.quantity;
    }

    // Return validation errors if any
    if (cartValidationErrors.length > 0) {
      return c.json(
        errorResponse("INVALID_CART_STATE", cartValidationErrors.join(" ")),
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
      );
    }

    // Create order and checkout session in transaction
    const result = await db.transaction(async () => {
      // Create order first (simplified)
      const newOrder = await createOrder(
        user.id,
        user.email,
        totalAmount.toFixed(2),
        null, // No session ID yet
      );

      // Create order items with frozen prices
      const orderItemsData = userCart.cartItems.map((cartItem) => ({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        unitPrice: cartItem.product.price,
      }));

      await createOrderItems(newOrder.id, orderItemsData);

      // Reserve stock immediately
      const stockReservationData = userCart.cartItems.map((cartItem) => ({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
      }));

      await reserveStock(stockReservationData);

      // Create Stripe Checkout Session (fixed)
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: userCart.cartItems.map((cartItem) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: cartItem.product.name,
              description: cartItem.product.description || undefined, // Fix: null → undefined
              images: cartItem.product.images
                .map((img) => img.url)
                .filter((url): url is string => Boolean(url)), // Fix: filter out null URLs
            },
            unit_amount: Math.round(parseFloat(cartItem.product.price) * 100),
          },
          quantity: cartItem.quantity,
        })),
        mode: "payment",
        success_url: `${env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.FRONTEND_URL}/checkout/cancel`,
        customer_email: user.email,
        client_reference_id: newOrder.id,
        metadata: {
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          userId: user.id,
        },
        shipping_address_collection: {
          allowed_countries: ["US", "CA", "GB", "AU", "NG"],
        },
        billing_address_collection: "required",
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      });

      // Update order with checkout session ID
      await db
        .update(order)
        .set({
          stripeCheckoutSessionId: checkoutSession.id, // Updated field name
        })
        .where(eq(order.id, newOrder.id));

      return {
        order: newOrder,
        checkoutSession,
      };
    });

    // Fetch complete order with relations
    const orderWithItems = await getOrderById(result.order.id);

    if (!orderWithItems) {
      return c.json(
        errorResponse(
          "INTERNAL_SERVER_ERROR",
          "Failed to retrieve created order",
        ),
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    // Format order items response
    const formattedOrderItems = orderWithItems.orderItems.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subTotal: item.subTotal,
      product: item.product,
      createdAt: item.createdAt,
    }));

    // Updated order response (removed address fields, updated field names)
    const orderResponse = {
      id: orderWithItems.id,
      orderNumber: orderWithItems.orderNumber,
      userId: orderWithItems.userId,
      email: orderWithItems.email,
      status: orderWithItems.status,
      paymentStatus: orderWithItems.paymentStatus,
      totalAmount: orderWithItems.totalAmount,
      stripeCheckoutSessionId: orderWithItems.stripeCheckoutSessionId, // Updated field name
      paymentMethod: orderWithItems.paymentMethod,
      orderItems: formattedOrderItems,
      createdAt: orderWithItems.createdAt,
      updatedAt: orderWithItems.updatedAt,
    };

    const checkoutResponse = {
      order: orderResponse,
      checkoutUrl: result.checkoutSession.url,
      checkoutSessionId: result.checkoutSession.id,
      stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY,
    };

    return c.json(
      successResponse(checkoutResponse, "Order created successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error creating checkout:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to create order"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
