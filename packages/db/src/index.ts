import { drizzle } from "drizzle-orm/mysql2";

import * as authSchema from "./db/schemas/auth-schema";
import * as cartSchema from "./db/schemas/cart-schema";
import * as orderSchema from "./db/schemas/order-schema";
import * as productSchema from "./db/schemas/product-schema";
import * as userSchema from "./db/schemas/user-schema";
import env from "./lib/env";

declare global {
  var _db: ReturnType<typeof drizzle> | undefined;
}

const connection = drizzle(env.DATABASE_URL, {
  schema: {
    ...authSchema,
    ...userSchema,
    ...productSchema,
    ...cartSchema,
    ...orderSchema,
  },
  mode: "default",
  casing: "snake_case",
});

const db = globalThis._db || connection;

if (env.NODE_ENV !== "production") {
  globalThis._db = db;
}

export * from "drizzle-orm";
export default db;
