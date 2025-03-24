<script setup lang=ts>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'
import { computed } from "vue";
import { type CalendarOptions, type EventInput } from "@fullcalendar/core";
import { Card } from "primevue";
import { useAppointmentForUserQuery } from '../hooks/useAppointmentHooks';

const { userId } = defineProps({
  userId: {
    type: String,
    required: true
  }
});

const { data: appointments } = useAppointmentForUserQuery(userId);
const appointmentEvents = computed<EventInput[]>(() => {
  if (!appointments.value) return [];

  return appointments.value.map(appointment => ({
    title: appointment.reasonForVisit,
    start: appointment.reservationDate,
    end: new Date(new Date(appointment.reservationDate).getTime() + appointment.reservationDuration),
  }));
});

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: "dayGridWeek",
  events: appointmentEvents.value,
}));
</script>
<template>
  <Card>
    <template #content>
      <FullCalendar :options="calendarOptions" />
    </template>
  </Card>
</template>
