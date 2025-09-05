import z, { type ZodError } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8000),
  FRONTEND_URL: z.url(),
  DATABASE_URL: z.url(),
  SUPERADMIN_EMAIL: z.email(),
  AUTH_COOKIE: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url(),
  RESEND_API_KEY: z.string(),
  CLOUDFLARE_R2_ACCOUNT_ID: z.string(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string(),
  CLOUDFLARE_R2_BUCKET_NAME: z.string(),
  CLOUDFLARE_R2_PUBLIC_URL: z.url(),
});

export type Env = z.infer<typeof EnvSchema>;

let env: Env;

try {
  env = EnvSchema.parse(process.env);
} catch (e) {
  const error = e as ZodError;
  console.error(z.prettifyError(error));
  process.exit(1);
}

export default env;
