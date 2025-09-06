import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import * as cartHandlers from "@/routes/cart/cart.handlers";
import * as cartRoutes from "@/routes/cart/cart.routes";

const cartRouter = createRouter();

// Apply authentication middleware
cartRouter.use("/cart/*", authMiddleware);

// Cart routes
cartRouter
  .openapi(cartRoutes.getUserCart, cartHandlers.getUserCart)
  .openapi(cartRoutes.addToCart, cartHandlers.addToCart)
  .openapi(cartRoutes.updateCartItem, cartHandlers.updateCartItem)
  .openapi(cartRoutes.deleteCartItem, cartHandlers.removeCartItem)
  .openapi(cartRoutes.clearCart, cartHandlers.clearUserCart);

export default cartRouter;
