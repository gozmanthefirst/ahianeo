import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { category, product } from "../schemas/product-schema";
import { UserSelectSchema } from "./user-validators";

export const CategorySelectSchema = createSelectSchema(category);

export const ProductSelectSchema = createSelectSchema(product);

export const CategoryExtendedSchema = CategorySelectSchema.extend({
  products: ProductSelectSchema.array(),
});

export const ProductExtendedSchema = ProductSelectSchema.extend({
  categories: CategorySelectSchema.array(),
  creator: UserSelectSchema.optional(),
});

export const CreateCategorySchema = createInsertSchema(category, {
  name: (n) => n.min(1),
}).pick({
  name: true,
});

export const UpdateCategorySchema = CreateCategorySchema;
