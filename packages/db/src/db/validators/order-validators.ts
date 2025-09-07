import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { order, orderItem } from "../schemas/order-schema";
import { ProductSelectSchema } from "./product-validators";
import { UserSelectSchema } from "./user-validators";

export const OrderItemSelectSchema = createSelectSchema(orderItem).extend({
  product: ProductSelectSchema,
});

export const OrderSelectSchema = createSelectSchema(order).extend({
  orderItems: OrderItemSelectSchema.array(),
});

export const OrderWithCustomerSelectSchema = createSelectSchema(order).extend({
  orderItems: OrderItemSelectSchema.array(),
  customer: UserSelectSchema,
});

export const CreateCheckoutResponseSchema = z.object({
  order: OrderSelectSchema,
  checkoutUrl: z.url(),
  checkoutSessionId: z.string(),
  stripePublishableKey: z.string(),
});

export type OrderItemSelect = z.infer<typeof OrderItemSelectSchema>;
export type OrderSelect = z.infer<typeof OrderSelectSchema>;
export type CreateCheckoutResponse = z.infer<
  typeof CreateCheckoutResponseSchema
>;
