import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import checkRole from "@/middleware/check-role";
import * as productsHandlers from "@/routes/products/products.handlers";
import * as productsRoutes from "@/routes/products/products.routes";

const productsRouter = createRouter();

// Public routes
productsRouter
  .openapi(productsRoutes.getAllProducts, productsHandlers.getAllProducts)
  .openapi(productsRoutes.getProduct, productsHandlers.getProduct);

// Apply authentication and admin access middleware
productsRouter
  .use("/products/*", authMiddleware)
  .use("/products/*", checkRole(["admin", "superadmin"]));

// Protected Admin routes
productsRouter.openapi(
  productsRoutes.createProduct,
  productsHandlers.createProduct,
);

export default productsRouter;
