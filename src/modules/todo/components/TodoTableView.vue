<script lang="ts" setup>
import { DataTable, Column, Button } from "primevue";
import { computed } from "vue";
import { createTypedLink } from "../../../router/hooks/useTypedRoute.ts";
import TypedRouterLink from "../../Core/components/TypedRouterLink.vue";
import { canDeleteTodo, canViewTodo } from "../../../utils/todoPermissionHelpers.ts";
import LoadingIndicator from "../../Core/components/LoadingIndicator.vue";
import UserDisplay from "../../Core/components/UserDisplay.vue";
import type { TodoWithUserSchemaType } from "../models/Todo.ts";

const props = defineProps({
    todos: {
        type: Array as () => TodoWithUserSchemaType[],
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
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
    },
    title: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['add', 'delete']);

const canAdd = computed(() => props.actions.includes('add'));
const canDelete = computed(() => props.actions.includes('delete'));
const showActions = computed(() => props.actions.length > 0);

function handleDeleteTodo(todo: TodoWithUserSchemaType) {
    emit('delete', todo);
}
</script>

<template>
    <DataTable removableSort :loading="isLoading" :value="todos" :paginator="true" :rows="10"
        :rowsPerPageOptions="[5, 10, 20]">
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="font-bold text-xl">{{ title || 'TODO LIST' }}</h2>
                <Button v-if="canAdd" label="Add" icon="pi pi-plus" class="p-button-outlined" @click="$emit('add')" />
            </div>
        </template>
        <template #empty>
            <div class="flex flex-col items-center gap-4" v-if="!isLoading">
                <p>No todos found</p>
                <Button v-if="canAdd" label="Add" icon="pi pi-plus" class="p-button-outlined" @click="$emit('add')" />
            </div>
        </template>
        <template #loading>
            <LoadingIndicator message="Loading todos..." />
        </template>

        <Column field="text" header="Text" sortable></Column>

        <Column v-if="showOwner" field="user.displayName" header="Owner" sortable class="w-48">
            <template #body="{ data }: { data: TodoWithUserSchemaType }">
                <UserDisplay :user="data.user" size="small" />
            </template>
        </Column>

        <Column v-if="showActions" header="Actions" class="w-28">
            <template #body="{ data }: { data: TodoWithUserSchemaType }">
                <div class="w-full flex justify-center gap-2 items-center">
                    <Button v-if="canDelete" icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-sm"
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
