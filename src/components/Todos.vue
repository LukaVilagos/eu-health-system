<script lang="ts" setup>
import {collection} from 'firebase/firestore';
import {useCollection} from 'vuefire';
import {db} from "../firebase/app.ts";
import {Button, Card, OrderList} from "primevue";
import {inject} from "vue";
import {authKey} from "../composables/authKey.ts";

const todos = useCollection(collection(db, 'todos'));

const auth = inject(authKey);

if (!auth) {
  throw new Error('Auth was not provided');
}

const {user, signOut} = auth;
</script>

<template>
  <Card>
    <template #title>TODO LIST</template>
    <template #subtitle>{{ user?.displayName }}</template>
    <template #content>
      <OrderList v-model="todos" breakpoint="575px" dataKey="id" pt:pcListbox:root="w-full sm:w-56">
        <template #option="{ option }">
          {{ option.text }}
        </template>
      </OrderList>
      <Button label="Sign out" @click="signOut"/>
    </template>
    <template #footer>footer</template>
  </Card>
</template>