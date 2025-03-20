<script setup lang="ts">
import { computed, ref } from 'vue';
import { Card } from 'primevue';
import { useTypedRoute } from '../../../router/hooks/useTypedRoute';
import { useAuthUser } from '../../auth/hooks/useAuthHooks';
import { useUserQuery } from '../hooks/useUserHooks';
import { useSharedTodosQuery, useTodosByUserIdQuery } from '../../todo/hooks/useTodoHooks';
import LoadingIndicator from '../../../components/base/LoadingIndicator.vue';
import UserDisplay from '../components/UserDisplay.vue';
import TodoList from '../../todo/components/TodoList.vue';
import CreateTodo from '../../todo/components/CreateTodo.vue';
import AppointmentCalendar from "../../appointment/components/AppointmentCalendar.vue";

const route = useTypedRoute<"Profile">();
const routeUserId = route.typedParams.userId;

const { user: authUser } = useAuthUser();
const currentUserId = computed(() => authUser.value?.id || '');

const { data: user, isLoading: isUserLoading } = useUserQuery(routeUserId);
const { data: todos, isLoading: isTodosLoading, isFetching: isTodosByUserFetching, refetch } = useTodosByUserIdQuery(routeUserId, currentUserId.value);
const { data: sharedTodos, isLoading: isSharedTodosLoading, isFetching: isSharedTodosFetching } = useSharedTodosQuery(routeUserId);

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
          <div class="flex flex-col gap-4">
            <TodoList :todos="todos || []" :isLoading="isTodosLoading || isTodosByUserFetching"
                :currentUserId="currentUserId" displayMode="list" :showOwner="false" :actions="['add', 'delete']"
                title="USER TODOS" @add="showCreateDialog" />

            <TodoList :todos="sharedTodos || []" :isLoading="isSharedTodosLoading || isSharedTodosFetching"
                :currentUserId="currentUserId" displayMode="list" :showOwner="true" :actions="['delete']"
                title="SHARED WITH USER" />

            <AppointmentCalendar />
            </div>
        </div>
    </div>

    <CreateTodo :visible="createTodoVisible" :userId="currentUserId" @close="hideCreateDialog"
        @submit="handleTodoCreated" />
</template>