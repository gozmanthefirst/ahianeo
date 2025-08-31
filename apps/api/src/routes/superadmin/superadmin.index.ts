import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import checkRole from "@/middleware/check-role";
import * as superadminHandlers from "@/routes/superadmin/superadmin.handlers";
import * as superadminRoutes from "@/routes/superadmin/superadmin.routes";

const superadminRouter = createRouter();
superadminRouter
  .use("/superadmin/*", authMiddleware)
  .use("/superadmin/*", checkRole("superadmin"));

superadminRouter
  .openapi(superadminRoutes.createUser, superadminHandlers.createUser)
  .openapi(superadminRoutes.deleteUser, superadminHandlers.deleteUser);

export default superadminRouter;
