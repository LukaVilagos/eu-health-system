<script lang="ts" setup>
import { ref, computed } from "vue";
import { useTodosQuery } from "../../../queries/queryTodo.ts";
import CreateTodo from "./CreateTodo.vue";
import { useAuthUser } from "../../../composables/useAuth";
import TodoList from "./TodoList.vue";

const visible = ref(false);
const { user } = useAuthUser();
const currentUserId = computed(() => user.value?.id || '');

const { data: todos, isLoading, isFetching, refetch } = useTodosQuery(currentUserId.value);

const hideDialog = () => {
  visible.value = false;
};

const showCreateDialog = () => {
  visible.value = true;
};

const handleTodoCreated = () => {
  hideDialog();
  refetch();
};
</script>

<template>
  <TodoList :todos="todos" :isLoading="isLoading || isFetching" :currentUserId="currentUserId" displayMode="table"
    :showOwner="true" :actions="['add', 'delete']" title="TODO TABLE" @add="showCreateDialog" />

  <CreateTodo :visible="visible" :userId="user?.id ?? ''" @close="hideDialog" @submit="handleTodoCreated" />
</template>