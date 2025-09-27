import z from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8000),
  FRONTEND_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.url(),
  SUPERADMIN_EMAIL: z.email(),
  AUTH_COOKIE: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_DOMAIN: z.string(),
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().min(1),
  CLOUDFLARE_R2_PUBLIC_URL: z.url(),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
});

export type Environment = z.infer<typeof EnvSchema>;

// biome-ignore lint/suspicious/noExplicitAny: Required for dynamic parsing
export const parseEnv = (data: any): Environment => {
  const { data: env, error } = EnvSchema.safeParse(data);

  if (error) {
    throw new Error(z.prettifyError(error));
  }

  return env;
};
