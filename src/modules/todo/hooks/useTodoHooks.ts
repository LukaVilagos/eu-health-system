import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  createTodo,
  createTodoWithPermissions,
  deleteTodo,
  getAllTodos,
  getTodoById,
  getTodosByUserId,
  getTodosSharedWithUser,
  grantTodoPermission,
  revokeTodoPermission,
  updateTodo,
  type PermissionSchemaType,
} from "../models/Todo.ts";
import { createErrorHandler } from "../../../utils/queryHelpers.ts";
import {
  canDeleteTodo,
  canEditTodo,
  canViewTodo,
} from "../utils/todoPermissionHelpers.ts";

export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
  user: (userId: string) => [...todoKeys.all, { userId }] as const,
  sharedWith: (userId: string) =>
    [...todoKeys.all, "sharedWith", userId] as const,
};

export function useTodosQuery(currentUserId: string) {
  return useQuery({
    queryKey: [...todoKeys.all, { currentUserId }],
    queryFn: async () => {
      return await getAllTodos();
    },
  });
}

export function useTodosByUserIdQuery(userId: string, currentUserId: string) {
  return useQuery({
    queryKey: [...todoKeys.user(userId), { currentUserId }],
    queryFn: async () => {
      const todos = await getTodosByUserId(userId, currentUserId);
      return todos.filter((todo) => canViewTodo(todo, currentUserId));
    },
    enabled: !!userId,
  });
}

export function useTodoQuery(id: string, currentUserId: string) {
  return useQuery({
    queryKey: [...todoKeys.detail(id), { currentUserId }],
    queryFn: async () => {
      const todo = await getTodoById(id);
      if (!todo || !canViewTodo(todo, currentUserId)) {
        return null;
      }
      return todo;
    },
  });
}

export function useSharedTodosQuery(userId: string) {
  return useQuery({
    queryKey: todoKeys.sharedWith(userId),
    queryFn: async () => {
      return await getTodosSharedWithUser(userId);
    },
    enabled: !!userId,
  });
}

export function useUpdateTodoMutation(currentUserId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const todo = await getTodoById(id);
      if (!todo) {
        throw new Error("Todo not found");
      }

      if (!canEditTodo(todo, currentUserId)) {
        throw new Error("You don't have permission to edit this todo");
      }

      await updateTodo(id, text);

      return { ...todo, text, updatedAt: new Date() };
    },
    onSuccess: (updatedTodo) => {
      if (updatedTodo) {
        queryClient.invalidateQueries({
          queryKey: todoKeys.user(updatedTodo.userId),
        });
        queryClient.invalidateQueries({
          queryKey: todoKeys.detail(updatedTodo.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
    onError: createErrorHandler(queryClient, [
      todoKeys.all,
      todoKeys.details(),
    ]),
  });
}

export function useDeleteTodoMutation(currentUserId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const todo = await getTodoById(id);
      if (!todo) {
        throw new Error("Todo not found");
      }

      if (!canDeleteTodo(todo, currentUserId)) {
        throw new Error("You don't have permission to delete this todo");
      }

      await deleteTodo(id);

      return { userId: todo.userId };
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
    mutationFn: async ({
      text,
      userId,
      sharedWith,
    }: {
      text: string;
      userId: string;
      sharedWith?: Record<string, PermissionSchemaType>;
    }) => {
      const formattedSharedWith = sharedWith
        ? Object.fromEntries(
            Object.entries(sharedWith).map(([userId, permissions]) => [
              userId,
              {
                permissions: permissions.permissions,
                addedAt: permissions.addedAt || new Date(),
                addedBy: permissions.addedBy || userId,
              },
            ])
          )
        : {};

      if (Object.keys(formattedSharedWith).length > 0) {
        return createTodoWithPermissions(text, userId, formattedSharedWith);
      }
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

export function useGrantTodoPermissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      todoId,
      targetUserId,
      permissions,
      grantedBy,
    }: {
      todoId: string;
      targetUserId: string;
      permissions: string[];
      grantedBy: string;
    }) => {
      await grantTodoPermission(todoId, targetUserId, permissions, grantedBy);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: todoKeys.detail(variables.todoId),
      });
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
    onError: createErrorHandler(queryClient, [
      todoKeys.all,
      todoKeys.details(),
    ]),
  });
}

export function useRevokeTodoPermissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      todoId,
      userId,
    }: {
      todoId: string;
      userId: string;
    }) => {
      await revokeTodoPermission(todoId, userId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: todoKeys.detail(variables.todoId),
      });
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
    onError: createErrorHandler(queryClient, [
      todoKeys.all,
      todoKeys.details(),
    ]),
  });
}
