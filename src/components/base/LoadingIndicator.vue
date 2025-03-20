<script setup lang="ts">
import { ProgressSpinner } from 'primevue';

defineProps({
    message: {
        type: String,
        default: 'Loading...'
    },
    centered: {
        type: Boolean,
        default: true
    }
});
</script>

<template>
    <div :class="{ 'flex justify-center items-center': centered }" class="my-4">
        <div class="flex flex-col gap-2 items-center">
            <ProgressSpinner />
            <span v-if="message" class="text-sm text-gray-500">{{ message }}</span>
        </div>
    </div>
</template>