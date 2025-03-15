<template>
  <AuthProvider>
    <RouterView />
  </AuthProvider>
</template>

<script setup lang="ts">
import AuthProvider from "./features/Auth/components/AuthProvider.vue";
</script>