import { drizzle } from "drizzle-orm/mysql2";

import * as authSchema from "./db/schemas/auth-schema";
import * as userSchema from "./db/schemas/user-schema";
import env from "./lib/env";

declare global {
  var _db: ReturnType<typeof drizzle> | undefined;
}

const connection = drizzle(env.DATABASE_URL, {
  schema: {
    ...authSchema,
    ...userSchema,
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
