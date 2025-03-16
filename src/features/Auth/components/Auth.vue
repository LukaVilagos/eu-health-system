<script lang="ts" setup>
import { Button, ProgressSpinner } from "primevue";
import { useAuth } from "../../../composables/useAuth.ts";

const { user, isLoading, signIn } = useAuth()
</script>

<template>
  <div v-if="isLoading || user">
    <ProgressSpinner />
  </div>
  <div v-else>
    <Button v-if="!user" label="Sign In With Google" @click="signIn" icon="pi pi-google" aria-label="Sign in"
      icon-pos="right" />
  </div>
</template>