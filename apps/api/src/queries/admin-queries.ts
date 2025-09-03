import db from "@repo/db";
import type { User } from "@repo/db/validators/user-validators";

import { auth } from "@/lib/auth";
import { sendAccountCreatedEmail } from "@/lib/email";
import env from "@/lib/env";
import type { Role } from "@/lib/types";
import { getUserByEmail } from "@/queries/user-queries";
import { generatePassword } from "@/utils/strings";

export const createUser = async (c: {
  name: string;
  email: string;
  role: Role;
}): Promise<User> => {
  // Check if the user with the email already exists
  const existingUser = await getUserByEmail(c.email);

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
    name: c.name,
    role: c.role,
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

export const createSuperadmin = async () => {
  const superadmin = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.role, "superadmin"),
  });

  if (!superadmin) {
    await createUser({
      name: "Super Admin",
      email: env.SUPERADMIN_EMAIL,
      role: "superadmin",
    });
  }
};
