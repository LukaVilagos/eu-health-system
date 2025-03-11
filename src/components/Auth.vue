<!-- SomeComponent.vue -->
<script lang="ts" setup>
import Button from "primevue/button";
import {inject} from "vue";
import {authKey} from "../composables/authKey.ts";

const auth = inject(authKey);

if (!auth) {
  throw new Error('Auth was not provided');
}

const {user, isLoading, signIn, signOut} = auth;

</script>

<template>
  <div>
    <div v-if="isLoading">Loading...</div>

    <div v-else>
      <Button v-if="!user" label="Sign in" @click="signIn"/>
      <Button v-else label="Sign out" @click="signOut"/>

      <div v-if="user">
        You are logged in as {{ user.displayName }}
        <RouterLink :to="{ name: 'Home' }">Go to Home Page</RouterLink>
      </div>
    </div>
  </div>
</template>