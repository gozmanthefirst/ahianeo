import { createMiddleware } from "hono/factory";

import type { AppBindings } from "@/lib/types";
import { errorResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";

const checkRole = (requiredRole: string | string[]) => {
  return createMiddleware<AppBindings>(async (c, next) => {
    const user = c.get("user");

    if (!user || !user.role) {
      return c.json(
        errorResponse("FORBIDDEN", "No user or role assigned"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!roles.includes(user.role)) {
      return c.json(
        errorResponse("FORBIDDEN", "User does not have the required role"),
        HttpStatusCodes.FORBIDDEN,
      );
    }

    await next();
  });
};

export default checkRole;
