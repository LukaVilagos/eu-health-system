<script lang="ts" setup>
import { Card, DataTable, Column, Button, ProgressSpinner, Avatar } from "primevue";
import { useCreateTodoMutation, useDeleteTodoMutation, useTodosQuery } from "../../../queries/queryTodo.ts";
import { ref, computed } from "vue";
import CreateTodo from "./CreateTodo.vue";
import { type CreateTodoSchemaType, type TodoWithUserSchemaType } from "../../../models/Todo.ts";
import { createTypedLink } from "../../../composables/useTypedRoute.ts";
import TypedRouterLink from "../../Core/components/TypedRouterLink.vue";
import { useAuthUser } from "../../../composables/useAuth";
import { canDeleteTodo, canViewTodo } from "../../../utils/todoPermissionHelpers.ts";

const visible = ref(false);
const { user } = useAuthUser();
const currentUserId = computed(() => user.value?.uid || '');

const { data: todos, isLoading } = useTodosQuery(currentUserId.value);

const hideDialog = () => {
  visible.value = false;
};

const { mutate: deleteTodoMutation, isPending: isDeleteUpdating } = useDeleteTodoMutation(currentUserId.value);
const { mutate: createTodoMutation, isPending: isCreateUpdating } = useCreateTodoMutation();

async function handleDeleteTodo(todo: TodoWithUserSchemaType) {
  if (canDeleteTodo(todo, currentUserId.value)) {
    deleteTodoMutation(todo.id);
  } else {
    console.error("You don't have permission to delete this todo.");
  }
}

async function handleTodoCreated(todoData: CreateTodoSchemaType) {
  const sharedWith = todoData.sharedWith
    ? Object.fromEntries(
      Object.entries(todoData.sharedWith).map(([userId, permissions]) => [
        userId,
        {
          permissions: permissions.permissions,
          addedAt: permissions.addedAt || new Date(),
          addedBy: permissions.addedBy || currentUserId.value,
        },
      ])
    )
    : {};

  createTodoMutation({
    text: todoData.text,
    userId: todoData.userId,
    sharedWith,
  });
  hideDialog();
}
</script>

<template>
  <Card>
    <template #content>
      <DataTable removableSort :loading="isLoading || isCreateUpdating || isDeleteUpdating" :value="todos"
        :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]">
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="font-bold text-xl">TODO TABLE</h2>
            <Button label="Add" icon="pi pi-plus" class="p-button-outlined" @click="visible = true" :disabled="!user" />
          </div>
        </template>
        <template #empty>
          <div class="flex flex-col items-center gap-4" v-if="!isLoading">
            <p>No todos found</p>
            <Button label="Add" icon="pi pi-plus" class="p-button-outlined" @click="visible = true" :disabled="!user" />
          </div>
        </template>
        <template #loading>
          <ProgressSpinner />
        </template>
        <Column field="id" header="ID" class="w-28"></Column>
        <Column field="text" header="Text" sortable></Column>
        <Column field="user.displayName" header="Owner" sortable class="w-48">
          <template #body="{ data }: { data: TodoWithUserSchemaType }">
            <div class="flex items-center gap-2">
              <Avatar :image="data.user?.photoURL as string" shape="circle" />
              <div class="text-sm">
                <span class="text-gray-500">{{ data.user?.displayName || 'Unknown User' }}</span>
              </div>
            </div>
          </template>
        </Column>
        <Column header="Actions" class="w-28">
          <template #body="{ data }: { data: TodoWithUserSchemaType }">
            <div class="w-full flex justify-center gap-2 items-center">
              <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-sm"
                @click="handleDeleteTodo(data)" :disabled="!canDeleteTodo(data, currentUserId)" />
              <TypedRouterLink :to="createTypedLink({
                name: 'Todo',
                params: { todoId: data.id }
              })">
                <Button icon="pi pi-eye" class="p-button-rounded p-button-info p-button-sm"
                  :disabled="!canViewTodo(data, currentUserId)" />
              </TypedRouterLink>
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <CreateTodo :visible="visible" :userId="user?.uid ?? ''" @close="hideDialog" @submit="handleTodoCreated" />
</template>