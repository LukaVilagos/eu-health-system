<script lang="ts" setup>
import {GoogleAuthProvider, signInWithRedirect, signOut} from "firebase/auth";
import Button from "primevue/button";
import Card from "primevue/card";
import {useCurrentUser} from "vuefire";
import {getFirebase} from "../firebase/app.ts";

const {auth} = getFirebase();
const user = useCurrentUser();
</script>

<template>
  <Card>
    <template #title>Auth Card</template> a
    <template #content>
      <div class="flex gap-4">
        <Button
            v-if="!user"
            label="Sign in"
            @click="signInWithRedirect(auth, new GoogleAuthProvider())"/>
        <Button
            v-else
            label="Sign out"
            @click="signOut(auth)"/>
      </div>
      <div v-if="user">You are logged in as {{ user.displayName }}</div>
    </template>
  </Card>
</template>