import { useRoute, type RouteLocationNormalizedLoaded } from "vue-router";
import type { AppRouteName, ParamsFor } from "./routeTypes";

export function useTypedRoute<
  T extends AppRouteName
>(): RouteLocationNormalizedLoaded & {
  typedParams: ParamsFor<T>;
} {
  const route = useRoute();

  return {
    ...route,
    typedParams: route.params as ParamsFor<T>,
  };
}

export type TypedRouteLocationRaw<T extends AppRouteName> = {
  name: T;
  params: ParamsFor<T>;
  query?: Record<string, string | string[]>;
  hash?: string;
};

export function createTypedLink<T extends AppRouteName>(
  config: TypedRouteLocationRaw<T>
) {
  return config;
}
