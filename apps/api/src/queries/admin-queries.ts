import { createDb } from "@repo/db";
import type { User } from "@repo/db/validators/user-validators";

import { betterAuthInit } from "@/lib/auth";
import { sendAccountCreatedEmail } from "@/lib/email";
import type { Environment } from "@/lib/env";
import type { Role } from "@/lib/types";
import { getUserByEmail } from "@/queries/user-queries";
import { generatePassword } from "@/utils/strings";

export const createUser = async (
  user: {
    name: string;
    email: string;
    role: Role;
  },
  env: Environment,
): Promise<User> => {
  console.log("Initializing auth...");

  const auth = betterAuthInit(env);

  console.log(`Checking if user with email ${user.email} exists...`);

  // Check if the user with the email already exists
  const existingUser = await getUserByEmail(user.email, env);

  if (existingUser) {
    console.log("User already exists, returning existing user.");

    return existingUser;
  }

  console.log("User does not exist, creating new user...");

  console.log("Generating password...");

  // If the user does not exist, create a new one
  const password = generatePassword();

  console.log(`Creating user with email ${user.email}...`);

  const { user: newUser } = await auth.api.createUser({
    body: {
      email: user.email,
      name: user.name,
      role: user.role,
      password,
    },
  });

  console.log("User created, sending account created email...");

  // Send account created & verification emails
  await sendAccountCreatedEmail({
    to: user.email,
    role: user.role,
    env,
    name: user.name,
    email: user.email,
    password,
  });

  console.log("Sending verification email...");

  await auth.api.sendVerificationEmail({
    body: {
      email: user.email,
    },
  });

  console.log("User creation process completed.");

  return newUser as User;
};

export const createSuperadmin = async (env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  console.log("Checking for superadmin user...");

  const superadmin = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.role, "superadmin"),
  });

  if (!superadmin) {
    console.log("No superadmin found, creating one...");

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
