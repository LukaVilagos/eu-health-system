<script setup>
import Navbar from '../base/Navbar.vue';
import PageWrapper from '../base/PageWrapper.vue';
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