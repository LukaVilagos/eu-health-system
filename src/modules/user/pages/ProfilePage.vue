<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button, Card } from 'primevue';
import { useTypedRoute } from '../../../router/hooks/useTypedRoute';
import { useAuthUser } from '../../auth/hooks/useAuthHooks';
import { useUserQuery } from '../hooks/useUserHooks';
import { useSharedTodosQuery, useTodosByUserIdQuery } from '../../todo/hooks/useTodoHooks';
import LoadingIndicator from '../../../components/base/LoadingIndicator.vue';
import UserDisplay from '../components/UserDisplay.vue';
import TodoList from '../../todo/components/TodoList.vue';
import CreateTodo from '../../todo/components/CreateTodo.vue';
import AppointmentCalendar from "../../appointment/components/AppointmentCalendar.vue";
import CreateAppointment from "../../appointment/components/CreateAppointment.vue";
import { UserRoles } from '../models/User';

defineProps({
    userId: {
        type: String,
        required: false
    }
});

const route = useTypedRoute<"Profile">();
const routeUserId = route.typedParams.userId;

const { user: authUser } = useAuthUser();
const currentUserId = computed(() => authUser.value?.id || '');

const { data: user, isLoading: isUserLoading } = useUserQuery(routeUserId);
const { data: todos, isLoading: isTodosLoading, isFetching: isTodosByUserFetching, refetch } = useTodosByUserIdQuery(routeUserId, currentUserId.value);
const { data: sharedTodos, isLoading: isSharedTodosLoading, isFetching: isSharedTodosFetching } = useSharedTodosQuery(routeUserId);

const createTodoVisible = ref(false);
const createAppointmentVisible = ref(false);

const isPatientOrDoctor = computed(() =>
    user.value?.role === UserRoles.PATIENT || user.value?.role === UserRoles.DOCTOR
);

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

const showAppointmentDialog = () => {
    createAppointmentVisible.value = true;
};

const hideAppointmentDialog = () => {
    createAppointmentVisible.value = false;
};

const handleAppointmentCreated = () => {
    hideAppointmentDialog();
};
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

                    <div class="flex justify-end mt-4" v-if="isPatientOrDoctor">
                        <Button icon="pi pi-calendar-plus" label="Schedule Appointment"
                            @click="showAppointmentDialog" />
                    </div>
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

                <AppointmentCalendar :user-id="routeUserId" />
            </div>
        </div>
    </div>

    <CreateTodo :visible="createTodoVisible" :userId="currentUserId" @close="hideCreateDialog"
        @submit="handleTodoCreated" />

    <CreateAppointment v-if="user" :visible="createAppointmentVisible"
        :patient-id="user.role === UserRoles.PATIENT ? routeUserId : currentUserId"
        :doctor-id="user.role === UserRoles.DOCTOR ? routeUserId : currentUserId" :created-by-user-id="currentUserId"
        @close="hideAppointmentDialog" @submit="handleAppointmentCreated" />
</template>