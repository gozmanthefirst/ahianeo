import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import type { AppRouteHandler, ErrorStatusCodes } from "@/lib/types";
import { getUserById } from "@/queries/user-queries";
import type {
  ListUserSessionsRoute,
  ListUsersRoute,
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
