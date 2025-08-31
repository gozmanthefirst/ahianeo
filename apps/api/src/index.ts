import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/openapi";
import { createSuperadmin } from "@/queries/admin-queries";
import authRouter from "./routes/auth/auth.index";
import userRouter from "./routes/user/user.index";

const app = createApp();

const routers = [authRouter, userRouter];

configureOpenAPI(app);

routers.forEach((router) => {
  app.route("/api", router);
});

createSuperadmin();

export default app;
