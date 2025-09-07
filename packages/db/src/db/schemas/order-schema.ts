import { relations } from "drizzle-orm";
import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "../../lib/helpers";
import { product } from "./product-schema";
import { user } from "./user-schema";

export const order = pgTable("order", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  userId: text("user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, shipped, delivered, cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed, refunded
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"), // Renamed for clarity
  paymentMethod: text("payment_method"), // card, apple_pay, google_pay, etc.
  ...timestamps,
});

export const orderRelations = relations(order, ({ many, one }) => ({
  customer: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  orderItems: many(orderItem),
}));

export const orderItem = pgTable("order_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subTotal: numeric("sub_total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
}));
