import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import * as authHandlers from "@/routes/auth/auth.handlers";
import * as authRoutes from "@/routes/auth/auth.routes";

const authRouter = createRouter();

// Public routes
authRouter
  .openapi(authRoutes.signUp, authHandlers.signUp)
  .openapi(authRoutes.verifyEmail, authHandlers.verifyEmail)
  .openapi(authRoutes.signIn, authHandlers.signIn)
  .openapi(authRoutes.sendVerificationEmail, authHandlers.sendVerificationEmail)
  .openapi(authRoutes.reqPwdResetEmail, authHandlers.reqPwdResetEmail)
  .openapi(authRoutes.resetPwd, authHandlers.resetPwd);

// Apply authentication middleware
authRouter.use("/auth/*", authMiddleware);

// Protected routes
authRouter
  .openapi(authRoutes.changePwd, authHandlers.changePwd)
  .openapi(authRoutes.signOut, authHandlers.signOut);

export default authRouter;
