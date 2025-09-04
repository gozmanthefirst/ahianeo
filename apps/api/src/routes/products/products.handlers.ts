import type { AppRouteHandler } from "@/lib/types";
import { getProductById, getProducts } from "@/queries/product-queries";
import type {
  GetAllproductsRoute,
  GetProductRoute,
} from "@/routes/products/products.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";

export const getAllProducts: AppRouteHandler<GetAllproductsRoute> = async (
  c,
) => {
  const products = await getProducts();

  return c.json(
    successResponse(products, "All products retrieved successfully"),
    HttpStatusCodes.OK,
  );
};

export const getProduct: AppRouteHandler<GetProductRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const productExtended = await getProductById(id);

  if (!productExtended) {
    return c.json(
      errorResponse("NOT_FOUND", "Product not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(
    successResponse(productExtended, "Product retrieved successfully"),
    HttpStatusCodes.OK,
  );
};
