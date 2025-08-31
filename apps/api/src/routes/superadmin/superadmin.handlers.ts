import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import type { AppRouteHandler, ErrorStatusCodes } from "@/lib/types";
import { createUser as createUserByAdmin } from "@/queries/admin-queries";
import { getUserById } from "@/queries/user-queries";
import type { DeleteUserRoute } from "@/routes/superadmin/superadmin.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { CreateUserRoute } from "./superadmin.routes";

export const createUser: AppRouteHandler<CreateUserRoute> = async (c) => {
  try {
    const data = c.req.valid("json");

    const newUser = await createUserByAdmin(data);

    return c.json(
      successResponse({ user: newUser }, "User created successfully"),
      HttpStatusCodes.CREATED,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof createUser>,
      );
    }

    throw error;
  }
};

export const deleteUser: AppRouteHandler<DeleteUserRoute> = async (c) => {
  try {
    const user = c.get("user");
    const data = c.req.valid("json");

    if (user.id === data.userId) {
      return c.json(
        errorResponse("FORBIDDEN", "User cannot delete their own account"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    const userToBeDeleted = await getUserById(data.userId);

    if (!userToBeDeleted) {
      return c.json(
        errorResponse("NOT_FOUND", "User not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (userToBeDeleted.role === "superadmin") {
      return c.json(
        errorResponse("FORBIDDEN", "User cannot delete a superadmin"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    await auth.api.removeUser({
      body: {
        userId: userToBeDeleted.id,
      },
      headers: c.req.raw.headers,
    });

    return c.json(
      successResponse({ success: true }, "User deleted successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof deleteUser>,
      );
    }

    throw error;
  }
};
