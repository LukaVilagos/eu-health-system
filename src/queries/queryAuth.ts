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
    // Auth state doesn't become stale until explicitly invalidated
    staleTime: Infinity,
    // Auth state doesn't change due to window focus
    refetchOnWindowFocus: false,
    // We don't need to refetch on component remounts
    refetchOnMount: false,
    // Auth is managed by Firebase's observer, so we don't need to poll
    refetchInterval: false,
    // Don't retry failed auth state fetching
    retry: false,
    initialData: () => auth.user, // Use any immediately available state
  });
}
