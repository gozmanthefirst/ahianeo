import { db } from "@repo/db";

export const getCategoryById = async (id: string) => {
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
