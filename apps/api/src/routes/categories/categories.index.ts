import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import checkRole from "@/middleware/check-role";
import * as categoriesHandlers from "@/routes/categories/categories.handlers";
import * as categoriesRoutes from "@/routes/categories/categories.routes";

const categoriesRouter = createRouter();

// Public routes
categoriesRouter
  .openapi(
    categoriesRoutes.getAllCategories,
    categoriesHandlers.getAllCategories,
  )
  .openapi(categoriesRoutes.getCategory, categoriesHandlers.getCategory);

// Apply authentication and admin access middleware
categoriesRouter
  .use("/categories/*", authMiddleware)
  .use("/categories/*", checkRole(["admin", "superadmin"]));

// Protected Admin routes
categoriesRouter
  .openapi(categoriesRoutes.createCategory, categoriesHandlers.createCategory)
  .openapi(categoriesRoutes.updateCategory, categoriesHandlers.updateCategory)
  .openapi(categoriesRoutes.deleteCategory, categoriesHandlers.deleteCategory);

export default categoriesRouter;
