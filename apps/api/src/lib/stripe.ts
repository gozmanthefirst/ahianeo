import Stripe from "stripe";

import type { Environment } from "./env";

export const stripeInit = (env: Environment) => {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
    typescript: true,
  });
};
