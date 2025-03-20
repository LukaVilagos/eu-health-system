<script lang="ts" setup>
import { Checkbox, Button, Message, AutoComplete, ProgressSpinner } from 'primevue';
import type { PermissionSchemaType } from '../models/Todo';
import { useUserPermissions } from '../hooks/useUserPermissions';

const props = defineProps({
    modelValue: {
        type: Object as () => Record<string, PermissionSchemaType>,
        required: true
    },
    existingUserIds: {
        type: Array as () => string[],
        default: () => []
    },
    ownerId: {
        type: String,
        default: ''
    },
    currentUserId: {
        type: String,
        default: ''
    },
    loading: {
        type: Boolean,
        default: false
    },
    readOnly: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits<{
    'update:modelValue': [permissions: Record<string, PermissionSchemaType>];
    'add-user': [data: { userId: string, user: { email: string, displayName: string | null, permissions: string[] } }];
    'remove-user': [userId: string];
    'update-permissions': [data: { userId: string, permissions: string[] }];
}>();

const {
    userEmail,
    selectedPermissions,
    sharedUsers,
    searchResults,
    searchLoading,
    searchError,
    loadingUserData,
    permissionOptions,
    searchUsers,
    addUser,
    selectUser,
    removeUser
} = useUserPermissions(props, emit);
</script>

<template>
    <div class="user-permissions-editor">
        <div class="add-user flex flex-col gap-2">
            <div class="flex justify-between">
                <AutoComplete v-model="userEmail" :suggestions="searchResults" @complete="searchUsers"
                    placeholder="Search user by email" field="email" @item-select="(e) => selectUser(e.value)"
                    :loading="searchLoading" :disabled="readOnly">
                    <template #option="slotProps">
                        <div class="flex items-center gap-2 p-2">
                            <div>
                                <div class="font-semibold">{{ slotProps.option.displayName || 'Unknown User' }}</div>
                                <div class="text-sm text-gray-500">{{ slotProps.option.email }}</div>
                            </div>
                        </div>
                    </template>
                </AutoComplete>
                <Button icon="pi pi-plus" @click="addUser" :loading="searchLoading" :disabled="readOnly" />
            </div>

            <Message v-if="searchError" severity="warn" class="mb-2">
                {{ searchError }}
            </Message>
            <Message v-else severity="info" class="mb-2">
                Search for users by email to share this todo
            </Message>
        </div>

        <div v-if="props.loading || loadingUserData" class="flex justify-center my-4">
            <ProgressSpinner />
        </div>

        <div v-else-if="Object.keys(sharedUsers).length > 0" class="overflow-y-scroll max-h-[40vh] mt-4">
            <div v-for="(user, userId) in sharedUsers" :key="userId"
                class="user-item mb-3 p-3 border-1 border-gray-200 rounded-md">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <div class="font-semibold">{{ user.displayName || 'Unknown User' }}</div>
                        <div class="text-sm text-gray-500">{{ user.email }}</div>
                    </div>
                    <Button icon="pi pi-trash" class="p-button-danger p-button-sm p-button-text"
                        @click="() => removeUser(userId)" :disabled="readOnly" />
                </div>

                <div class="permissions flex flex-wrap gap-2">
                    <div v-for="option in permissionOptions" :key="option.value" class="permission-option">
                        <Checkbox :inputId="`${userId}-${option.value}`" :value="option.value"
                            v-model="selectedPermissions[userId]" :binary="false" :disabled="readOnly" />
                        <label :for="`${userId}-${option.value}`" class="ml-1">{{ option.name }}</label>
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="!props.loading" class="text-center p-4">
            <p>No users have been added yet.</p>
        </div>
    </div>
</template>
