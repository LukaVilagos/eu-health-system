<script lang="ts" setup>
import { Card, Button, ProgressSpinner } from "primevue";
import { useAuthGuard } from "../../../composables/useAuthGuard.ts";

const { user, isLoading, signIn } = useAuthGuard()
</script>

<template>
  <Card>
    <template #content>
      <div v-if="isLoading || user">
        <ProgressSpinner />
      </div>
      <div v-else>
        <Button v-if="!user" label="Sign in" @click="signIn" />
      </div>
    </template>
  </Card>
</template>