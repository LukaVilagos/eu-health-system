<script setup>
import PageWrapper from '../ui/PageWrapper.vue';
import Navbar from '../base/Navbar.vue';
</script>

<template>
    <div>
        <div class="px-4 pt-4">
            <Navbar />
        </div>
        <PageWrapper>
            <RouterView />
        </PageWrapper>
    </div>
</template>