<script setup lang="ts">
import { Menu, Avatar } from "primevue";
import { ref } from "vue";
import { useAuthenticatedUser, useAuthGuard } from "../../composables/useAuthGuard";
import type { MenuItem } from "primevue/menuitem";

const { signOut } = useAuthGuard();
const user = useAuthenticatedUser();

const items = ref<MenuItem[]>([
    {
        separator: true,
    },
    {
        items: [
            {
                label: 'Home',
                icon: 'pi pi-home',
            },
        ]
    },
    {
        label: 'Profile',
        items: [
            {
                label: 'Settings',
                icon: 'pi pi-cog',
            },
            {
                label: 'Logout',
                icon: 'pi pi-sign-out',
                command: () => signOut()

            }
        ]
    },
    {
        separator: true,
    }
]);

</script>

<template>
    <div class="card flex justify-center">
        <Menu :model="items" class="w-full md:w-60">
            <template #start>
                <h2 class="text-center py-4 font-extrabold text-teal-600">EU HEALTH SYSTEM</h2>
            </template>
            <template #end>
                <div class="flex items-end h-full">
                    <button
                        class="overflow-hidden w-full border-0 bg-transparent flex items-center py-2 px-4 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-none cursor-pointer transition-colors duration-200">
                        <Avatar :image="user.photoURL as string" class="mr-2" shape="circle" />
                        <span>{{ user.displayName }}</span>
                    </button>
                </div>
            </template>
        </Menu>
    </div>
</template>