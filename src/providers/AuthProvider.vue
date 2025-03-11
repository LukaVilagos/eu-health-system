<script setup lang="ts">
  import {useAuth} from "../composables/useAuth.ts";
  import {provide} from "vue";
  import {authKey} from "../composables/authKey.ts";

  provide(authKey, useAuth())
</script>

<template>
  <slot/>
</template>