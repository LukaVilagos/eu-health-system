<script lang="ts" setup>
import { Card, DataTable, Column, Button, ProgressSpinner } from "primevue";
import { useTodosQuery } from "../../../queries/queryTodo.ts";
import { ref } from "vue";
import CreateTodo from "./CreateTodo.vue";
import { createTodo, deleteTodo, type CreateTodoSchemaType, type TodoSchemaType } from "../../../models/Todo.ts";
import { RouterLink } from "vue-router";


const { data: todos, refetch, isLoading, isFetching } = useTodosQuery();
const visible = ref(false);

const hideDialog = () => {
  visible.value = false;
};

async function handleTodoCreated(todoData: CreateTodoSchemaType) {
  await createTodo(todoData.text);
  await refetch();
  hideDialog();
};

async function handleDeleteTodo(id: string) {
  await deleteTodo(id);
  await refetch();
};
</script>

<template>
  <Card>
    <template #title>TODO LIST</template>
    <template #content>
      <DataTable removableSort :loading="isLoading || isFetching" :value="todos" :paginator="true" :rows="10"
        :rowsPerPageOptions="[5, 10, 20]">
        <template #header>
          <div class="flex justify-end items-center">
            <Button label="Add" icon="pi pi-plus" class="p-button-outlined" @click="visible = true" />
          </div>
        </template>
        <template #empty>
          <div class="flex flex-col items-center gap-4">
            <p>No todos found</p>
            <Button label="Add" icon="pi pi-plus" class="p-button-outlined" @click="visible = true" />
          </div>
        </template>
        <template #loading>
          <ProgressSpinner />
        </template>
        <Column field="id" header="ID" class=" w-28"></Column>
        <Column field="text" header="Text" sortable f></Column>
        <Column header="Actions" class="w-28">
          <template #body="{ data }: { data: TodoSchemaType }">
            <div class="w-full flex justify-center gap-2 items-center">
              <Button icon=" pi pi-trash" class="p-button-rounded p-button-danger p-button-sm"
                @click="handleDeleteTodo(data.id)" />
              <RouterLink :to="{ name: 'Todo', params: { todoId: data.id } }">
                <Button icon=" pi pi-pencil" class="p-button-rounded p-button-info p-button-sm" />
              </RouterLink>
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <CreateTodo :visible="visible" @close="hideDialog" @submit="handleTodoCreated" />
</template>