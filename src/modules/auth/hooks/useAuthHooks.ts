import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "../stores/authStore";
import type { User } from "firebase/auth";
import type { UserSchemaType } from "../../user/models/User";
import { computed } from "vue";

export const authKeys = {
  user: ["auth", "user"] as const,
};

export function useAuth() {
  return useAuthStore();
}

async function fetchAuthUser() {
  const auth = useAuthStore();
  await auth.waitForAuthInit();
  return auth.user;
}

export async function useAuthenticatedUser(): Promise<
  User & Partial<UserSchemaType>
> {
  const user = await fetchAuthUser();

  if (!user) {
    throw new Error("This operation requires an authenticated user");
  }

  return user;
}

export function useAuthUser() {
  const auth = useAuthStore();

  const {
    data: user,
    isLoading,
    error,
    isSuccess,
  } = useQuery({
    queryKey: authKeys.user,
    queryFn: fetchAuthUser,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: false,
    initialData: () => auth.user,
  });

  return {
    user,
    isLoading,
    isAuthenticated: computed(() => !!user.value),
    error,
    isReady: computed(() => isSuccess.value),
  };
}
