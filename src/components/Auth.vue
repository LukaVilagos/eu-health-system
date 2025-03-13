<script lang="ts" setup>
import {inject} from "vue";
import {authKey} from "../composables/authKey.ts";
import {Card, Button} from "primevue";

const auth = inject(authKey);

if (!auth) {
  throw new Error('Auth was not provided');
}

const {user, isLoading, signIn, signOut} = auth;
</script>

<template>
  <Card>
    <template #content>
      <div v-if="isLoading">Loading...</div>

      <div v-else>
        <Button v-if="!user" label="Sign in" @click="signIn"/>
        <Button v-else label="Sign out" @click="signOut"/>

        <div v-if="user">
          <br>
          <div>
            You are logged in as {{ user.displayName }}
          </div>
          <Button variant="link">
            <RouterLink :to="{ name: 'Home' }">Go to Home Page</RouterLink>
          </Button>
        </div>
      </div>
    </template>
  </Card>
</template>