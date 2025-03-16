<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useUserQuery } from '../../../queries/queryUser';
import { Card } from 'primevue';

const route = useRoute();

const userId = route.params.userId as string;
const { data: user } = useUserQuery(userId);
</script>

<template>
    <Card>
        <template v-if="user" #content>
            <h1>{{ user.displayName }}</h1>
            <p>{{ user.email }}</p>
            <p>{{ user.role }}</p>
        </template>
    </Card>
</template>