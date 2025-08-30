import { drizzle } from "drizzle-orm/mysql2";

import * as authSchema from "./db/schemas/auth-schema";
import * as userSchema from "./db/schemas/user-schema";
import env from "./lib/env";

const db = drizzle(env.DATABASE_URL, {
  schema: {
    ...authSchema,
    ...userSchema,
  },
  mode: "default",
  casing: "snake_case",
});

export * from "drizzle-orm";
export default db;
