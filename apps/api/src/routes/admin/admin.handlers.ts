import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import type { AppRouteHandler, ErrorStatusCodes } from "@/lib/types";
import { getSessionByToken, getUserById } from "@/queries/user-queries";
import type {
  ChangeUserPwdRoute,
  ListUserSessionsRoute,
  ListUsersRoute,
  RevokeUserSessionRoute,
  RevokeUserSessionsRoute,
} from "@/routes/admin/admin.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { BanUserRoute, UnbanUserRoute } from "./admin.routes";

export const listUsers: AppRouteHandler<ListUsersRoute> = async (c) => {
  try {
    const data = c.req.valid("query");

    const dataOffset = ((data.currentPage ?? 1) - 1) * (data.pageSize ?? 100);

    const result = await auth.api.listUsers({
      query: { ...data, limit: data.pageSize ?? 100, offset: dataOffset },
      headers: c.req.raw.headers,
    });

    const totalPages = Math.ceil(result.total / (data.pageSize ?? 100));

    const usersWithPagination = {
      users: result.users,
      total: result.total,
      pageSize: data.pageSize ?? 100,
      currentPage: data.currentPage ?? 1,
      totalPages,
    };

    return c.json(
      successResponse(usersWithPagination, "Users retrieved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof listUsers>,
      );
    }

    throw error;
  }
};

export const listUserSessions: AppRouteHandler<ListUserSessionsRoute> = async (
  c,
) => {
  try {
    const user = c.get("user");
    const data = c.req.valid("json");

    const userToGetSessions = await getUserById(data.userId);

    if (!userToGetSessions) {
      return c.json(
        errorResponse("NOT_FOUND", "User not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (userToGetSessions.role === "superadmin" && user.role !== "superadmin") {
      return c.json(
        errorResponse("FORBIDDEN", "User cannot get superadmin info"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    const response = await auth.api.listUserSessions({
      body: data,
      headers: c.req.raw.headers,
    });

    return c.json(
      successResponse(response, "User sessions retrieved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof listUserSessions>,
      );
    }

    throw error;
  }
};

export const revokeUserSession: AppRouteHandler<
  RevokeUserSessionRoute
> = async (c) => {
  try {
    const user = c.get("user");
    const data = c.req.valid("json");

    const sessionToBeRevoked = await getSessionByToken(data.sessionToken);

    if (!sessionToBeRevoked) {
      return c.json(
        errorResponse("NOT_FOUND", "Session not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const userToRevokeSession = await getUserById(sessionToBeRevoked.userId);

    if (!userToRevokeSession) {
      return c.json(
        errorResponse("NOT_FOUND", "User not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (
      userToRevokeSession.role === "superadmin" &&
      user.role !== "superadmin"
    ) {
      return c.json(
        errorResponse("FORBIDDEN", "User cannot revoke superadmin session"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    if (
      userToRevokeSession.role === "admin" &&
      user.role === "admin" &&
      userToRevokeSession.id !== user.id
    ) {
      return c.json(
        errorResponse("FORBIDDEN", "Admin cannot revoke fellow admin session"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    const response = await auth.api.revokeUserSession({
      body: data,
      headers: c.req.raw.headers,
    });

    return c.json(
      successResponse(response, "User session revoked successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof revokeUserSession>,
      );
    }

    throw error;
  }
};

export const revokeUserSessions: AppRouteHandler<
  RevokeUserSessionsRoute
> = async (c) => {
  try {
    const user = c.get("user");
    const data = c.req.valid("json");

    const userToRevokeSessions = await getUserById(data.userId);

    if (!userToRevokeSessions) {
      return c.json(
        errorResponse("NOT_FOUND", "User not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (
      userToRevokeSessions.role === "superadmin" &&
      user.role !== "superadmin"
    ) {
      return c.json(
        errorResponse("FORBIDDEN", "User cannot revoke superadmin sessions"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    if (
      userToRevokeSessions.role === "admin" &&
      user.role === "admin" &&
      userToRevokeSessions.id !== user.id
    ) {
      return c.json(
        errorResponse("FORBIDDEN", "Admin cannot revoke fellow admin session"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    const response = await auth.api.revokeUserSessions({
      body: data,
      headers: c.req.raw.headers,
    });

    return c.json(
      successResponse(
        response,
        "All sessions for the user revoked successfully",
      ),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof revokeUserSessions>,
      );
    }

    throw error;
  }
};

export const changeUserPwd: AppRouteHandler<ChangeUserPwdRoute> = async (c) => {
  try {
    const user = c.get("user");
    const data = c.req.valid("json");

    const userToChangePwd = await getUserById(data.userId);

    if (!userToChangePwd) {
      return c.json(
        errorResponse("NOT_FOUND", "User not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (userToChangePwd.role === "superadmin" && user.role !== "superadmin") {
      return c.json(
        errorResponse("FORBIDDEN", "User cannot change superadmin password"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    if (
      userToChangePwd.role === "admin" &&
      user.role === "admin" &&
      userToChangePwd.id !== user.id
    ) {
      return c.json(
        errorResponse("FORBIDDEN", "Admin cannot change fellow admin password"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    const response = await auth.api.setUserPassword({
      body: data,
      headers: c.req.raw.headers,
    });

    return c.json(
      successResponse(response, "User password changed successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof changeUserPwd>,
      );
    }

    throw error;
  }
};

export const banUser: AppRouteHandler<BanUserRoute> = async (c) => {
  try {
    const user = c.get("user");
    const data = c.req.valid("json");

    if (user.id === data.userId) {
      return c.json(
        errorResponse("FORBIDDEN", "User cannot ban their own account"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    const userToBeBanned = await getUserById(data.userId);

    if (!userToBeBanned) {
      return c.json(
        errorResponse("NOT_FOUND", "User not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (userToBeBanned.role === "superadmin") {
      return c.json(
        errorResponse("FORBIDDEN", "User cannot ban a superadmin"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    if (userToBeBanned.role === "admin" && user.role === "admin") {
      return c.json(
        errorResponse("FORBIDDEN", "An admin cannot ban a fellow admin"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    const bannedUser = await auth.api.banUser({
      body: data,
      headers: c.req.raw.headers,
    });

    return c.json(
      successResponse(bannedUser, "User banned successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof banUser>,
      );
    }

    throw error;
  }
};

export const unbanUser: AppRouteHandler<UnbanUserRoute> = async (c) => {
  try {
    const user = c.get("user");
    const data = c.req.valid("json");

    if (user.id === data.userId) {
      return c.json(
        errorResponse("FORBIDDEN", "User cannot unban their own account"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    const userToBeUnbanned = await getUserById(data.userId);

    if (!userToBeUnbanned) {
      return c.json(
        errorResponse("NOT_FOUND", "User not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (userToBeUnbanned.role === "superadmin") {
      return c.json(
        errorResponse("FORBIDDEN", "User cannot unban a superadmin"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    if (userToBeUnbanned.role === "admin" && user.role === "admin") {
      return c.json(
        errorResponse("FORBIDDEN", "An admin cannot unban a fellow admin"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    const unbannedUser = await auth.api.unbanUser({
      body: data,
      headers: c.req.raw.headers,
    });

    return c.json(
      successResponse(unbannedUser, "User unbanned successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof unbanUser>,
      );
    }

    throw error;
  }
};
