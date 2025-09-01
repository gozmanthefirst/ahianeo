import { z } from "@hono/zod-openapi";

export const ListUsersQuerySchema = z.object({
  searchValue: z
    .string()
    .min(1)
    .optional()
    .openapi({
      param: {
        name: "searchValue",
        in: "query",
        required: false,
        description: "The value to search for",
      },
    }),
  searchField: z
    .enum(["name", "email"])
    .default("email")
    .optional()
    .openapi({
      param: {
        name: "searchField",
        in: "query",
        required: false,
        description: "The field to search in. Can be 'name' or 'email'",
      },
    }),
  searchOperator: z
    .enum(["contains", "starts_with", "ends_with"])
    .default("contains")
    .optional()
    .openapi({
      param: {
        name: "searchOperator",
        in: "query",
        required: false,
        description:
          "The operator to use for the search. Can be 'contains', 'starts_with', or 'ends_with'",
      },
    }),
  pageSize: z.coerce
    .number()
    .min(1)
    .default(100)
    .optional()
    .openapi({
      param: {
        name: "pageSize",
        in: "query",
        required: false,
        description: "The number of users to return in a page",
      },
    }),
  currentPage: z.coerce
    .number()
    .min(1)
    .optional()
    .openapi({
      param: {
        name: "currentPage",
        in: "query",
        required: false,
        description: "The current page number to retrieve",
      },
    }),
  sortBy: z
    .string()
    .min(1)
    .optional()
    .openapi({
      param: {
        name: "sortBy",
        in: "query",
        required: false,
        description: "The field to sort by",
      },
    }),
  sortDirection: z
    .enum(["asc", "desc"])
    .optional()
    .openapi({
      param: {
        name: "sortDirection",
        in: "query",
        required: false,
        description: "The direction to sort by",
      },
    }),
  filterField: z
    .string()
    .min(1)
    .optional()
    .openapi({
      param: {
        name: "filterField",
        in: "query",
        required: false,
        description: "The field to filter by",
      },
    }),
  filterValue: z
    .union([z.string().min(1), z.number(), z.boolean()])
    .optional()
    .openapi({
      param: {
        name: "filterValue",
        in: "query",
        required: false,
        description: "The value to filter by (string, number, or boolean)",
      },
    }),
  filterOperator: z
    .enum(["eq", "ne", "gt", "gte", "lt", "lte", "contains"])
    .optional()
    .openapi({
      param: {
        name: "filterOperator",
        in: "query",
        required: false,
        description:
          "The operator to use for filtering. Can be 'eq', 'ne', 'gt', 'gte', 'lt', 'lte', or 'contains'",
      },
    }),
});
