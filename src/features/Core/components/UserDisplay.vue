<script setup lang="ts">
import { Avatar } from 'primevue';

// Define a more flexible user type that makes properties optional
interface DisplayUserType {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
    uid?: string;
    role?: string;
    createdAt?: Date;
}

defineProps({
    user: {
        type: Object as () => DisplayUserType | null,
        required: true
    },
    showEmail: {
        type: Boolean,
        default: false
    },
    showRole: {
        type: Boolean,
        default: false
    },
    size: {
        type: String,
        default: 'medium',
        validator: (value: string) => ['small', 'medium', 'large'].includes(value)
    }
});
</script>

<template>
    <div class="user-display flex items-center gap-2">
        <Avatar :image="user?.photoURL as string" shape="circle"
            :size="size === 'small' ? 'normal' : size === 'large' ? 'xlarge' : 'large'" />
        <div :class="{ 'text-xs': size === 'small', 'text-base': size === 'medium', 'text-lg': size === 'large' }">
            <div class="font-semibold">{{ user?.displayName || 'Unknown User' }}</div>
            <div v-if="showEmail && user?.email" class="text-gray-500">{{ user.email }}</div>
            <div v-if="showRole && user?.role" class="text-gray-500">{{ user.role }}</div>
        </div>
    </div>
</template>