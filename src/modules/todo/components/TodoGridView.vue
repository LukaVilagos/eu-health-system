<script lang="ts" setup>
import { Button } from "primevue";
import { computed } from "vue";
import { createTypedLink } from "../../../router/hooks/useTypedRoute.ts";
import type { TodoWithUserSchemaType } from "../models/Todo.ts";
import { canDeleteTodo, canViewTodo } from "../utils/todoPermissionHelpers.ts";
import TypedRouterLink from "../../../components/base/TypedRouterLink.vue";
import UserDisplay from "../../user/components/UserDisplay.vue";

const props = defineProps({
    todos: {
        type: Array as () => TodoWithUserSchemaType[],
        required: true
    },
    currentUserId: {
        type: String,
        required: true
    },
    actions: {
        type: Array as () => string[],
        default: () => ['add', 'delete']
    },
    showOwner: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['delete']);

const canDelete = computed(() => props.actions.includes('delete'));

function handleDeleteTodo(todo: TodoWithUserSchemaType) {
    emit('delete', todo);
}
</script>

<template>
    <div class="grid grid-cols-12 gap-4">
        <div v-for="todo in todos" :key="todo.id" class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
            <div
                class="p-4 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col h-full">
                <div class="text-lg font-medium mb-3">{{ todo.text }}</div>
                <div v-if="showOwner" class="mt-auto mb-3">
                    <UserDisplay :user="todo.user" size="small" />
                </div>
                <div v-if="actions.length > 0" class="flex gap-2 mt-auto">
                    <Button v-if="canDelete" icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-sm"
                        @click="handleDeleteTodo(todo)" :disabled="!canDeleteTodo(todo, currentUserId)" />
                    <TypedRouterLink :to="createTypedLink({
                        name: 'Todo',
                        params: { todoId: todo.id }
                    })">
                        <Button icon="pi pi-eye" class="p-button-rounded p-button-info p-button-sm"
                            :disabled="!canViewTodo(todo, currentUserId)" />
                    </TypedRouterLink>
                </div>
            </div>
        </div>
    </div>
</template>
