<script lang="ts" setup>
import {Card} from "primevue"
import PageWrapper from "../../../components/ui/PageWrapper.vue";
</script>

<template>
  <PageWrapper>
    <Card>
      <template #title>Forbidden</template>
      <template #subtitle>You don't have access to this page</template>
    </Card>
  </PageWrapper>
</template>

<style scoped>

</style>