<script lang="ts" setup>
import {collection} from 'firebase/firestore';
import {useCollection} from 'vuefire';
import {getFirebase} from "../firebase/app.ts";

const {db} = getFirebase()

const todos = useCollection(collection(db, 'todos'));
</script>

<template>
  <ul class=" bg-black-100">
    <li v-for="todo in todos" v-if="todos" :key="todo.id">
      <label>{{ todo.text }}</label>
    </li>
  </ul>
</template>

<script lang="ts">

export default {
  name: 'Todos',
}
</script>