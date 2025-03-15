<script setup>
import Navbar from './Navbar.vue';
</script>

<template>
    <div class="grid grid-cols-[auto_1fr] h-screen">
        <div class="flex p-2">
            <Navbar />
        </div>
        <div class=" overflow-y-scroll scroll-smooth no-scrollbar">
            <RouterView />
        </div>
    </div>
</template>