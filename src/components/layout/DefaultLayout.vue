<script setup>
import NavBar from '../base/NavBar.vue';
import PageWrapper from '../base/PageWrapper.vue';
</script>

<template>
    <div>
        <div class="px-4 pt-4">
            <NavBar />
        </div>
        <PageWrapper>
            <RouterView />
        </PageWrapper>
    </div>
</template>