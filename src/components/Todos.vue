<script lang="ts" setup>
import {collection} from 'firebase/firestore';
import {useCollection} from 'vuefire';
import {db} from "../firebase/app.ts";
import {Button, Card, OrderList} from "primevue";

const todos = useCollection(collection(db, 'todos'));
</script>

<template>
  <Card>
    <template #title>TODO LIST</template>
    <template #subtitle>subtitle</template>
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