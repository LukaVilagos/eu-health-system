<script lang="ts" setup>
import { Dialog, InputText, Message, Button } from "primevue";
import { Form } from "@primevue/forms";
import { defineEmits, ref } from "vue";

defineProps({
    visible: {
        type: Boolean,
        required: true,
    },
});

const emit = defineEmits(["close", "submit"]);
const todoText = ref("");

const onFormSubmit = () => {
    if (todoText.value) {
        emit("submit", { text: todoText.value });
        todoText.value = "";
    }
};
</script>

<template>
    <Dialog v-bind:visible="visible" v-on:update:visible="emit('close')" pt:mask:class="backdrop-blur-sm"
        class="p-12 flex flex-col gap-12">
        <template #container="{ closeCallback }">
            <Form v-slot="$form" class="flex flex-col gap-8 w-full sm:w-56" @submit="onFormSubmit">
                <InputText v-model="todoText" name="text" placeholder="Enter Todo" required />
                <Message v-if="$form.text?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.text.error.message }}
                </Message>
                <div class="flex justify-around">
                    <Button label="Cancel" type="button" class="p-button-text" @click="closeCallback()" />
                    <Button label="Submit" severity="primary" type="submit" />
                </div>
            </Form>
        </template>
    </Dialog>
</template>