import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { cart, cartItem } from "../schemas/cart-schema";
import { ProductSelectSchema } from "./product-validators";

export const CartItemSelectSchema = createSelectSchema(cartItem).extend({
  product: ProductSelectSchema,
  quantity: z.int().min(1),
  subAmount: z.string().regex(/^\d+(\.\d{2})?$/),
});

export const CartSelectSchema = createSelectSchema(cart).extend({
  cartItems: CartItemSelectSchema.array(),
  totalItems: z.int().nonnegative(),
  totalAmount: z.string().regex(/^\d+(\.\d{2})?$/),
});

export const AddToCartSchema = createInsertSchema(cartItem, {
  quantity: z.int().min(1).default(1),
}).pick({
  productId: true,
  quantity: true,
});

export const UpdateCartItemSchema = createInsertSchema(cartItem, {
  quantity: z.int().min(1),
}).pick({
  quantity: true,
});
