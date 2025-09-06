import type { z } from "zod";

export const parseJsonField = <T>(
  value: string | undefined,
  schema: z.ZodSchema<T>,
  fieldName: string,
): { success: true; data: T } | { success: false; error: string } => {
  if (!value) {
    return { success: true, data: [] as T };
  }

  try {
    const parsed = JSON.parse(value);
    const result = schema.safeParse(parsed);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join(".")} - ${firstError.message}`,
      };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: `${fieldName} must be valid JSON` };
  }
};
