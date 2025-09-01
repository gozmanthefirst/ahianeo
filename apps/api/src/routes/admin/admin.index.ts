import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import checkRole from "@/middleware/check-role";
import * as adminHandlers from "@/routes/admin/admin.handlers";
import * as adminRoutes from "@/routes/admin/admin.routes";

const adminRouter = createRouter();
adminRouter
  .use("/admin/*", authMiddleware)
  .use("/admin/*", checkRole(["admin", "superadmin"]));

adminRouter
  .openapi(adminRoutes.listUsers, adminHandlers.listUsers)
  .openapi(adminRoutes.listUserSessions, adminHandlers.listUserSessions)
  .openapi(adminRoutes.revokeUserSession, adminHandlers.revokeUserSession)
  .openapi(adminRoutes.banUser, adminHandlers.banUser)
  .openapi(adminRoutes.unbanUser, adminHandlers.unbanUser);

export default adminRouter;
