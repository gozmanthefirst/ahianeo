import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

import { timestamps } from "../../lib/helpers";
import { product } from "./product-schema";
import { user } from "./user-schema";

export const cart = mysqlTable("cart", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => user.id, {
    onDelete: "cascade",
  }),
  ...timestamps,
});

export const cartItem = mysqlTable("cart_item", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  cartId: varchar("cart_id", { length: 36 })
    .notNull()
    .references(() => cart.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 })
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  quantity: int("quantity").notNull().default(1),
  ...timestamps,
});
