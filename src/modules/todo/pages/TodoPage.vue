<script setup lang="ts">
import { Card, Button, InputText, Message } from "primevue";
import { useTypedRoute } from "../../../router/hooks/useTypedRoute.ts";
import { useTypedRouter } from "../../../router/hooks/useTypedRouter.ts";
import { onMounted, ref, watch, computed } from "vue";
import { Form } from "@primevue/forms";
import TodoPermissions from "../components/TodoPermissions.vue";
import { useAuthUser } from "../../auth/hooks/useAuthHooks.ts";
import { useDeleteTodoMutation, useTodoQuery, useUpdateTodoMutation } from "../hooks/useTodoHooks.ts";
import { canDeleteTodo, canEditTodo } from "../utils/todoPermissionHelpers.ts";
import LoadingIndicator from "../../../components/base/LoadingIndicator.vue";
import UserDisplay from "../../user/components/UserDisplay.vue";

const route = useTypedRoute<"Todo">();
const router = useTypedRouter();
const { user } = useAuthUser();
const currentUserId = computed(() => user.value?.id || '');

const todoId = route.typedParams.todoId;
const { data: todo, isFetching } = useTodoQuery(todoId, currentUserId.value);

const editMode = ref(false);
const todoText = ref("");
const showPermissions = ref(false);

const shouldShowPermissions = ref(route.query.permissions === "true");

const canEdit = computed(() => todo.value && canEditTodo(todo.value, currentUserId.value));
const canDelete = computed(() => todo.value && canDeleteTodo(todo.value, currentUserId.value));
const isOwner = computed(() => todo.value && todo.value.userId === currentUserId.value);

watch(todo, (newTodo) => {
    if (newTodo) {
        todoText.value = newTodo.text;

        if (shouldShowPermissions.value && newTodo.userId === currentUserId.value) {
            showPermissions.value = true;
        }
    }
}, { immediate: true });

function toggleEditMode() {
    if (!canEdit.value) return;

    editMode.value = !editMode.value;
    router.replace({
        query: {
            ...route.query,
            edit: editMode.value ? 'true' : undefined
        }
    });
}

function togglePermissions() {
    showPermissions.value = !showPermissions.value;
    shouldShowPermissions.value = showPermissions.value;
    router.replace({
        query: {
            ...route.query,
            permissions: showPermissions.value ? 'true' : undefined
        }
    });
}

const { mutate: deleteTodoMutation } = useDeleteTodoMutation(currentUserId.value);
const { mutate: updateTodoMutation, isPending: isUpdating } = useUpdateTodoMutation(currentUserId.value);
async function handleDeleteTodo() {
    if (!canDelete.value) return;

    deleteTodoMutation(todoId);
    router.typedPush({ name: "Home", params: {} });
}

async function handleEditTodo() {
    if (!canEdit.value) return;

    updateTodoMutation({ id: todoId as string, text: todoText.value });
    toggleEditMode();
}

onMounted(() => {
    if (route.query.edit === "true" && canEdit.value) {
        editMode.value = true;
    }
    shouldShowPermissions.value = route.query.permissions === "true";
});
</script>

<template>
    <Card>
        <template #title v-if="todo">TODO</template>
        <template #header>
            <div class="flex justify-end items-center p-4 gap-4">
                <Button v-if="isOwner" label="Permissions" icon="pi pi-users" class="p-button-outlined"
                    @click="togglePermissions" />
                <Button label="Delete" icon="pi pi-trash" class="p-button-outlined" @click="handleDeleteTodo"
                    :disabled="!canDelete" />
                <Button :label="editMode ? 'Cancel' : 'Edit'" :icon="editMode ? 'pi pi-times' : 'pi pi-pencil'"
                    class="p-button-outlined" @click="toggleEditMode" :disabled="!canEdit" />
            </div>
        </template>
        <template #content>
            <div v-if="todo && !isFetching && !isUpdating" class="flex flex-col gap-4">
                <div v-if="editMode">
                    <Form @submit="handleEditTodo" class="flex flex-col gap-4 max-w-64">
                        <InputText v-model="todoText" name="text" placeholder="Enter Todo" required />
                        <Button label="Submit" severity="primary" type="submit" />
                    </Form>
                </div>
                <div v-else>
                    <div v-if="!canEdit && !isOwner" class="mb-4">
                        <Message severity="info">You have view-only access to this Todo</Message>
                    </div>

                    <p>{{ todo.text }}</p>
                    <div class="mt-3">
                        <p class="text-sm text-gray-500 mb-1">Created by:</p>
                        <UserDisplay :user="todo.user" :showEmail="true" size="medium" />
                    </div>
                </div>

                <TodoPermissions v-if="showPermissions" :todo="todo" :currentUserId="currentUserId"
                    @close="showPermissions = false" />
            </div>
            <div v-if="isFetching || !todo || isUpdating">
                <LoadingIndicator message="Loading todo information..." />
            </div>
        </template>
    </Card>
</template>