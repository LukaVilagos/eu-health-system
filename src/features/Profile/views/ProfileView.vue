<script setup lang="ts">
import { useTypedRoute } from '../../../composables/useTypedRoute';
import { useTodosByUserIdQuery } from '../../../queries/queryTodo';
import { useUserQuery } from '../../../queries/queryUser';
import { Card, ProgressSpinner } from 'primevue';

const route = useTypedRoute<"Profile">();

const userId = route.typedParams.userId;
const { data: user, isLoading: isUserLoading } = useUserQuery(userId);
const { data: todos, isLoading: isTodosLoading } = useTodosByUserIdQuery(userId);
</script>

<template>
    <Card>
        <template #content>
            <div v-if="isUserLoading || isTodosLoading" class="flex flex-col gap-2">
                <ProgressSpinner />
            </div>
            <div v-if="user && todos">
                <h1>{{ user.displayName }}</h1>
                <p>{{ user.email }}</p>
                <p>{{ user.role }}</p>
            </div>
            <div v-if="todos && user">
                <h2>TODO LIST</h2>
                <ul>
                    <li v-for="todo in todos" :key="todo.id">
                        {{ todo.text }}
                    </li>
                </ul>
            </div>
        </template>
    </Card>
</template>