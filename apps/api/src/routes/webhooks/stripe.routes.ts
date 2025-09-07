import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import HttpStatusCodes from "@/utils/http-status-codes";
import {
  genericErrorContent,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Webhooks"];

export const stripeWebhook = createRoute({
  path: "/webhooks/stripe",
  method: "post",
  hide: true,
  tags,
  description: "Handle Stripe webhook events",
  request: {
    headers: z.object({
      "stripe-signature": z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Webhook processed successfully",
      schema: z.object({
        received: z.boolean(),
      }),
      resObj: {
        details: "Webhook processed successfully",
        data: { received: true },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: genericErrorContent(
      "BAD_REQUEST",
      "Invalid webhook",
      "Invalid webhook signature or payload",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type StripeWebhookRoute = typeof stripeWebhook;
