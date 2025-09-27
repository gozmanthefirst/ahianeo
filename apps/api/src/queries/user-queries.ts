import { createDb } from "@repo/db";

import type { Environment } from "@/lib/env";

/**
 * Returns the user with the given ID, or null if not found.
 */
export const getUserById = async (userId: string, env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  });

  return user || null;
};

/**
 * Returns the user with the given email, or null if not found.
 */
export const getUserByEmail = async (email: string, env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, email),
  });

  return user || null;
};

/**
 * Returns the session with the given token, or null if not found.
 */
export const getSessionByToken = async (
  sessionToken: string,
  env: Environment,
) => {
  const db = createDb(env.DATABASE_URL);

  const session = await db.query.session.findFirst({
    where: (session, { eq }) => eq(session.token, sessionToken),
  });

  return session || null;
};
