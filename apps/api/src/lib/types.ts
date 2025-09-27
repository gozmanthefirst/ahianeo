import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";

import { betterAuthInit } from "@/lib/auth";
import type { errorResponse } from "@/utils/api-response";
import type { Environment } from "./env";
import envRuntime from "./env-runtime";

const auth = betterAuthInit(envRuntime);

export interface AppBindings {
  Bindings: Environment;
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;

export type ErrorStatusCodes<R> = Extract<
  R extends AppRouteHandler<infer Route>
    ? Route["responses"][keyof Route["responses"]]
    : never,
  { content: { "application/json": ReturnType<typeof errorResponse> } }
> extends { status: infer S }
  ? S
  : never;

export type Role = "user" | "admin" | "superadmin";
