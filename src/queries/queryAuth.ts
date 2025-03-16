import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "../stores/authStore";

export const authKeys = {
  user: ["auth", "user"] as const,
};

async function fetchAuthUser() {
  const auth = useAuthStore();
  await auth.waitForAuthInit();
  return auth.user;
}

export function useAuthUserQuery() {
  const auth = useAuthStore();

  return useQuery({
    queryKey: authKeys.user,
    queryFn: fetchAuthUser,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: false,
    initialData: () => auth.user,
  });
}
