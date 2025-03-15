import { useQuery } from "@tanstack/vue-query";
import { getUserDocument } from "../models/User";

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
