import type { RouteParams } from "vue-router";

export type AppRouteName =
  | "SignIn"
  | "RoleSelection"
  | "Home"
  | "Forbidden"
  | "NotFound"
  | "Todo"
  | "Profile"
  | "Patient"
  | "Doctor";

export interface RouteParamsMap {
  SignIn: Record<string, never>;
  RoleSelection: Record<string, never>;
  Home: {
    userId: string;
  };
  Forbidden: Record<string, never>;
  NotFound: Record<string, never>;
  Todo: {
    todoId: string;
  };
  Profile: {
    userId: string;
  };
  Patient: Record<string, never>;
  Doctor: Record<string, never>;
}

export type ParamsFor<RouteName extends AppRouteName> =
  RouteParamsMap[RouteName];

export interface TypedRouteLocation {
  name: AppRouteName;
  params?: RouteParams;
}

export type TypedRouteLocationWithParams<T extends AppRouteName> = {
  name: T;
  params: ParamsFor<T>;
};
