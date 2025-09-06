import { z } from "@hono/zod-openapi";

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  price: z
    .string()
    .min(1)
    .regex(/^\d+(\.\d{2})?$/),
  stockQuantity: z.string().min(1),
  sizes: z
    .string()
    .optional()
    .openapi({
      example: JSON.stringify([{ name: "S", inStock: true }]),
      description:
        'JSON stringified array of size objects, e.g. [{"name":"S","inStock":true}]',
    }),
  colors: z
    .string()
    .optional()
    .openapi({
      example: JSON.stringify([{ name: "Blue", inStock: true }]),
      description:
        'JSON stringified array of color objects, e.g. [{"name":"Red","inStock":true}]',
    }),
  createdBy: z.string().min(1),
  categoryIds: z
    .string()
    .min(1)
    .openapi({
      example: JSON.stringify(["123e4567-e89b-12d3-a456-426614174000"]),
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

export const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z
    .string()
    .regex(/^\d+(\.\d{2})?$/)
    .optional(),
  stockQuantity: z.string().optional(),
  sizes: z
    .string()
    .optional()
    .openapi({
      example: JSON.stringify([{ name: "S", inStock: true }]),
      description:
        'JSON stringified array of size objects, e.g. [{"name":"S","inStock":true}]',
    }),
  colors: z
    .string()
    .optional()
    .openapi({
      example: JSON.stringify([{ name: "Blue", inStock: true }]),
      description:
        'JSON stringified array of color objects, e.g. [{"name":"Red","inStock":true}]',
    }),
  categoryIds: z
    .string()
    .optional()
    .openapi({
      example: JSON.stringify(["123e4567-e89b-12d3-a456-426614174000"]),
      description:
        'JSON stringified array of category ID strings, e.g. ["123e4567-e89b-12d3-a456-426614174000"]',
    }),
  keepImageKeys: z.string().optional().openapi({
    example: '["products/uuid1.jpg", "products/uuid2.png"]',
    description: "JSON array of image keys to keep",
  }),
  newImages: z
    .array(z.instanceof(File))
    .max(3)
    .optional()
    .openapi({
      type: "array",
      items: { type: "string", format: "binary" },
      maxItems: 3,
    }),
});

export const SizeColorSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  inStock: z.boolean(),
});
