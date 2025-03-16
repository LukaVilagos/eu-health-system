<script setup lang="ts">
import { useTypedRoute } from '../../../composables/useTypedRoute';
import { useUserQuery } from '../../../queries/queryUser';
import { Card, ProgressSpinner } from 'primevue';

const route = useTypedRoute<"Profile">();

const userId = route.typedParams.userId;
const { data: user, isLoading } = useUserQuery(userId);
</script>

<template>
    <Card>
        <template #content>
            <div v-if="isLoading" class="flex flex-col gap-2">
                <ProgressSpinner />
            </div>
            <div v-if="user">
                <h1>{{ user.displayName }}</h1>
                <p>{{ user.email }}</p>
                <p>{{ user.role }}</p>
            </div>
        </template>
    </Card>
</template>