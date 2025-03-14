<script lang="ts" setup>
import {inject} from "vue";
import {authKey} from "../composables/authKey.ts";
import {Card, Button} from "primevue";

const auth = inject(authKey);

if (!auth) {
  throw new Error('Auth was not provided');
}

const {user, isLoading, signIn} = auth;
</script>

<template>
  <Card>
    <template #content>
      <div v-if="isLoading || user">Loading...</div>
      <div v-else>
        <Button v-if="!user" label="Sign in" @click="signIn"/>
      </div>
    </template>
  </Card>
</template>