<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { Button, Message } from 'primevue';
import type { TodoWithUserSchemaType } from '../../../models/Todo';
import { getUserDocument } from '../../../models/User';
import { useGrantTodoPermissionMutation, useRevokeTodoPermissionMutation } from '../../../queries/queryTodo';
import UserPermissionsEditor from './UserPermissionsEditor.vue';

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
                            permissions: accessData.permissions,
                            addedAt: accessData.addedAt,
                            addedBy: accessData.addedBy
                        };
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
                await revokePermission({
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
            <UserPermissionsEditor v-model="sharedUsers" :loading="loadingUserData" :ownerId="todo.userId"
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
