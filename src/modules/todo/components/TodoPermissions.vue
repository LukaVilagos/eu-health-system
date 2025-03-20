<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { Button, Message } from 'primevue';
import type { TodoWithUserSchemaType } from '../models/Todo';
import UserPermissionsEditor from './UserPermissionsEditor.vue';
import { useGrantTodoPermissionMutation, useRevokeTodoPermissionMutation } from '../hooks/useTodoHooks';
import { useAllUsersQuery } from '../../user/hooks/useUserHooks';

const props = defineProps<{
    todo: TodoWithUserSchemaType | null;
    currentUserId: string;
}>();

const emit = defineEmits(['close']);

const sharedUsers = ref<Record<string, { email: string; displayName: string | null; permissions: string[]; addedAt: Date; addedBy: string }>>({});
const loadingUserData = ref(true);
const pendingChanges = ref<Record<string, string[]>>({});
const hasPendingChanges = computed(() => Object.keys(pendingChanges.value).length > 0);
const isSaving = ref(false);

const { mutate: grantPermission } = useGrantTodoPermissionMutation();
const { mutate: revokePermission } = useRevokeTodoPermissionMutation();
const { data: allUsers, isLoading } = useAllUsersQuery();

watch([() => allUsers.value, () => props.todo], ([users, todo]) => {
    if (users && todo) {
        loadingUserData.value = true;
        try {
            sharedUsers.value = {};
            for (const [userId, accessData] of Object.entries(todo.sharedWith)) {
                if (userId === todo.userId) continue;

                const userData = users.find(user => user.id === userId);
                if (userData) {
                    sharedUsers.value[userId] = {
                        email: userData.email || '',
                        displayName: userData.displayName,
                        permissions: accessData.permissions,
                        addedAt: accessData.addedAt,
                        addedBy: accessData.addedBy
                    };
                }
            }
        } finally {
            loadingUserData.value = false;
        }
    }
}, { immediate: true });

const addUser = ({ userId, user }: { userId: string, user: { permissions: string[] } }) => {
    if (!props.todo) return;

    pendingChanges.value[userId] = user.permissions;
};

const removeUser = (userId: string) => {
    if (!props.todo) return;

    pendingChanges.value[userId] = [];
};

const updatePermissions = ({ userId, permissions }: { userId: string, permissions: string[] }) => {
    pendingChanges.value[userId] = permissions;
};

const saveChanges = async () => {
    if (!props.todo || Object.keys(pendingChanges.value).length === 0) return;

    isSaving.value = true;

    try {
        for (const [userId, permissions] of Object.entries(pendingChanges.value)) {
            if (permissions.length === 0) {
                revokePermission({
                    todoId: props.todo.id,
                    userId
                });
            } else {
                grantPermission({
                    todoId: props.todo.id,
                    targetUserId: userId,
                    permissions: permissions,
                    grantedBy: props.currentUserId
                });
            }
        }

        pendingChanges.value = {};
    } catch (error) {
        console.error('Error saving permissions:', error);
    } finally {
        isSaving.value = false;
    }
};
</script>

<template>
    <div>
        <h3 class="text-lg font-semibold mb-4">Manage Todo Permissions</h3>

        <div v-if="todo">
            <UserPermissionsEditor v-model="sharedUsers" :loading="loadingUserData || isLoading" :ownerId="todo.userId"
                :currentUserId="currentUserId" :existingUserIds="[]" @add-user="addUser" @remove-user="removeUser"
                @update-permissions="updatePermissions" />

            <div class="flex justify-between mt-4">
                <Button :disabled="!hasPendingChanges" label="Save Changes" icon="pi pi-save" severity="success"
                    @click="saveChanges" :loading="isSaving" />
                <Button label="Close" @click="emit('close')" />
            </div>
        </div>
        <div v-else>
            <Message severity="error">Todo not found</Message>
        </div>
    </div>
</template>
