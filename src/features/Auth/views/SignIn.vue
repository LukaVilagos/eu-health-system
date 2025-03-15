<script lang="ts" setup>
import { Card } from "primevue";
import Auth from "../components/Auth.vue";
</script>

<template>
  <div class="grid place-items-center h-screen">
    <Card class="p-12">
      <template #title>Sign In to EU HEALTH</template>
      <template #content>
        <div class="py-6 flex flex-col items-center">
          <Auth />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped></style>