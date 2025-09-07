import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { order, orderItem } from "../schemas/order-schema";
import { ProductSelectSchema } from "./product-validators";

// Order item response schema
export const OrderItemSelectSchema = createSelectSchema(orderItem).extend({
  product: ProductSelectSchema,
});

// Order response schema (simplified)
export const OrderSelectSchema = createSelectSchema(order).extend({
  orderItems: OrderItemSelectSchema.array(),
});

// Create checkout response schema
export const CreateCheckoutResponseSchema = z.object({
  order: OrderSelectSchema,
  checkoutUrl: z.string().url(),
  checkoutSessionId: z.string(),
  stripePublishableKey: z.string(),
});

export type OrderItemSelect = z.infer<typeof OrderItemSelectSchema>;
export type OrderSelect = z.infer<typeof OrderSelectSchema>;
export type CreateCheckoutResponse = z.infer<
  typeof CreateCheckoutResponseSchema
>;
