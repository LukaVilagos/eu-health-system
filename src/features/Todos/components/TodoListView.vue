<script lang="ts" setup>
import { Button } from "primevue";
import { computed } from "vue";
import { createTypedLink } from "../../../composables/useTypedRoute.ts";
import TypedRouterLink from "../../Core/components/TypedRouterLink.vue";
import { canDeleteTodo, canViewTodo } from "../../../utils/todoPermissionHelpers.ts";
import UserDisplay from "../../Core/components/UserDisplay.vue";
import type { TodoWithUserSchemaType } from "../../../models/Todo.ts";

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
    <div class="flex flex-col">
        <div v-for="(todo, index) in todos" :key="todo.id">
            <div class="flex flex-col sm:flex-row sm:items-center p-4 gap-4"
                :class="{ 'border-t border-surface-200 dark:border-surface-700': index !== 0 }">
                <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-4">
                    <div class="flex flex-col">
                        <div class="text-lg font-medium">{{ todo.text }}</div>
                        <div v-if="showOwner" class="mt-2">
                            <UserDisplay :user="todo.user" size="small" />
                        </div>
                    </div>
                    <div v-if="actions.length > 0" class="flex gap-2">
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
    </div>
</template>
