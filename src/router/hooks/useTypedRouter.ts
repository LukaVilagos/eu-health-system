import { useRouter } from "vue-router";
import type { AppRouteName, TypedRouteLocationWithParams } from "../routeTypes";

export function useTypedRouter() {
  const router = useRouter();

  function typedPush<T extends AppRouteName>(
    location: TypedRouteLocationWithParams<T>
  ) {
    return router.push(location);
  }

  function typedReplace<T extends AppRouteName>(
    location: TypedRouteLocationWithParams<T>
  ) {
    return router.replace(location);
  }

  return {
    ...router,
    typedPush,
    typedReplace,
  };
}
