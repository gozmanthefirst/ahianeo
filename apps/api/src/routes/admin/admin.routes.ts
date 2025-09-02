import { createRoute, z } from "@hono/zod-openapi";
import { SessionSelectSchema } from "@repo/db/validators/auth-validators";
import {
  BanUserSchema,
  UserSelectSchema,
} from "@repo/db/validators/user-validators";

import { ListUsersQuerySchema } from "@/lib/schemas";
import HttpStatusCodes from "@/utils/http-status-codes";
import { authExamples, userExamples } from "@/utils/openapi-examples";
import {
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

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
  description: "List all users",
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
  description: "List user sessions",
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

export const revokeUserSession = createRoute({
  path: "/admin/revoke-user-session",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Revoke a user session",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sessionToken: z.string().min(1),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User session revoked",
      schema: z.object({
        success: z.boolean(),
      }),
      resObj: {
        details: "User session revoked successfully",
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
          details: getErrDetailsFromErrFields(userExamples.sessionTokenValErrs),
          fields: userExamples.sessionTokenValErrs,
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
        cannotRevokeSuperadmin: {
          summary: "Cannot revoke superadmin session",
          code: "FORBIDDEN",
          details: "User cannot revoke superadmin session",
        },
        adminCannotRevokeAdmin: {
          summary: "Admin cannot revoke fellow admin session",
          code: "FORBIDDEN",
          details: "Admin cannot revoke fellow admin session",
        },
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: errorContent({
      description: "Not found",
      examples: {
        sessionNotFound: {
          summary: "Session not found",
          code: "SESSION_NOT_FOUND",
          details: "Session not found",
        },
        userNotFound: {
          summary: "User not found",
          code: "USER_NOT_FOUND",
          details: "User not found",
        },
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const revokeUserSessions = createRoute({
  path: "/admin/revoke-user-sessions",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Revoke all sessions for a user",
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
      description: "All sessions for the user revoked",
      schema: z.object({
        success: z.boolean(),
      }),
      resObj: {
        details: "All sessions for the user revoked successfully",
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
        cannotRevokeSuperadmin: {
          summary: "Cannot revoke superadmin sessions",
          code: "FORBIDDEN",
          details: "User cannot revoke superadmin sessions",
        },
        adminCannotRevokeAdmin: {
          summary: "Admin cannot revoke fellow admin sessions",
          code: "FORBIDDEN",
          details: "Admin cannot revoke fellow admin sessions",
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

export const changeUserPwd = createRoute({
  path: "/admin/change-user-password",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Change the password of a user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string().min(1),
            newPassword: z.string().min(8),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User password changed",
      schema: z.object({
        status: z.boolean(),
      }),
      resObj: {
        details: "User password changed successfully",
        data: {
          status: true,
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
            newPassword: authExamples.changePwdValErrs.newPassword,
          }),
          fields: {
            ...userExamples.userIdValErrs,
            newPassword: authExamples.changePwdValErrs.newPassword,
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
        cannotChangeSuperadminPwd: {
          summary: "Cannot change superadmin password",
          code: "FORBIDDEN",
          details: "User cannot change superadmin password",
        },
        adminCannotChangeAdminPwd: {
          summary: "Admin cannot change fellow admin password",
          code: "FORBIDDEN",
          details: "Admin cannot change fellow admin password",
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
  description: "Ban a user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: BanUserSchema,
        },
      },
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
  description: "Unban a user",
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
export type RevokeUserSessionRoute = typeof revokeUserSession;
export type RevokeUserSessionsRoute = typeof revokeUserSessions;
export type ChangeUserPwdRoute = typeof changeUserPwd;
export type BanUserRoute = typeof banUser;
export type UnbanUserRoute = typeof unbanUser;
