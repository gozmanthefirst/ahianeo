import { db } from "@repo/db";

export const getProducts = async () => {
  const result = await db.query.product.findMany({
    with: {
      creator: true,
      productCategories: {
        with: {
          category: true,
        },
      },
    },
  });

  if (!result) return null;

  const products = result.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    stockQuantity: product.stockQuantity,
    sizes: product.sizes,
    colors: product.colors,
    images: product.images,
    createdBy: product.createdBy,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    categories: product.productCategories?.map((pc) => pc.category) ?? [],
    creator: product.creator,
  }));

  return products;
};

export const getProductById = async (id: string) => {
  const result = await db.query.product.findFirst({
    where: (product, { eq }) => eq(product.id, id),
    with: {
      creator: true,
      productCategories: {
        with: {
          category: true,
        },
      },
    },
  });

  if (!result) return null;

  const { productCategories, ...product } = result;
  const categories = productCategories.map((pc) => pc.category);

  return { ...product, categories };
};
