import z, { type ZodError } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  FRONTEND_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.url(),
  SUPERADMIN_EMAIL: z.email(),
  AUTH_COOKIE: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_DOMAIN: z.string().min(1),
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().min(1),
  CLOUDFLARE_R2_PUBLIC_URL: z.url(),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

let env: Env;

try {
  const parsedEnv = EnvSchema.parse(process.env);

  env = {
    ...parsedEnv,
    AUTH_COOKIE:
      parsedEnv.NODE_ENV === "production"
        ? `__Secure-${parsedEnv.AUTH_COOKIE}`
        : parsedEnv.AUTH_COOKIE,
  };
} catch (e) {
  const error = e as ZodError;
  console.error(z.prettifyError(error));
  process.exit(1);
}

export default env;
