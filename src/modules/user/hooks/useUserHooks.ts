import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  assignRoleAndCreateUserDocument,
  getAllUsers,
  getUserDocument,
} from "../models/User";
import type { User } from "firebase/auth";
import { useAuthStore } from "../../auth/stores/authStore";
import { authKeys } from "../../auth/hooks/useAuthHooks";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  oneByUid: (uid: string) => [...userKeys.all, "one", uid] as const,
};

export function useUserQuery(userId: string) {
  return useQuery({
    queryKey: userKeys.oneByUid(userId),
    queryFn: () => getUserDocument(userId),
  });
}

export function useAssignRoleAndCreateUserMutation() {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async ({ user, role }: { user: User; role: string }) => {
      await assignRoleAndCreateUserDocument(user, role);
      await authStore.fetchUserDocument(user.uid);
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
      await queryClient.prefetchQuery({
        queryKey: authKeys.user,
        queryFn: async () => authStore.user,
        staleTime: 0,
      });

      await queryClient.invalidateQueries({ queryKey: userKeys.all });

      return { success: true };
    },
  });
}

export function useAllUsersQuery() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: getAllUsers,
  });
}
