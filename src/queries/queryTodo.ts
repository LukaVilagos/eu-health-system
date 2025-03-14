import { useQuery } from '@tanstack/vue-query';
import {getAllTodos} from "../models/Todo.ts";

export const todoKeys = {
    all: ['todos'] as const,
    lists: () => [...todoKeys.all, 'list'] as const,
    list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
    details: () => [...todoKeys.all, 'detail'] as const,
    detail: (id: string) => [...todoKeys.details(), id] as const,
};

export function useTodosQuery() {
    return useQuery({
        queryKey: todoKeys.all,
        queryFn: getAllTodos,
    });
}