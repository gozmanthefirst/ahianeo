import db from "@repo/db";
import type Stripe from "stripe";

import env from "@/lib/env";
import { stripe } from "@/lib/stripe";
import type { AppRouteHandler } from "@/lib/types";
import { clearCartItemsByUserId } from "@/queries/cart-queries";
import {
  getOrderByStripePaymentIntentId, // Keep for backward compatibility
  getOrderByStripeSessionId,
  restoreStock,
  updateOrderStatus,
} from "@/queries/order-queries";
import type { StripeWebhookRoute } from "@/routes/webhooks/stripe.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";

export const handleStripeWebhook: AppRouteHandler<StripeWebhookRoute> = async (
  c,
) => {
  const signature = c.req.header("stripe-signature");
  const body = await c.req.text();

  if (!signature) {
    return c.json(
      errorResponse("BAD_REQUEST", "Missing Stripe signature"),
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  try {
    // Use ASYNC webhook verification
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      // Checkout Session Events (Primary)
      case "checkout.session.completed":
        await handleCheckoutSuccess(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "checkout.session.expired":
        await handleCheckoutExpired(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      // PaymentIntent Events (Keep for backward compatibility)
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.canceled":
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return c.json(
      successResponse({ received: true }, "Webhook processed successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return c.json(
      errorResponse("BAD_REQUEST", "Invalid webhook signature or payload"),
      HttpStatusCodes.BAD_REQUEST,
    );
  }
};

/**
 * Handle successful checkout session
 */
const handleCheckoutSuccess = async (session: Stripe.Checkout.Session) => {
  console.log(`Processing checkout success for session: ${session.id}`);

  try {
    await db.transaction(async () => {
      // Get the order by session ID
      const order = await getOrderByStripeSessionId(session.id);

      if (!order) {
        console.error(`Order not found for checkout session: ${session.id}`);
        return;
      }

      // Update order status to COMPLETED and payment status to paid
      await updateOrderStatus(
        order.id,
        "completed", // ← CHANGED FROM "processing" TO "completed"
        "paid", // Payment status
        session.payment_method_types?.[0] || "card", // Payment method
      );

      // Clear user's cart - payment successful
      if (order.userId) {
        await clearCartItemsByUserId(order.userId);
        console.log(`Cart cleared for user: ${order.userId}`);
      }

      console.log(`Order ${order.orderNumber} marked as paid and completed`); // ← Updated log message
    });
  } catch (error) {
    console.error("Error handling checkout success:", error);
    throw error;
  }
};

/**
 * Handle expired checkout session
 */
const handleCheckoutExpired = async (session: Stripe.Checkout.Session) => {
  console.log(`Processing checkout expiration for session: ${session.id}`);

  try {
    await db.transaction(async () => {
      // Get the order by session ID
      const order = await getOrderByStripeSessionId(session.id);

      if (!order) {
        console.error(`Order not found for checkout session: ${session.id}`);
        return;
      }

      // Update order status to cancelled
      await updateOrderStatus(
        order.id,
        "cancelled", // Order status
        "failed", // Payment status
      );

      // RESTORE RESERVED STOCK
      const stockToRestore = order.orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      await restoreStock(stockToRestore);

      console.log(`Stock restored for expired session ${order.orderNumber}`);
    });
  } catch (error) {
    console.error("Error handling checkout expiration:", error);
    throw error;
  }
};

// Keep existing PaymentIntent handlers for backward compatibility
const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
  console.log(`Processing payment success for: ${paymentIntent.id}`);

  try {
    await db.transaction(async () => {
      const order = await getOrderByStripePaymentIntentId(paymentIntent.id);

      if (!order) {
        console.error(
          `Order not found for payment intent: ${paymentIntent.id}`,
        );
        return;
      }

      await updateOrderStatus(
        order.id,
        "processing",
        "paid",
        getPaymentMethodType(paymentIntent),
      );

      if (order.userId) {
        await clearCartItemsByUserId(order.userId);
        console.log(`Cart cleared for user: ${order.userId}`);
      }

      console.log(`Order ${order.orderNumber} marked as paid and processing`);
    });
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw error;
  }
};

const handlePaymentFailure = async (paymentIntent: Stripe.PaymentIntent) => {
  console.log(`Processing payment failure for: ${paymentIntent.id}`);

  try {
    await db.transaction(async () => {
      const order = await getOrderByStripePaymentIntentId(paymentIntent.id);

      if (!order) {
        console.error(
          `Order not found for payment intent: ${paymentIntent.id}`,
        );
        return;
      }

      await updateOrderStatus(order.id, "pending", "failed");

      const stockToRestore = order.orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      await restoreStock(stockToRestore);

      console.log(
        `Stock restored for order ${order.orderNumber} due to payment failure`,
      );
    });
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
};

const handlePaymentCanceled = async (paymentIntent: Stripe.PaymentIntent) => {
  console.log(`Processing payment cancellation for: ${paymentIntent.id}`);

  try {
    await db.transaction(async () => {
      const order = await getOrderByStripePaymentIntentId(paymentIntent.id);

      if (!order) {
        console.error(
          `Order not found for payment intent: ${paymentIntent.id}`,
        );
        return;
      }

      await updateOrderStatus(order.id, "cancelled", "failed");

      const stockToRestore = order.orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      await restoreStock(stockToRestore);

      console.log(`Stock restored for cancelled order ${order.orderNumber}`);
    });
  } catch (error) {
    console.error("Error handling payment cancellation:", error);
    throw error;
  }
};

const getPaymentMethodType = (paymentIntent: Stripe.PaymentIntent): string => {
  if (
    paymentIntent.payment_method_types &&
    paymentIntent.payment_method_types.length > 0
  ) {
    return paymentIntent.payment_method_types[0];
  }
  return "unknown";
};
