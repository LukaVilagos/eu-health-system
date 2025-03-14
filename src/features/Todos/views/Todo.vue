<script setup lang="ts">
import { Card, Skeleton, Button, InputText } from "primevue";
import { useTodoQuery } from "../../../queries/queryTodo.ts";
import { useRoute } from "vue-router";
import PageWrapper from "../../../components/ui/PageWrapper.vue";
import { useTypedRouter } from "../../../composables/useTypedRouter.ts";
import { deleteTodo, updateTodo } from "../../../models/Todo.ts";
import { useAuthenticatedUser } from "../../../composables/useAuthGuard.ts";
import { onMounted, ref, watch } from "vue";
import { Form } from "@primevue/forms";

const route = useRoute();
const router = useTypedRouter();

const todoId = route.params.todoId;
const { data: todo, refetch, isFetching } = useTodoQuery(todoId as string);
const user = useAuthenticatedUser();

const editMode = ref(false);
const todoText = ref("");

watch(todo, (newTodo) => {
    if (newTodo) {
        todoText.value = newTodo.text;
    }
}, { immediate: true });

function toggleEditMode() {
    editMode.value = !editMode.value;
    router.replace({
        query: {
            ...route.query,
            edit: editMode.value ? 'true' : undefined
        }
    });
}

async function handleDeleteTodo() {
    await deleteTodo(todoId as string);
    router.typedPush({ name: "Home", params: { userId: user.uid } });
}

async function handleEditTodo() {
    await updateTodo(todoId as string, todoText.value);
    toggleEditMode();
    await refetch();
}

onMounted(() => {
    if (route.query.edit === "true") {
        editMode.value = true;
    }
});
</script>

<template>
    <PageWrapper>
        <Card>
            <template #title v-if="todo">TODO</template>
            <template #header>
                <div class="flex justify-end items-center p-4 gap-4">
                    <Button label="Delete" icon="pi pi-trash" class="p-button-outlined" @click="handleDeleteTodo" />
                    <Button :label="editMode ? 'Cancel' : 'Edit'" :icon="editMode ? 'pi pi-times' : 'pi pi-pencil'"
                        class="p-button-outlined" @click="toggleEditMode" />
                </div>
            </template>
            <template #content>
                <div v-if="todo && !isFetching">
                    <div v-if="editMode">
                        <Form @submit="handleEditTodo" class="flex flex-col gap-4 max-w-64">
                            <InputText v-model="todoText" name="text" placeholder="Enter Todo" required />
                            <Button label="Submit" severity="primary" type="submit" />
                        </Form>
                    </div>
                    <div v-else>
                        <p>{{ todo.text }}</p>
                    </div>
                </div>
                <div v-if="isFetching || !todo">
                    <div class="flex flex-col gap-4">
                        <Skeleton width="5rem" />
                        <Skeleton />
                    </div>
                </div>
            </template>
        </Card>
    </PageWrapper>
</template>