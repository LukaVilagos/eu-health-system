<script setup lang="ts">
import { Card, Skeleton, Button, InputText, Message } from "primevue";
import { useDeleteTodoMutation, useTodoQuery, useUpdateTodoMutation } from "../../../queries/queryTodo.ts";
import { useTypedRoute } from "../../../composables/useTypedRoute.ts";
import { useTypedRouter } from "../../../composables/useTypedRouter.ts";
import { onMounted, ref, watch, computed } from "vue";
import { Form } from "@primevue/forms";
import { useAuthUser } from "../../../composables/useAuth.ts";
import { canEditTodo, canDeleteTodo } from "../../../utils/todoPermissionHelpers.ts";
import TodoPermissions from "../components/TodoPermissions.vue";

const route = useTypedRoute<"Todo">();
const router = useTypedRouter();
const { user } = useAuthUser();
const currentUserId = computed(() => user.value?.uid || '');

const todoId = route.typedParams.todoId;
const { data: todo, isFetching } = useTodoQuery(todoId, currentUserId.value);

const editMode = ref(false);
const todoText = ref("");
const showPermissions = ref(false);

const canEdit = computed(() => todo.value && canEditTodo(todo.value, currentUserId.value));
const canDelete = computed(() => todo.value && canDeleteTodo(todo.value, currentUserId.value));
const isOwner = computed(() => todo.value && todo.value.userId === currentUserId.value);

watch(todo, (newTodo) => {
    if (newTodo) {
        todoText.value = newTodo.text;
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
            <div v-if="todo && !isFetching && !isUpdating">
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
                    <p class="text-sm text-gray-500 mt-2">Created by: {{ todo.user?.displayName || 'Unknown User' }}</p>
                </div>

                <TodoPermissions v-if="showPermissions" />
            </div>
            <div v-if="isFetching || !todo || isUpdating">
                <div class="flex flex-col gap-4">
                    <Skeleton width="5rem" />
                    <Skeleton />
                </div>
            </div>
        </template>
    </Card>
</template>