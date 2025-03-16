<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Checkbox, Button, Message, AutoComplete, ProgressSpinner } from 'primevue';
import type { PermissionSchemaType } from '../../../models/Todo';
import { PermissionLevel } from '../../../models/Todo';
import { searchUsersByEmail } from '../../../utils/userSearch';
import type { UserSchemaType } from '../../../models/User';
import { getUserDocument } from '../../../models/User';

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

const emit = defineEmits(['update:modelValue', 'add-user', 'remove-user', 'update-permissions']);

const userEmail = ref('');
const selectedPermissions = ref<Record<string, string[]>>({});
const sharedUsers = ref<Record<string, { email: string, displayName: string | null, permissions: string[] }>>({});
const searchResults = ref<UserSchemaType[]>([]);
const searchLoading = ref(false);
const searchError = ref('');

const permissionOptions = [
    { name: 'View', value: PermissionLevel.VIEW },
    { name: 'Edit', value: PermissionLevel.EDIT },
    { name: 'Delete', value: PermissionLevel.DELETE },
    { name: 'Admin', value: PermissionLevel.ADMIN }
];

watch(() => props.modelValue, async (newValue) => {
    if (newValue) {
        for (const [userId, data] of Object.entries(newValue)) {
            if (!sharedUsers.value[userId]) {
                try {
                    const userData = await getUserDocument(userId);

                    sharedUsers.value[userId] = {
                        email: userData?.email || '',
                        displayName: userData?.displayName || null,
                        permissions: data.permissions
                    };
                } catch (error) {
                    console.error(`Error fetching user data for ${userId}:`, error);
                    sharedUsers.value[userId] = {
                        email: '',
                        displayName: 'Unknown User',
                        permissions: data.permissions
                    };
                }

                selectedPermissions.value[userId] = [...data.permissions];
            }
        }
    }
}, { immediate: true, deep: true });

const searchUsers = async (event: { query: string }) => {
    if (event.query.length < 2) return;

    searchLoading.value = true;
    searchError.value = '';

    try {
        const results = await searchUsersByEmail(event.query);

        searchResults.value = results.filter(user => {
            if (user.uid === props.ownerId) return false;
            if (sharedUsers.value[user.uid]) return false;
            if (props.existingUserIds.includes(user.uid)) return false;
            return true;
        });

        if (results.length > 0 && searchResults.value.length === 0) {
            searchError.value = 'No eligible users found with this email';
        } else if (results.length === 0 && event.query.length > 2) {
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

        if (user.uid === props.ownerId) {
            searchError.value = 'Cannot add the owner to permissions';
            return;
        }

        if (sharedUsers.value[user.uid] || props.existingUserIds.includes(user.uid)) {
            searchError.value = 'This user has already been added';
            return;
        }

        const userId = user.uid;
        const defaultPermissions = [PermissionLevel.VIEW];

        sharedUsers.value[userId] = {
            email: user.email || '',
            displayName: user.displayName,
            permissions: defaultPermissions
        };

        selectedPermissions.value[userId] = defaultPermissions;

        emit('add-user', {
            userId,
            user: {
                email: user.email || '',
                displayName: user.displayName,
                permissions: defaultPermissions
            }
        });

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
    if (user.uid === props.ownerId) {
        searchError.value = 'Cannot add the owner to permissions';
        return;
    }

    if (sharedUsers.value[user.uid] || props.existingUserIds.includes(user.uid)) {
        searchError.value = 'This user has already been added';
        return;
    }

    const userId = user.uid;
    const defaultPermissions = [PermissionLevel.VIEW];

    sharedUsers.value[userId] = {
        email: user.email || '',
        displayName: user.displayName,
        permissions: defaultPermissions
    };

    selectedPermissions.value[userId] = defaultPermissions;

    emit('add-user', {
        userId,
        user: {
            email: user.email || '',
            displayName: user.displayName,
            permissions: defaultPermissions
        }
    });

    updateModelValue();
    userEmail.value = '';
    searchResults.value = [];
};

const removeUser = (userId: string) => {
    emit('remove-user', userId);

    delete sharedUsers.value[userId];
    delete selectedPermissions.value[userId];

    updateModelValue();
};

const updateModelValue = () => {
    const updatedPermissions: Record<string, PermissionSchemaType> = {};

    Object.entries(sharedUsers.value).forEach(([userId]) => {
        updatedPermissions[userId] = {
            permissions: selectedPermissions.value[userId] || [PermissionLevel.VIEW],
            addedAt: props.modelValue[userId]?.addedAt || new Date(),
            addedBy: props.modelValue[userId]?.addedBy || props.currentUserId
        };
    });

    emit('update:modelValue', updatedPermissions);
};

watch(() => selectedPermissions.value, (newPermissions) => {
    Object.entries(newPermissions).forEach(([userId, permissions]) => {
        if (sharedUsers.value[userId] && !arePermissionsEqual(permissions, sharedUsers.value[userId].permissions)) {
            sharedUsers.value[userId].permissions = [...permissions];
            emit('update-permissions', { userId, permissions });
        }
    });
    updateModelValue();
}, { deep: true });

function arePermissionsEqual(perms1: string[], perms2: string[]): boolean {
    if (perms1.length !== perms2.length) return false;
    return perms1.every(p => perms2.includes(p)) && perms2.every(p => perms1.includes(p));
}
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

        <div v-if="props.loading" class="flex justify-center my-4">
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
