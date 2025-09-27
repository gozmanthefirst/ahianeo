import { createDb } from "@repo/db";
import type { User } from "@repo/db/validators/user-validators";

import { betterAuthInit } from "@/lib/auth";
import { sendAccountCreatedEmail } from "@/lib/email";
import type { Environment } from "@/lib/env";
import type { Role } from "@/lib/types";
import { getUserByEmail } from "@/queries/user-queries";
import { generatePassword } from "@/utils/strings";

export const createUser = async (
  c: {
    name: string;
    email: string;
    role: Role;
  },
  env: Environment,
): Promise<User> => {
  const auth = betterAuthInit(env);

  // Check if the user with the email already exists
  const existingUser = await getUserByEmail(c.email, env);

  if (existingUser) {
    return existingUser;
  }

  // If the user does not exist, create a new one
  const password = generatePassword();

  const { user: newUser } = await auth.api.createUser({
    body: {
      email: c.email,
      name: c.name,
      role: c.role,
      password,
    },
  });

  // Send account created & verification emails
  await sendAccountCreatedEmail({
    to: c.email,
    role: c.role,
    env,
    name: c.name,
    email: c.email,
    password,
  });
  await auth.api.sendVerificationEmail({
    body: {
      email: c.email,
    },
  });

  return newUser as User;
};

export const createSuperadmin = async (env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const superadmin = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.role, "superadmin"),
  });

  if (!superadmin) {
    await createUser(
      {
        name: "Super Admin",
        email: env.SUPERADMIN_EMAIL,
        role: "superadmin",
      },
      env,
    );
  }
};
