<template>
    <Menubar :model="items">

    </Menubar>
</template>

<script setup lang="ts">
import { Menubar } from "primevue";
import { ref } from "vue";

const items = ref([
    {
        label: "Home",
        icon: "pi pi-fw pi-home",
        to: "/",
    },
    {
        label: "About",
        icon: "pi pi-fw pi-info",
        to: "/about",
    },
    {
        label: "Contact",
        icon: "pi pi-fw pi-envelope",
        to: "/contact",
    },
]);
</script>

<style scoped></style>