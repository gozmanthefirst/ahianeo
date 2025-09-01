import { createRoute, z } from "@hono/zod-openapi";
import {
  BanUserSchema,
  UserSelectSchema,
} from "@repo/db/validators/user-validators";

import { ListUsersQuerySchema } from "@/lib/schemas";
import HttpStatusCodes from "@/utils/http-status-codes";
import { userExamples } from "@/utils/openapi-examples";
import {
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";
import { SessionSelectSchema } from "../../../../../packages/db/src/db/validators/auth-validators";

const tags = ["Admin"];

export const listUsers = createRoute({
  path: "/admin/list-users",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  request: {
    query: ListUsersQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Users retrieved",
      schema: z.object({
        users: z.array(UserSelectSchema),
        total: z.number(),
        pageSize: z.number(),
        currentPage: z.number(),
        totalPages: z.number(),
      }),
      resObj: {
        details: "Users retrieved successfully",
        data: {
          users: [userExamples.user],
          total: 223,
          pageSize: 100,
          currentPage: 1,
          totalPages: 3,
        },
      },
    }),

    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(userExamples.listUsersValErrs),
          fields: userExamples.listUsersValErrs,
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
      },
    }),
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

export const listUserSessions = createRoute({
  path: "/admin/list-user-sessions",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string().min(1),
          }),
        },
      },
      description: "List user sessions",
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User sessions retrieved",
      schema: z.array(SessionSelectSchema),
      resObj: {
        details: "User sessions retrieved successfully",
        data: {
          sessions: [userExamples.session],
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
        superadmin: {
          summary: "Cannot get superadmin info",
          code: "FORBIDDEN",
          details: "User cannot get superadmin info",
        },
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "User not found",
      "User not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const banUser = createRoute({
  path: "/admin/ban-user",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: BanUserSchema,
        },
      },
      description: "Ban a user",
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User banned",
      schema: z.object({
        user: UserSelectSchema,
      }),
      resObj: {
        details: "User banned successfully",
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
          details: getErrDetailsFromErrFields(userExamples.banUserValErrs),
          fields: userExamples.banUserValErrs,
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
        cannotBanSelf: {
          summary: "Cannot ban self",
          code: "FORBIDDEN",
          details: "User cannot ban their own account",
        },
        cannotBanSuperadmin: {
          summary: "Cannot ban superadmin",
          code: "FORBIDDEN",
          details: "User cannot ban a superadmin",
        },
        cannotBanFellowAdmin: {
          summary: "Cannot ban fellow admin",
          code: "FORBIDDEN",
          details: "An admin cannot ban a fellow admin",
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

export const unbanUser = createRoute({
  path: "/admin/unban-user",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string().min(1),
          }),
        },
      },
      description: "Unban a user",
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User unbanned",
      schema: z.object({
        user: UserSelectSchema,
      }),
      resObj: {
        details: "User unbanned successfully",
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
        cannotUnbanSelf: {
          summary: "Cannot unban self",
          code: "FORBIDDEN",
          details: "User cannot unban their own account",
        },
        cannotUnbanSuperadmin: {
          summary: "Cannot unban superadmin",
          code: "FORBIDDEN",
          details: "User cannot unban a superadmin",
        },
        cannotUnbanFellowAdmin: {
          summary: "Cannot unban fellow admin",
          code: "FORBIDDEN",
          details: "An admin cannot unban a fellow admin",
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

export type ListUsersRoute = typeof listUsers;
export type ListUserSessionsRoute = typeof listUserSessions;
export type BanUserRoute = typeof banUser;
export type UnbanUserRoute = typeof unbanUser;
