import type { InferSelectModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { user } from "../schemas/user-schema";

export const UserSelectSchema = createSelectSchema(user);

export const UserUpdateSchema = createInsertSchema(user, {
  name: z.string().min(1).max(100),
  image: z.url(),
})
  .pick({
    name: true,
    image: true,
  })
  .partial();

export const CreateUserSchema = createInsertSchema(user, {
  name: z.string().min(1).max(100),
  email: z.email(),
  role: z.enum(["user", "admin"]),
}).pick({
  name: true,
  email: true,
  role: true,
});

export const BanUserSchema = z.object({
  userId: z.string().min(1),
  banReason: z.string().min(1).default("No reason provided"),
  banExpiresIn: z
    .number()
    .min(60 * 60)
    .optional(),
});

export type User = InferSelectModel<typeof user>;
