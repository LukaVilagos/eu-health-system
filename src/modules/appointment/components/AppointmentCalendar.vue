<script setup lang=ts>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'
import { ref } from "vue";
import { type CalendarOptions } from "@fullcalendar/core";
import { Card } from "primevue";

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: "dayGridWeek",
})
</script>
<template>
  <Card>
    <template #content>
      <FullCalendar :options="calendarOptions" />
    </template>
  </Card>
</template>
