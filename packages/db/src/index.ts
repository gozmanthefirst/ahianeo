import { drizzle } from "drizzle-orm/node-postgres";

import * as authSchema from "./db/schemas/auth-schema";
import * as cartSchema from "./db/schemas/cart-schema";
import * as orderSchema from "./db/schemas/order-schema";
import * as productSchema from "./db/schemas/product-schema";
import * as userSchema from "./db/schemas/user-schema";

const createDb = (dbUrl: string) => {
  return drizzle(dbUrl, {
    schema: {
      ...authSchema,
      ...userSchema,
      ...productSchema,
      ...cartSchema,
      ...orderSchema,
    },
    casing: "snake_case",
  });
};

export * from "drizzle-orm";
export { createDb };
