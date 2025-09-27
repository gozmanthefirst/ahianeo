import { createDb } from "@repo/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin, bearer, openAPI } from "better-auth/plugins";

import { sendResetPasswordEmail, sendVerificationEmail } from "@/lib/email";
import { ac, admin, superadmin, user } from "@/lib/permissions";
import { createCartForUser } from "@/queries/cart-queries";
import type { Environment } from "./env";

export const betterAuthInit = (env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    basePath: "/api/better-auth",

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, token }) => {
        await sendResetPasswordEmail({
          to: user.email,
          token,
          env,
          name: user.name,
        });
      },
      revokeSessionsOnPasswordReset: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, token }) => {
        await sendVerificationEmail({
          to: user.email,
          name: user.name,
          token,
          env,
        });
      },
    },

    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await createCartForUser(user.id, env);
          },
        },
      },
    },

    plugins: [
      openAPI(),
      bearer(),
      adminPlugin({
        ac,
        roles: {
          user,
          admin,
          superadmin,
        },
        adminRoles: ["admin", "superadmin"],
        impersonationSessionDuration: 60 * 60 * 24,
      }),
    ],
  });
};
