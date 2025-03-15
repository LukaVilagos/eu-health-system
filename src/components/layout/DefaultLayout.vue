<script setup>
import Navbar from './Navbar.vue';
</script>

<template>
    <div>
        <div class="p-2">
            <Navbar />
        </div>
        <div class=" overflow-y-scroll scroll-smooth no-scrollbar">
            <RouterView />
        </div>
    </div>
</template>