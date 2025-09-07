import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import * as ordersHandlers from "@/routes/orders/orders.handlers";
import * as ordersRoutes from "@/routes/orders/orders.routes";

const ordersRouter = createRouter();

// Apply authentication middleware
ordersRouter.use("/orders/*", authMiddleware);

// Order routes
ordersRouter.openapi(
  ordersRoutes.createCheckout,
  ordersHandlers.createCheckout,
);

export default ordersRouter;
