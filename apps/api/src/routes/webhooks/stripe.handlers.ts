import db from "@repo/db";
import type Stripe from "stripe";

import env from "@/lib/env";
import { stripe } from "@/lib/stripe";
import type { AppRouteHandler } from "@/lib/types";
import { clearCartItemsByUserId } from "@/queries/cart-queries";
import {
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
      errorResponse(
        "BAD_REQUEST",
        "Missing Stripe signature in request headers",
      ),
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  try {
    // Webhook verification
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      // Checkout Session Events
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

      case "checkout.session.async_payment_failed":
        await handleCheckoutCancelled(
          event.data.object as Stripe.Checkout.Session,
        );
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
      const order = await getOrderByStripeSessionId(session.id);

      if (!order) {
        console.error(`Order not found for checkout session: ${session.id}`);
        return;
      }

      // Update order status to completed and payment status to paid
      await updateOrderStatus(
        order.id,
        "completed",
        "paid",
        session.payment_method_types?.[0] || "card",
      );

      // Clear user's cart
      if (order.userId) {
        await clearCartItemsByUserId(order.userId);
        console.log(`Cart cleared for user: ${order.userId}`);
      }

      console.log(`Order ${order.orderNumber} marked as paid and completed`);
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
      const order = await getOrderByStripeSessionId(session.id);

      if (!order) {
        console.error(`Order not found for checkout session: ${session.id}`);
        return;
      }

      // Update order status to cancelled and payment status to failed
      await updateOrderStatus(order.id, "cancelled", "failed");

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

/**
 * Handle cancelled checkout session (payment failure)
 */
const handleCheckoutCancelled = async (session: Stripe.Checkout.Session) => {
  console.log(`Processing checkout cancellation for session: ${session.id}`);

  try {
    await db.transaction(async () => {
      const order = await getOrderByStripeSessionId(session.id);

      if (!order) {
        console.error(`Order not found for checkout session: ${session.id}`);
        return;
      }

      // Update order status to cancelled and payment status to failed
      await updateOrderStatus(order.id, "cancelled", "failed");

      // RESTORE RESERVED STOCK
      const stockToRestore = order.orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      await restoreStock(stockToRestore);

      console.log(`Stock restored for cancelled session ${order.orderNumber}`);
    });
  } catch (error) {
    console.error("Error handling checkout cancellation:", error);
    throw error;
  }
};
