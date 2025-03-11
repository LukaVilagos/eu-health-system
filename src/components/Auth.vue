<script lang="ts" setup>
import { ref } from 'vue';
import Button from "primevue/button";
import Card from "primevue/card";
import { auth, signInWithPopup, provider, signOut, onAuthStateChanged } from "../firebase/app.ts";

const user = ref();

async function signIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    user.value = result.user;
  } catch (error) {
    console.error(error);
  }
}

async function handleSignOut() {
  await signOut(auth);
  user.value = null;
}

onAuthStateChanged(auth, (currentUser) => {
  user.value = currentUser;
});
</script>

<template>
  <Card>
    <template #title>Auth Card</template>
    <template #content>
      <div class="flex gap-4">
        <Button v-if="!user" label="Sign in" @click="signIn" />
        <Button v-else label="Sign out" @click="handleSignOut" />
      </div>
      <div v-if="user">You are logged in as {{ user.displayName }}</div>
    </template>
  </Card>
</template>
