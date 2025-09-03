import { drizzle } from "drizzle-orm/node-postgres";

import * as authSchema from "./db/schemas/auth-schema";
import * as cartSchema from "./db/schemas/cart-schema";
import * as orderSchema from "./db/schemas/order-schema";
import * as productSchema from "./db/schemas/product-schema";
import * as userSchema from "./db/schemas/user-schema";
import env from "./lib/env";

const db = drizzle(env.DATABASE_URL, {
  schema: {
    ...authSchema,
    ...userSchema,
    ...productSchema,
    ...cartSchema,
    ...orderSchema,
  },
  casing: "snake_case",
});

export * from "drizzle-orm";
export default db;
