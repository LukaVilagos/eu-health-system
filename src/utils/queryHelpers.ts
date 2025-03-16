import { QueryClient } from "@tanstack/vue-query";

/**
 * Optimistically removes an item from a query cache
 * @param queryClient The query client instance
 * @param queryKey The query key to update
 * @param itemId The id of the item to remove
 * @param idField The name of the ID field in the items (default: 'id')
 */
export function optimisticRemove<T extends Record<string, any>>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  itemId: string,
  idField: keyof T = "id" as keyof T
) {
  queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
    if (!oldData) return [];
    return oldData.filter((item) => item[idField] !== itemId);
  });
}

/**
 * Optimistically adds an item to a query cache
 * @param queryClient The query client instance
 * @param queryKey The query key to update
 * @param newItem The item to add
 */
export function optimisticAdd<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  newItem: T
) {
  queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
    if (!oldData) return [newItem];
    return [...oldData, newItem];
  });
}

/**
 * Optimistically updates an item in a collection query cache
 * @param queryClient The query client instance
 * @param queryKey The query key to update
 * @param itemId The id of the item to update
 * @param updateFn Function that returns the updated item
 * @param idField The name of the ID field in the items (default: 'id')
 */
export function optimisticUpdate<T extends Record<string, any>>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  itemId: string,
  updateFn: (item: T) => T,
  idField: keyof T = "id" as keyof T
) {
  queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
    if (!oldData) return [];
    return oldData.map((item) =>
      item[idField] === itemId ? updateFn(item) : item
    );
  });
}

/**
 * Optimistically updates a single item in a query cache
 * @param queryClient The query client instance
 * @param queryKey The query key to update
 * @param updateFn Function that returns the updated item
 */
export function optimisticUpdateSingle<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updateFn: (item: T | undefined) => T | undefined
) {
  queryClient.setQueryData(queryKey, (oldData: T | undefined) => {
    if (!oldData) return undefined;
    return updateFn(oldData);
  });
}

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
