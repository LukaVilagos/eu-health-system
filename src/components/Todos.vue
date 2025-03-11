<script lang="ts" setup>
import {collection} from 'firebase/firestore';
import {useCollection} from 'vuefire';
import {db} from "../firebase/app.ts";
import {Button, Card, OrderList} from "primevue";
import {useAuth} from "../composables/useAuth.ts";

const todos = useCollection(collection(db, 'todos'));
const {user} = useAuth();
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
      <Button label="Add" />
    </template>
    <template #footer>footer</template>
  </Card>
</template>