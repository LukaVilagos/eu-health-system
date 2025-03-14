<script lang="ts" setup>
import {Button, Card, OrderList} from "primevue";
import {useAuthGuard} from "../../../composables/useAuthGuard.ts";
import {getUserDocument, type UserSchemaType} from "../../../models/User.ts";
import {onMounted, ref} from "vue";
import {useTodosQuery} from "../../../queries/queryTodo.ts";
import {useRoute} from "vue-router";

const {signOut} = useAuthGuard();
const route = useRoute();

const userData = ref<UserSchemaType | null>(null);
const { data: todos } = useTodosQuery();

onMounted(async () => {
  if (!route.params.userId) {
    return;
  }
  userData.value = await getUserDocument(route.params.userId as string);
});

</script>

<template>
  <Card>
    <template #title>TODO LIST</template>
    <template #subtitle v-if="userData">{{ userData?.displayName }} : {{ userData?.role }}</template>
    <template #content>
      <OrderList v-if="todos" v-model="todos" breakpoint="575px" dataKey="id" pt:pcListbox:root="w-full sm:w-56">
        <template #option="{ option }">
          {{ option.text }}
        </template>
      </OrderList>
      <Button label="Sign out" @click="signOut"/>
    </template>
    <template #footer>footer</template>
  </Card>
</template>