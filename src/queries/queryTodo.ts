import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  createTodo,
  deleteTodo,
  getAllTodos,
  getTodoById,
  getTodosByUserId,
  updateTodo,
  type TodoWithUserSchemaType,
} from "../models/Todo.ts";
import {
  optimisticRemove,
  optimisticAdd,
  optimisticUpdate,
  optimisticUpdateSingle,
  createErrorHandler,
} from "../utils/queryHelpers";

export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
  user: (userId: string) => [...todoKeys.all, { userId }] as const,
};

export function useTodosQuery() {
  return useQuery({
    queryKey: todoKeys.all,
    queryFn: getAllTodos,
  });
}

export function useTodosByUserIdQuery(userId: string) {
  return useQuery({
    queryKey: todoKeys.user(userId),
    queryFn: () => getTodosByUserId(userId),
    enabled: !!userId,
  });
}

export function useTodoQuery(id: string) {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: () => getTodoById(id),
  });
}

export function useUpdateTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const todo = await getTodoById(id);
      if (!todo) {
        throw new Error("Todo not found");
      }

      const userId = todo.userId;

      const updateFn = (item: TodoWithUserSchemaType) => ({ ...item, text });
      optimisticUpdate(queryClient, todoKeys.all, id, updateFn);
      optimisticUpdate(queryClient, todoKeys.user(userId), id, updateFn);

      optimisticUpdateSingle<TodoWithUserSchemaType>(
        queryClient,
        todoKeys.detail(id),
        (oldTodo) => (oldTodo ? { ...oldTodo, text } : undefined)
      );

      return updateTodo(id, text);
    },
    onSuccess: async (_, variables) => {
      const todo = await getTodoById(variables.id);
      if (todo) {
        queryClient.invalidateQueries({
          queryKey: todoKeys.user(todo.userId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: todoKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
    onError: createErrorHandler(queryClient, [
      todoKeys.all,
      todoKeys.details(),
    ]),
  });
}

export function useDeleteTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const todo = await getTodoById(id);
      if (!todo) {
        throw new Error("Todo not found");
      }

      const userId = todo.userId;

      optimisticRemove<TodoWithUserSchemaType>(queryClient, todoKeys.all, id);
      optimisticRemove<TodoWithUserSchemaType>(
        queryClient,
        todoKeys.user(userId),
        id
      );

      await deleteTodo(id);

      return { userId };
    },
    onSuccess: (data) => {
      if (data?.userId) {
        queryClient.invalidateQueries({
          queryKey: todoKeys.user(data.userId),
        });
      }
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
    onError: createErrorHandler(queryClient, [todoKeys.all, todoKeys.lists()]),
  });
}

export function useCreateTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ text, userId }: { text: string; userId: string }) => {
      const optimisticTodo: TodoWithUserSchemaType = {
        id: `temp-${Date.now()}`,
        text,
        userId,
        user: null,
      };

      optimisticAdd<TodoWithUserSchemaType>(
        queryClient,
        todoKeys.all,
        optimisticTodo
      );
      optimisticAdd<TodoWithUserSchemaType>(
        queryClient,
        todoKeys.user(userId),
        optimisticTodo
      );

      return createTodo(text, userId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
      queryClient.invalidateQueries({
        queryKey: todoKeys.user(variables.userId),
      });
    },
    onError: createErrorHandler(queryClient, [
      todoKeys.all,
      [todoKeys.user("")],
    ]),
  });
}
