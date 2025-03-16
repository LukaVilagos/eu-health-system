<script setup lang="ts">
import { Avatar, Menu, Menubar } from "primevue";
import { ref } from "vue";
import { useAuthenticatedUser, useAuthGuard } from "../../composables/useAuthGuard";
import type { MenuItem } from "primevue/menuitem";
import { useTypedRouter } from "../../composables/useTypedRouter";

const { signOut } = useAuthGuard();
const user = useAuthenticatedUser();
const router = useTypedRouter();

const items = ref<MenuItem[]>([
    {
        separator: true,
    },
    {
        label: 'Home',
        icon: 'pi pi-home',
        command: () => router.typedPush({ name: "Home", params: { userId: user.uid } })
    },
    {
        separator: true,
    }
]);

const profileMenu = ref();
const profileMenuItems = ref([
    {
        label: 'Profile',
        icon: 'pi pi-user',
        command: () => router.typedPush({ name: "Profile", params: { userId: user.uid } })
    },
    {
        label: 'Sign Out',
        icon: 'pi pi-sign-out',
        command: () => signOut()
    }
]);

const toggle = (event: any) => {
    profileMenu.value.toggle(event);
};


</script>

<template>
    <Menubar :model="items" class="w-full">
        <template #start>
            <h2 class="text-center py-4 font-extrabold text-teal-600">EU HEALTH SYSTEM</h2>
        </template>
        <template #end>
            <button @click="toggle" aria-haspopup="true" aria-controls="overlay_menu"
                class="overflow-hidden w-full border-0 bg-transparent flex items-center py-2 px-4 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md cursor-pointer transition-colors duration-200">
                <Avatar :image="user.photoURL as string" class="mr-2" shape="circle" />
                <span>{{ user.displayName }}</span>
            </button>
            <Menu ref="profileMenu" id="overlay_menu" :model="profileMenuItems" :popup="true" />
        </template>
    </Menubar>
</template>