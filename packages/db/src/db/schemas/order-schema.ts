import {
  decimal,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { timestamps } from "../../lib/helpers";
import { product } from "./product-schema";
import { user } from "./user-schema";

export const order = mysqlTable("order", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  email: varchar("email", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: text("shipping_address").notNull(),
  ...timestamps,
});

export const orderItem = mysqlTable("order_item", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: varchar("order_id", { length: 36 })
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 })
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
