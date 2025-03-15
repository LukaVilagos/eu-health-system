<script lang="ts" setup>
import { Dialog, InputText, Message, Button } from "primevue";
import { Form } from "@primevue/forms";
import { defineProps, defineEmits, ref } from "vue";

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
    <Dialog v-bind:visible="visible" v-on:update:visible="emit('close')" header="Create Todo">
        <Form v-slot="$form" class="flex flex-col gap-4 w-full sm:w-56" @submit="onFormSubmit">
            <InputText v-model="todoText" name="text" placeholder="Enter Todo" required />
            <Message v-if="$form.text?.invalid" severity="error" size="small" variant="simple">
                {{ $form.text.error.message }}
            </Message>
            <Button label="Submit" severity="primary" type="submit" />
        </Form>
    </Dialog>
</template>