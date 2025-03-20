<script lang="ts" setup>
import { Dialog, InputText, Message, Button, Checkbox } from "primevue";
import { Form } from "@primevue/forms";
import { ref } from "vue";
import type { PermissionSchemaType } from "../models/Todo.ts";
import ShareTodo from "./ShareTodo.vue";
import { useCreateTodoMutation } from "../hooks/useTodoHooks.ts";

const props = defineProps({
    visible: {
        type: Boolean,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    }
});

const emit = defineEmits(["close", "submit"]);
const todoText = ref("");
const sharedWith = ref<Record<string, PermissionSchemaType>>({});
const enableSharing = ref(false);

const { mutate: createTodoMutation, isPending: isCreating } = useCreateTodoMutation();

const onFormSubmit = () => {
    if (todoText.value) {
        const todoData = {
            text: todoText.value,
            userId: props.userId,
            sharedWith: enableSharing.value ? sharedWith.value : {}
        };

        const processedSharedWith = todoData.sharedWith
            ? Object.fromEntries(
                Object.entries(todoData.sharedWith).map(([userId, permissions]) => [
                    userId,
                    {
                        permissions: permissions.permissions,
                        addedAt: permissions.addedAt || new Date(),
                        addedBy: permissions.addedBy || props.userId,
                    },
                ])
            )
            : {};

        createTodoMutation({
            text: todoData.text,
            userId: todoData.userId,
            sharedWith: processedSharedWith,
        }, {
            onSuccess: () => {
                emit("submit", todoData);
                todoText.value = "";
                sharedWith.value = {};
                enableSharing.value = false;
            }
        });
    }
};
</script>

<template>
    <Dialog v-bind:visible="visible" v-on:update:visible="emit('close')" pt:mask:class="backdrop-blur-sm"
        class="p-12 flex flex-col gap-12" :style="{ width: '550px' }">
        <template #header>
            <h2 class="text-xl font-semibold">Create New Todo</h2>
        </template>
        <template #container="{ closeCallback }">
            <Form v-slot="$form" class="flex flex-col gap-8 w-full" @submit="onFormSubmit">
                <div class="form-field">
                    <label for="todoText" class="block mb-2 font-medium">Todo Text</label>
                    <InputText id="todoText" v-model="todoText" name="text" placeholder="Enter Todo" required
                        class="w-full" />
                    <Message v-if="$form.text?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.text.error.message }}
                    </Message>
                </div>

                <div class="form-field">
                    <div class="flex items-center gap-2 mb-4">
                        <Checkbox v-model="enableSharing" :binary="true" inputId="enableSharing" />
                        <label for="enableSharing" class="cursor-pointer">Share with others</label>
                    </div>

                    <div v-if="enableSharing" class="sharing-section">
                        <ShareTodo v-model="sharedWith" />
                    </div>
                </div>

                <div class="flex justify-around mt-4">
                    <Button label="Cancel" type="button" class="p-button-text" @click="closeCallback()" />
                    <Button label="Create Todo" severity="primary" type="submit" :loading="isCreating" />
                </div>
            </Form>
        </template>
    </Dialog>
</template>