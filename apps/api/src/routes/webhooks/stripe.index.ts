import { createRouter } from "@/lib/create-app";
import * as stripeHandlers from "@/routes/webhooks/stripe.handlers";
import * as stripeRoutes from "@/routes/webhooks/stripe.routes";

const stripeWebhookRouter = createRouter();

// Stripe webhook endpoint (no auth middleware - Stripe signature verification instead)
stripeWebhookRouter.openapi(
  stripeRoutes.stripeWebhook,
  stripeHandlers.handleStripeWebhook,
);

export default stripeWebhookRouter;
