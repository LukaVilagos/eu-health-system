<script setup lang="ts">
import { Avatar, Menu, Menubar, ProgressSpinner } from "primevue";
import { computed, ref } from "vue";
import type { MenuItem } from "primevue/menuitem";
import { useTypedRouter } from "../../router/hooks/useTypedRouter";
import { UserRoles } from "../../modules/user/models/User";
import { useAuth, useAuthUser } from "../../modules/auth/hooks/useAuthHooks";

const { signOut } = useAuth();
const { user, isLoading } = useAuthUser();
const router = useTypedRouter();

const showPatientItems = computed(() => {
    return user.value?.role === UserRoles.PATIENT;
});

const showDoctorItems = computed(() => {
    return user.value?.role === UserRoles.DOCTOR;
});

const patientItems = ref<MenuItem[]>([
    {
        label: 'Patient',
        icon: 'pi pi-user',
        command: () => router.typedPush({ name: "Patient", params: {} })
    }
]);

const doctorItems = ref<MenuItem[]>([
    {
        label: 'Doctor',
        icon: 'pi pi-user',
        command: () => router.typedPush({ name: "Doctor", params: {} })
    }
]);

const baseItems = ref<MenuItem[]>([
    {
        separator: true,
    },
    {
        label: 'Home',
        icon: 'pi pi-home',
        command: () => user && router.typedPush({
            name: "Home",
            params: {}
        })
    },
]);

const items = computed<MenuItem[]>(() => {
    const menuItems = [...baseItems.value];

    if (showPatientItems.value) {
        menuItems.push(...patientItems.value);
    }

    if (showDoctorItems.value) {
        menuItems.push(...doctorItems.value);
    }

    return menuItems;
});

const profileMenu = ref();
const profileMenuItems = ref([
    {
        label: 'Profile',
        icon: 'pi pi-user',
        command: () => user.value && router.typedPush({
            name: "Profile",
            params: { userId: user.value.uid }
        })
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
            <div v-if="isLoading" class="flex items-center p-2">
                <ProgressSpinner />
            </div>
            <button v-else-if="user" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu"
                class="overflow-hidden w-full border-0 bg-transparent flex items-center py-2 px-4 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md cursor-pointer transition-colors duration-200">
                <Avatar :image="user.photoURL as string" class="mr-2" shape="circle" />
                <span>{{ user.displayName }}</span>
            </button>
            <Menu ref="profileMenu" id="overlay_menu" :model="profileMenuItems" :popup="true" />
        </template>
    </Menubar>
</template>