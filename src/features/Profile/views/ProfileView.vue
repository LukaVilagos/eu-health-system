<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthUser } from '../../../composables/useAuth';
import { useTypedRoute } from '../../../composables/useTypedRoute';
import { useTodosByUserIdQuery, useSharedTodosQuery } from '../../../queries/queryTodo';
import { useUserQuery } from '../../../queries/queryUser';
import { Card } from 'primevue';
import LoadingIndicator from '../../Core/components/LoadingIndicator.vue';
import UserDisplay from '../../Core/components/UserDisplay.vue';
import TodoList from '../../Todos/components/TodoList.vue';
import CreateTodo from '../../Todos/components/CreateTodo.vue';

const route = useTypedRoute<"Profile">();
const userId = route.typedParams.userId;

const { user: authUser } = useAuthUser();
const currentUserId = computed(() => authUser.value?.uid || '');

const { data: user, isLoading: isUserLoading } = useUserQuery(userId);
const { data: todos, isLoading: isTodosLoading, isFetching: isTodosByUserFetching, refetch } = useTodosByUserIdQuery(userId, currentUserId.value);
const { data: sharedTodos, isLoading: isSharedTodosLoading, isFetching: isSharedTodosFetching } = useSharedTodosQuery(userId);

const createTodoVisible = ref(false);

const showCreateDialog = () => {
    createTodoVisible.value = true;
};

const hideCreateDialog = () => {
    createTodoVisible.value = false;
};

const handleTodoCreated = () => {
    hideCreateDialog();
    refetch();
};

defineProps({
    userId: {
        type: String,
        required: true
    }
});
</script>

<template>
    <div class="flex flex-col gap-4">
        <Card>
            <template #content>
                <div v-if="isUserLoading" class="flex flex-col gap-2">
                    <LoadingIndicator message="Loading profile information..." />
                </div>
                <div v-else-if="user" class="mb-8">
                    <UserDisplay :user="user" :showEmail="true" :showRole="true" size="large" />
                </div>
            </template>
        </Card>
        <div v-if="!isUserLoading">
            <TodoList :todos="todos || []" :isLoading="isTodosLoading || isTodosByUserFetching"
                :currentUserId="currentUserId" displayMode="list" :showOwner="false" :actions="['add', 'delete']"
                title="USER TODOS" @add="showCreateDialog" />

            <div class="mt-4">
                <TodoList :todos="sharedTodos || []" :isLoading="isSharedTodosLoading || isSharedTodosFetching"
                    :currentUserId="currentUserId" displayMode="list" :showOwner="true" :actions="['delete']"
                    title="SHARED WITH USER" />
            </div>
        </div>
    </div>

    <CreateTodo :visible="createTodoVisible" :userId="currentUserId" @close="hideCreateDialog"
        @submit="handleTodoCreated" />
</template>