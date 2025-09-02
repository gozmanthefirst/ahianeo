import { createRoute, z } from "@hono/zod-openapi";
import {
  CreateUserSchema,
  UserSelectSchema,
} from "@repo/db/validators/user-validators";

import HttpStatusCodes from "@/utils/http-status-codes";
import { userExamples } from "@/utils/openapi-examples";
import {
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Superadmin"];

export const createUser = createRoute({
  path: "/superadmin/create-user",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Create a new user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: successContent({
      description: "User created",
      schema: z.object({
        user: UserSelectSchema,
      }),
      resObj: {
        details: "User created successfully",
        data: {
          user: userExamples.user,
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(userExamples.createUserValErrs),
          fields: userExamples.createUserValErrs,
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.FORBIDDEN]: genericErrorContent(
      "FORBIDDEN",
      "Forbidden",
      "User does not have the required role",
    ),
    [HttpStatusCodes.CONFLICT]: genericErrorContent(
      "USER_EXISTS",
      "User already exists",
      "User already exists",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const changeUserRole = createRoute({
  path: "/superadmin/change-user-role",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Change the role of a user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string().min(1),
            role: z.enum(["user", "admin"]),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User role changed",
      schema: z.object({
        user: UserSelectSchema,
      }),
      resObj: {
        details: "User role changed successfully",
        data: {
          user: userExamples.user,
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields({
            ...userExamples.userIdValErrs,
            role: userExamples.createUserValErrs.role,
          }),
          fields: {
            ...userExamples.userIdValErrs,
            role: userExamples.createUserValErrs.role,
          },
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.FORBIDDEN]: errorContent({
      description: "Forbidden",
      examples: {
        requiredRole: {
          summary: "Required role missing",
          code: "FORBIDDEN",
          details: "User does not have the required role",
        },
        cannotChangeSuperadminRole: {
          summary: "Cannot change superadmin role",
          code: "FORBIDDEN",
          details: "User cannot change the role of a superadmin",
        },
        cannotChangeSelfRole: {
          summary: "Cannot change self role",
          code: "FORBIDDEN",
          details: "User cannot change their own role",
        },
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "User not found",
      "User not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: genericErrorContent(
      "UNPROCESSABLE_ENTITY",
      "Unprocessable entity",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const deleteUser = createRoute({
  path: "/superadmin/delete-user",
  method: "delete",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Delete a user. Cannot be undone.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string().min(1),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User deleted",
      schema: z.object({
        success: z.boolean(),
      }),
      resObj: {
        details: "User deleted successfully",
        data: {
          success: true,
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(userExamples.userIdValErrs),
          fields: userExamples.userIdValErrs,
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.FORBIDDEN]: errorContent({
      description: "Forbidden",
      examples: {
        requiredRole: {
          summary: "Required role missing",
          code: "FORBIDDEN",
          details: "User does not have the required role",
        },
        cannotDeleteSelf: {
          summary: "Cannot delete self",
          code: "FORBIDDEN",
          details: "User cannot delete their own account",
        },
        cannotDeleteSuperadmin: {
          summary: "Cannot delete superadmin",
          code: "FORBIDDEN",
          details: "User cannot delete a superadmin",
        },
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "User not found",
      "User not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: genericErrorContent(
      "UNPROCESSABLE_ENTITY",
      "Unprocessable entity",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type CreateUserRoute = typeof createUser;
export type ChangeUserRoleRoute = typeof changeUserRole;
export type DeleteUserRoute = typeof deleteUser;
