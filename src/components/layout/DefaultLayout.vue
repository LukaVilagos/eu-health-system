<script setup>
import PageWrapper from '../ui/PageWrapper.vue';
import Navbar from './Navbar.vue';
</script>

<template>
    <div>
        <div class="p-2">
            <Navbar />
        </div>
        <PageWrapper>
            <RouterView />
        </PageWrapper>
    </div>
</template>