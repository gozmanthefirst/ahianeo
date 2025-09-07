import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/openapi";
import { createSuperadmin } from "@/queries/admin-queries";
import adminRouter from "./routes/admin/admin.index";
import authRouter from "./routes/auth/auth.index";
import cartRouter from "./routes/cart/cart.index";
import categoriesRouter from "./routes/categories/categories.index";
import ordersRouter from "./routes/orders/orders.index";
import productsRouter from "./routes/products/products.index";
import superadminRouter from "./routes/superadmin/superadmin.index";
import userRouter from "./routes/user/user.index";
import stripeWebhookRouter from "./routes/webhooks/stripe.index";

const app = createApp();

const routers = [
  authRouter,
  userRouter,
  superadminRouter,
  adminRouter,
  categoriesRouter,
  productsRouter,
  cartRouter,
  ordersRouter,
  stripeWebhookRouter,
];

configureOpenAPI(app);

routers.forEach((router) => {
  app.route("/api", router);
});

createSuperadmin();

export default app;
