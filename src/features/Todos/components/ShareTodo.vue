<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Checkbox, Button, Message, AutoComplete } from 'primevue';
import type { PermissionSchemaType } from '../../../models/Todo';
import { PermissionLevel } from '../../../models/Todo';
import { searchUsersByEmail } from '../../../utils/userSearch';
import type { UserSchemaType } from '../../../models/User';

const emit = defineEmits(['update:modelValue']);

const userEmail = ref('');
const selectedPermissions = ref<Record<string, string[]>>({});
const sharedUsers = ref<Record<string, { email: string, displayName: string | null }>>({});
const searchResults = ref<UserSchemaType[]>([]);
const searchLoading = ref(false);
const searchError = ref('');

const permissionOptions = [
    { name: 'View', value: PermissionLevel.VIEW },
    { name: 'Edit', value: PermissionLevel.EDIT },
    { name: 'Delete', value: PermissionLevel.DELETE },
    { name: 'Admin', value: PermissionLevel.ADMIN }
];

const searchUsers = async (event: { query: string }) => {
    searchLoading.value = true;
    searchError.value = '';

    try {
        const results = await searchUsersByEmail(event.query);
        searchResults.value = results;

        if (results.length === 0 && event.query.length > 2) {
            searchError.value = `No user found with email containing "${event.query}"`;
        }
    } catch (error) {
        console.error('Error searching users:', error);
        searchError.value = 'Error searching for users';
    } finally {
        searchLoading.value = false;
    }
};

const addUser = async () => {
    if (!userEmail.value) return;

    searchLoading.value = true;
    searchError.value = '';

    try {
        const results = await searchUsersByEmail(userEmail.value);

        if (results.length === 0) {
            searchError.value = `No user found with email "${userEmail.value}"`;
            return;
        }

        const user = results[0];

        if (sharedUsers.value[user.uid]) {
            searchError.value = 'This user has already been added';
            return;
        }

        const userId = user.uid;

        sharedUsers.value[userId] = {
            email: user.email || '',
            displayName: user.displayName
        };

        selectedPermissions.value[userId] = [PermissionLevel.VIEW];
        updateModelValue();

    } catch (error) {
        console.error('Error adding user:', error);
        searchError.value = 'Error adding user';
    } finally {
        searchLoading.value = false;
        userEmail.value = '';
    }
};

const selectUser = (user: UserSchemaType) => {
    if (sharedUsers.value[user.uid]) {
        searchError.value = 'This user has already been added';
        return;
    }

    const userId = user.uid;

    sharedUsers.value[userId] = {
        email: user.email || '',
        displayName: user.displayName
    };

    selectedPermissions.value[userId] = [PermissionLevel.VIEW]; // Default permission
    updateModelValue();
    userEmail.value = '';
    searchResults.value = [];
};

const removeUser = (userId: string) => {
    delete sharedUsers.value[userId];
    delete selectedPermissions.value[userId];
    updateModelValue();
};

const updateModelValue = () => {
    const sharedWith: Record<string, PermissionSchemaType> = {};

    Object.keys(sharedUsers.value).forEach(userId => {
        sharedWith[userId] = {
            permissions: selectedPermissions.value[userId] || [PermissionLevel.VIEW],
            addedAt: new Date(),
            addedBy: ''
        };
    });

    emit('update:modelValue', sharedWith);
};

watch(() => selectedPermissions.value, updateModelValue, { deep: true });
</script>

<template>
    <div class="share-todo">
        <div class="add-user flex flex-col gap-2">
            <div class="flex justify-between">
                <AutoComplete v-model="userEmail" :suggestions="searchResults" @complete="searchUsers"
                    placeholder="Search user by email" field="email" @item-select="(e) => selectUser(e.value)"
                    :loading="searchLoading">
                    <template #option="slotProps">
                        <div class="flex items-center gap-2 p-2">
                            <div>
                                <div class="font-semibold">{{ slotProps.option.displayName || 'Unknown User' }}</div>
                                <div class="text-sm text-gray-500">{{ slotProps.option.email }}</div>
                            </div>
                        </div>
                    </template>
                </AutoComplete>
                <Button icon="pi pi-plus" @click="addUser" :loading="searchLoading" />
            </div>

            <Message v-if="searchError" severity="warn" class="mb-2">
                {{ searchError }}
            </Message>
            <Message v-else severity="info" class="mb-2">
                Search for users by email to share this todo
            </Message>
        </div>

        <div v-if="Object.keys(sharedUsers).length > 0" class="user-list mt-4">
            <div v-for="(user, userId) in sharedUsers" :key="userId"
                class="user-item mb-3 p-3 border-1 border-gray-200 rounded-md">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <div class="font-semibold">{{ user.displayName || 'Unknown User' }}</div>
                        <div class="text-sm text-gray-500">{{ user.email }}</div>
                    </div>
                    <Button icon="pi pi-trash" class="p-button-danger p-button-sm p-button-text"
                        @click="() => removeUser(userId)" />
                </div>

                <div class="permissions flex flex-wrap gap-2">
                    <div v-for="option in permissionOptions" :key="option.value" class="permission-option">
                        <Checkbox :inputId="`${userId}-${option.value}`" :value="option.value"
                            v-model="selectedPermissions[userId]" :binary="false" />
                        <label :for="`${userId}-${option.value}`" class="ml-1">{{ option.name }}</label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
