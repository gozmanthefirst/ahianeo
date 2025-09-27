import { Resend } from "resend";

import type { Environment } from "./env";

const resendInit = (env: Environment) => {
  return new Resend(env.RESEND_API_KEY);
};

type SendEmail = {
  to: string;
  token: string;
  env: Environment;
  name?: string;
  url?: string;
};

export const sendVerificationEmail = async ({
  to,
  token,
  env,
  name,
  url,
}: SendEmail) => {
  const resend = resendInit(env);
  const verificationUrl =
    url ?? `${env.FRONTEND_URL}/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: `Ahianeo <ahianeo@${env.RESEND_DOMAIN}>`,
    to,
    subject: "Verify your email address",
    html: `
      <h1>Hello ${name || "there"}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
  });
};

export const sendResetPasswordEmail = async ({
  to,
  token,
  env,
  name,
  url,
}: SendEmail) => {
  const resend = resendInit(env);
  const resetPasswordUrl =
    url ?? `${env.FRONTEND_URL}/auth/reset-password?token=${token}`;

  await resend.emails.send({
    from: `Ahianeo <ahianeo@${env.RESEND_DOMAIN}>`,
    to,
    subject: "Reset your password",
    html: `
      <h1>Hello ${name || "there"}!</h1>
      <p>Please reset your password by clicking the link below:</p>
      <a href="${resetPasswordUrl}">Reset Password</a>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
  });
};

export const sendAccountCreatedEmail = async ({
  to,
  role,
  env,
  name,
  email,
  password,
}: Omit<SendEmail, "url" | "token"> & {
  role: string;
  email: string;
  password: string;
}) => {
  const resend = resendInit(env);
  await resend.emails.send({
    from: `Ahianeo <ahianeo@${env.RESEND_DOMAIN}>`,
    to,
    subject: `Your ${role} account has been created`,
    html: `
      <h1>Hello ${name || "there"}!</h1>
      <p>Your ${role} account has been successfully created. You can now log in using the details below:</p>
      <ul>
        <li>Email: ${email}</li>
        <li>Password: ${password}</li>
      </ul>
      <p>For your security, please change your password after logging in.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
  });
};
