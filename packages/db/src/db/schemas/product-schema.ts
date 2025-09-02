import {
  decimal,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { timestamps } from "../../lib/helpers";
import { user } from "./user-schema";

export const product = mysqlTable("product", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: int("stock_quantity").default(0),
  sizes: json("sizes").$type<string[]>().default([]),
  colors: json("colors").$type<string[]>().default([]),
  createdBy: varchar("created_by", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

export const category = mysqlTable("category", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const productImage = mysqlTable("product_image", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 })
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productCategory = mysqlTable("product_category", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 })
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id", { length: 36 })
    .notNull()
    .references(() => category.id, { onDelete: "cascade" }),
});
