import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  assignRoleAndCreateUserDocument,
  getUserDocument,
} from "../models/User";
import type { User } from "firebase/auth";

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
  return useMutation({
    mutationFn: ({ user, role }: { user: User; role: string }) =>
      assignRoleAndCreateUserDocument(user, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
