import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { category, product } from "../schemas/product-schema";

export const CategorySelectSchema = createSelectSchema(category);

export const ProductSelectSchema = createSelectSchema(product);

export const CreateCategorySchema = createInsertSchema(category, {
  name: (n) => n.min(1),
}).pick({
  name: true,
});
