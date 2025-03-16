import { QueryClient } from "@tanstack/vue-query";

/**
 * Creates a mutation error handler that invalidates queries
 * @param queryClient The query client instance
 * @param queryKeys Array of query keys to invalidate
 */
export function createErrorHandler(
  queryClient: QueryClient,
  queryKeys: readonly (readonly unknown[])[]
) {
  return (error: any) => {
    console.error("Mutation error:", error);
    // Invalidate all specified query keys
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };
}
