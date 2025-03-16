<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { PermissionSchemaType } from '../../../models/Todo';
import UserPermissionsEditor from './UserPermissionsEditor.vue';

const props = defineProps({
    modelValue: {
        type: Object as () => Record<string, PermissionSchemaType>,
        required: true
    }
});

const emit = defineEmits(['update:modelValue']);
const sharedWith = ref<Record<string, PermissionSchemaType>>(props.modelValue || {});

watch(() => props.modelValue, (newValue) => {
    sharedWith.value = newValue || {};
}, { deep: true });

const handleUpdate = (value: Record<string, PermissionSchemaType>) => {
    sharedWith.value = value;
    emit('update:modelValue', value);
};
</script>

<template>
    <div class="share-todo">
        <UserPermissionsEditor v-model="sharedWith" @update:modelValue="handleUpdate" />
    </div>
</template>
