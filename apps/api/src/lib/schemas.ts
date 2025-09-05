import { z } from "@hono/zod-openapi";

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  price: z.string().min(1),
  stockQuantity: z.string().min(1),
  sizes: z
    .string()
    .optional()
    .openapi({
      example: JSON.stringify([
        { name: "S", inStock: true },
        { name: "M", inStock: true },
        { name: "L", inStock: false },
      ]),
      description:
        'JSON stringified array of size objects, e.g. [{"name":"S","inStock":true}]',
    }),
  colors: z
    .string()
    .optional()
    .openapi({
      example: JSON.stringify([
        { name: "Red", inStock: true },
        { name: "Blue", inStock: true },
        { name: "Green", inStock: false },
      ]),
      description:
        'JSON stringified array of color objects, e.g. [{"name":"Red","inStock":true}]',
    }),
  createdBy: z.string().min(1),
  categoryIds: z
    .string()
    .min(1)
    .openapi({
      example: JSON.stringify([
        "123e4567-e89b-12d3-a456-426614174000",
        "223e4567-e89b-12d3-a456-426614174000",
      ]),
      description:
        'JSON stringified array of category ID strings, e.g. ["123e4567-e89b-12d3-a456-426614174000"]',
    }),
  images: z
    .array(z.instanceof(File))
    .min(1)
    .max(3)
    .openapi({
      type: "array",
      items: { type: "string", format: "binary" },
      minItems: 1,
      maxItems: 3,
    }),
});
