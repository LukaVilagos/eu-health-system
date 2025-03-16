<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue';
import { AutoComplete, Checkbox, Button, Message, ProgressSpinner } from 'primevue';
import type { TodoWithUserSchemaType } from '../../../models/Todo';
import { PermissionLevel } from '../../../models/Todo';
import { searchUsersByEmail } from '../../../utils/userSearch';
import type { UserSchemaType } from '../../../models/User';
import { getUserDocument } from '../../../models/User';
import { useGrantTodoPermissionMutation, useRevokeTodoPermissionMutation } from '../../../queries/queryTodo';

const props = defineProps<{
    todo: TodoWithUserSchemaType | null;
    currentUserId: string;
}>();

const emit = defineEmits(['close']);

const userEmail = ref('');
const selectedPermissions = ref<Record<string, string[]>>({});
const sharedUsers = ref<Record<string, { email: string; displayName: string | null; permissions: string[] }>>({});
const searchResults = ref<UserSchemaType[]>([]);
const searchLoading = ref(false);
const searchError = ref('');
const loadingUserData = ref(true);

const pendingChanges = ref<Record<string, string[]>>({});
const hasPendingChanges = computed(() => Object.keys(pendingChanges.value).length > 0);
const isSaving = ref(false);

const permissionOptions = [
    { name: 'View', value: PermissionLevel.VIEW },
    { name: 'Edit', value: PermissionLevel.EDIT },
    { name: 'Delete', value: PermissionLevel.DELETE },
    { name: 'Admin', value: PermissionLevel.ADMIN }
];

const { mutate: grantPermission } = useGrantTodoPermissionMutation();
const { mutate: revokePermission, isPending: isRevokingPermission } = useRevokeTodoPermissionMutation();

onMounted(async () => {
    if (props.todo) {
        loadingUserData.value = true;
        try {
            for (const [userId, accessData] of Object.entries(props.todo.access)) {
                if (userId === props.todo.userId) continue;

                try {
                    const userData = await getUserDocument(userId);
                    if (userData) {
                        sharedUsers.value[userId] = {
                            email: userData.email || '',
                            displayName: userData.displayName,
                            permissions: accessData.permissions
                        };
                        selectedPermissions.value[userId] = [...accessData.permissions];
                    }
                } catch (error) {
                    console.error(`Error fetching user data for ${userId}:`, error);
                }
            }
        } finally {
            loadingUserData.value = false;
        }
    }
});

const searchUsers = async (event: { query: string }) => {
    if (!props.todo) return;

    searchLoading.value = true;
    searchError.value = '';

    try {
        const results = await searchUsersByEmail(event.query);
        searchResults.value = results.filter(user =>
            user.uid !== props.todo?.userId &&
            !sharedUsers.value[user.uid]
        );

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
    if (!userEmail.value || !props.todo) return;

    searchLoading.value = true;
    searchError.value = '';

    try {
        const results = await searchUsersByEmail(userEmail.value);

        if (results.length === 0) {
            searchError.value = `No user found with email "${userEmail.value}"`;
            return;
        }

        const user = results[0];

        if (user.uid === props.todo.userId) {
            searchError.value = 'Cannot add the owner to permissions';
            return;
        }

        if (sharedUsers.value[user.uid]) {
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

        grantPermission({
            todoId: props.todo.id,
            targetUserId: userId,
            permissions: defaultPermissions,
            grantedBy: props.currentUserId
        });

    } catch (error) {
        console.error('Error adding user:', error);
        searchError.value = 'Error adding user';
    } finally {
        searchLoading.value = false;
        userEmail.value = '';
    }
};

const selectUser = (user: UserSchemaType) => {
    if (!props.todo) return;

    if (user.uid === props.todo.userId) {
        searchError.value = 'Cannot add the owner to permissions';
        return;
    }

    if (sharedUsers.value[user.uid]) {
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
    pendingChanges.value[userId] = defaultPermissions;

    userEmail.value = '';
    searchResults.value = [];
};

const removeUser = (userId: string) => {
    if (!props.todo) return;

    pendingChanges.value[userId] = [];

    delete sharedUsers.value[userId];
    delete selectedPermissions.value[userId];
};

const actuallyRemoveUser = async (userId: string) => {
    if (!props.todo) return;

    revokePermission({
        todoId: props.todo.id,
        userId
    });
};

watch(selectedPermissions, (newPermissions) => {
    if (!props.todo) return;

    for (const [userId, permissions] of Object.entries(newPermissions)) {
        const currentUserPerms = sharedUsers.value[userId]?.permissions;
        if (currentUserPerms && !arePermissionsEqual(permissions, currentUserPerms)) {
            pendingChanges.value[userId] = [...permissions];
        }
    }
}, { deep: true });

const saveChanges = async () => {
    if (!props.todo || Object.keys(pendingChanges.value).length === 0) return;

    isSaving.value = true;

    try {
        for (const [userId, permissions] of Object.entries(pendingChanges.value)) {
            if (permissions.length === 0) {
                await actuallyRemoveUser(userId);
            } else {
                grantPermission({
                    todoId: props.todo.id,
                    targetUserId: userId,
                    permissions: permissions,
                    grantedBy: props.currentUserId
                });

                if (sharedUsers.value[userId]) {
                    sharedUsers.value[userId].permissions = [...permissions];
                }
            }
        }

        pendingChanges.value = {};
    } catch (error) {
        console.error('Error saving permissions:', error);
    } finally {
        isSaving.value = false;
    }
};

function arePermissionsEqual(perms1: string[], perms2: string[]): boolean {
    if (perms1.length !== perms2.length) return false;
    return perms1.every(p => perms2.includes(p)) && perms2.every(p => perms1.includes(p));
}
</script>

<template>
    <div>
        <h3 class="text-lg font-semibold mb-4">Manage Todo Permissions</h3>

        <div v-if="loadingUserData" class="flex justify-center">
            <ProgressSpinner />
        </div>

        <div v-else>
            <div class="add-user flex flex-col gap-2 mb-4">
                <div class="flex items-center gap-2">
                    <AutoComplete v-model="userEmail" :suggestions="searchResults" @complete="searchUsers"
                        placeholder="Search user by email" field="email" @item-select="(e) => selectUser(e.value)"
                        :loading="searchLoading">
                        <template #option="slotProps">
                            <div class="flex items-center gap-2 p-2">
                                <div>
                                    <div class="font-semibold">{{ slotProps.option.displayName || 'Unknown User' }}
                                    </div>
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

            <div class="shared-users-list">
                <div v-if="Object.keys(sharedUsers).length === 0" class="text-center p-4">
                    <p>No users have been granted access to this Todo.</p>
                </div>

                <div v-else>
                    <div v-for="(user, userId) in sharedUsers" :key="userId"
                        class="user-item mb-3 p-3 border-1 border-gray-200 rounded-md">
                        <div class="flex justify-between items-center mb-2">
                            <div>
                                <div class="font-semibold">{{ user.displayName || 'Unknown User' }}</div>
                                <div class="text-sm text-gray-500">{{ user.email }}</div>
                            </div>
                            <Button icon="pi pi-trash" class="p-button-danger p-button-sm p-button-text"
                                @click="() => removeUser(userId)" :loading="isRevokingPermission" />
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

            <div class="flex justify-between mt-4">
                <Button :disabled="!hasPendingChanges" label="Save Changes" icon="pi pi-save" severity="success"
                    @click="saveChanges" :loading="isSaving" />
                <Button label="Close" @click="emit('close')" />
            </div>
        </div>
    </div>
</template>
