import type { RouteParams } from "vue-router";

export type AppRouteName =
  | "SignIn"
  | "RoleSelection"
  | "Home"
  | "Forbidden"
  | "NotFound";

export interface RouteParamsMap {
  SignIn: Record<string, never>;
  RoleSelection: Record<string, never>;
  Home: {
    userId: string;
  };
  Forbidden: Record<string, never>;
  NotFound: Record<string, never>;
}

export type ParamsFor<RouteName extends AppRouteName> =
  RouteParamsMap[RouteName];

// Type-safe navigation function signatures
export interface TypedRouteLocation {
  name: AppRouteName;
  params?: RouteParams;
}

// A more specific version that enforces correct params for each route
export type TypedRouteLocationWithParams<T extends AppRouteName> = {
  name: T;
  params: ParamsFor<T>;
};
