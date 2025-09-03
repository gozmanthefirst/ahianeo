import { createSelectSchema } from "drizzle-zod";

import { category, product } from "../schemas/product-schema";

export const CategorySelectSchema = createSelectSchema(category);

export const ProductSelectSchema = createSelectSchema(product);
