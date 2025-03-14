<script lang="ts" setup>
import {collection} from 'firebase/firestore';
import {useCollection} from 'vuefire';
import {db} from "../firebase/app.ts";
import {Button, Card, OrderList} from "primevue";
import {useAuthGuard} from "../composables/useAuthGuard.ts";
import {onMounted, ref} from "vue";
import {getUserDocument, type UserSchemaType} from "../models/User.ts";

const todos = useCollection(collection(db, 'todos'));
const {user, signOut} = useAuthGuard();

const userData = ref<UserSchemaType | null>(null);

onMounted(async () => {
  if (user.value?.uid) {
    userData.value = await getUserDocument(user.value.uid);
  }
});

</script>

<template>
  <Card>
    <template #title>TODO LIST</template>
    <template #subtitle>{{ userData?.displayName }} : {{userData?.role}}</template>
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