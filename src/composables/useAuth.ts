import type { User } from "firebase/auth";
import { useAuthStore } from "../stores/authStore";
import type { UserSchemaType } from "../models/User";
import { computed } from "vue";
import { useAuthUserQuery } from "../queries/queryAuth";

export function useAuth() {
  return useAuthStore();
}

export async function useAuthenticatedUser(): Promise<
  User & Partial<UserSchemaType>
> {
  const auth = useAuth();
  await auth.waitForAuthInit();

  if (!auth.isAuthenticated || !auth.user) {
    throw new Error("This operation requires an authenticated user");
  }

  return auth.user;
}

// Updated composable using TanStack Query
export function useAuthUser() {
  const { data: user, isLoading, error, isSuccess } = useAuthUserQuery();

  return {
    user,
    isLoading,
    isAuthenticated: computed(() => !!user.value),
    error,
    isReady: computed(() => isSuccess.value),
  };
}
