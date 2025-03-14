<script lang="ts" setup>
import {Card} from "primevue"
import PageWrapper from "../../../components/ui/PageWrapper.vue";
</script>

<template>
  <PageWrapper>
    <Card>
      <template #title>This page doesn't exist</template>
      <template #subtitle>You can go back to the previous page</template>
    </Card>
  </PageWrapper>
</template>

<style scoped>

</style>