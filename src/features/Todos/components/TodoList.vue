<script lang="ts" setup>
import { DataView, Button, Card, SelectButton } from "primevue";
import { computed, ref } from "vue";
import { useDeleteTodoMutation } from "../../../queries/queryTodo.ts";
import type { TodoWithUserSchemaType } from "../../../models/Todo.ts";
import LoadingIndicator from "../../Core/components/LoadingIndicator.vue";
import TodoTableView from "./TodoTableView.vue";
import TodoListView from "./TodoListView.vue";
import TodoGridView from "./TodoGridView.vue";

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
    displayMode: {
        type: String,
        default: 'table',
        validator: (value: string) => ['table', 'list', 'grid'].includes(value)
    },
    showActions: {
        type: Boolean,
        default: true
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

const { mutate: deleteTodoMutation, isPending: isDeleteUpdating } = useDeleteTodoMutation(props.currentUserId);

async function handleDeleteTodo(todo: TodoWithUserSchemaType) {
    deleteTodoMutation(todo.id);
    emit('delete', todo.id);
}

const isTableMode = computed(() => props.displayMode === 'table');
const isDataViewMode = computed(() => props.displayMode === 'list' || props.displayMode === 'grid');
const isLoadingOrUpdating = computed(() => props.isLoading || isDeleteUpdating.value);

const layout = ref<'list' | 'grid'>(props.displayMode === 'grid' ? 'grid' : 'list');
const layoutOptions = ref(['list', 'grid']);
</script>

<template>
    <Card v-if="isTableMode">
        <template #content>
            <TodoTableView :todos="todos" :isLoading="isLoadingOrUpdating" :currentUserId="currentUserId"
                :showActions="showActions" :showOwner="showOwner" :title="title" @add="$emit('add')"
                @delete="handleDeleteTodo" />
        </template>
    </Card>

    <Card v-else-if="isDataViewMode">
        <template #content>
            <div class="p-4" v-if="isLoadingOrUpdating">
                <LoadingIndicator message="Loading todos..." />
            </div>
            <DataView :value="todos" :layout="layout" dataKey="id">
                <template #header>
                    <div class="flex justify-between items-center">
                        <h2 class="font-bold text-xl">{{ title || 'TODO LIST' }}</h2>
                        <div class="flex gap-2">
                            <Button v-if="showActions" label="Add" icon="pi pi-plus" class="p-button-outlined"
                                @click="$emit('add')" />
                            <SelectButton v-model="layout" :options="layoutOptions" :allowEmpty="false">
                                <template #option="{ option }">
                                    <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-th-large']" />
                                </template>
                            </SelectButton>
                        </div>
                    </div>
                </template>

                <template #list>
                    <TodoListView :todos="todos" :currentUserId="currentUserId" :showActions="showActions"
                        :showOwner="showOwner" @delete="handleDeleteTodo" />
                </template>

                <template #grid>
                    <TodoGridView :todos="todos" :currentUserId="currentUserId" :showActions="showActions"
                        :showOwner="showOwner" @delete="handleDeleteTodo" />
                </template>

                <template #empty>
                    <div class="flex flex-col items-center gap-4 p-4" v-if="!isLoadingOrUpdating">
                        <p>No todos found</p>
                        <Button v-if="showActions" label="Add" icon="pi pi-plus" class="p-button-outlined"
                            @click="$emit('add')" />
                    </div>
                </template>
            </DataView>
        </template>
    </Card>
</template>