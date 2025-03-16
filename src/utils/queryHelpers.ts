import { QueryClient } from "@tanstack/vue-query";

export function createErrorHandler(
  queryClient: QueryClient,
  queryKeys: readonly (readonly unknown[])[]
) {
  return (error: any) => {
    console.error("Mutation error:", error);
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };
}
