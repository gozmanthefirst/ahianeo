import { createDb } from "@repo/db";

import type { Environment } from "@/lib/env";

export const getCategoryById = async (id: string, env: Environment) => {
  const db = createDb(env.DATABASE_URL);

  const result = await db.query.category.findFirst({
    where: (category, { eq }) => eq(category.id, id),
    with: {
      productCategories: {
        with: {
          product: true,
        },
      },
    },
  });

  if (!result) return null;

  const { productCategories, ...category } = result;
  const products = productCategories.map((pc) => pc.product);

  return { ...category, products };
};
