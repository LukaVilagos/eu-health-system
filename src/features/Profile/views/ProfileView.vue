<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useUserQuery } from '../../../queries/queryUser';

const route = useRoute();

const userId = route.params.userId as string;
const { data: user } = useUserQuery(userId);
</script>

<template>
    <div v-if="user">
        <h1>{{ user.displayName }}</h1>
        <p>{{ user.email }}</p>
        <p>{{ user.role }}</p>
    </div>
</template>