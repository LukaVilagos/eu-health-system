<template>
  <AuthProvider>
    <RouterView/>
  </AuthProvider>
</template>

<script setup lang="ts">
import AuthProvider from "./providers/AuthProvider.vue";
</script>