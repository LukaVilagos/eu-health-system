<script lang="ts" setup>
import { Card, DataTable, Column, Button } from "primevue";
import { useTodosQuery } from "../../../queries/queryTodo.ts";
import { ref } from "vue";
import CreateTodo from "./CreateTodo.vue";
import { createTodo, type CreateTodoSchemaType } from "../../../models/Todo.ts";

const { data: todos, refetch } = useTodosQuery();
const visible = ref(false);

const hideDialog = () => {
  visible.value = false;
};

async function handleTodoCreated(todoData: CreateTodoSchemaType) {
  await createTodo(todoData.text);
  await refetch();
  hideDialog();
};
</script>

<template>
  <Card>
    <template #title>TODO LIST</template>
    <template #content>
      <DataTable :value="todos" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]">
        <template #header>
          <div class="flex justify-end">
            <Button label="Add" icon="pi pi-plus" class="p-button-sm p-button-outlined" @click="visible = true" />
          </div>
        </template>
        <Column field="id" header="ID" class=" w-28"></Column>
        <Column field="text" header="Text" sortable></Column>
      </DataTable>
    </template>
  </Card>

  <CreateTodo :visible="visible" @close="hideDialog" @submit="handleTodoCreated" />
</template>