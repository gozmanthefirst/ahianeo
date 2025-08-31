import db from "@repo/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin, bearer, openAPI } from "better-auth/plugins";

import { sendResetPasswordEmail, sendVerificationEmail } from "@/lib/email";
import { ac, admin, superadmin, user } from "@/lib/permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
  }),
  basePath: "/api/better-auth",

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, token }) => {
      await sendResetPasswordEmail({
        to: user.email,
        name: user.name,
        token,
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
      });
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
