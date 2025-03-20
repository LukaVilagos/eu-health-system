<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { AppRouteName } from '../../router/routeTypes';
import type { TypedRouteLocationRaw } from '../../../composables/useTypedRoute';

defineProps<{
    to: TypedRouteLocationRaw<AppRouteName>;
    custom?: boolean;
}>();
</script>

<template>
    <RouterLink :to="to" :custom="custom">
        <slot />
    </RouterLink>
</template>
