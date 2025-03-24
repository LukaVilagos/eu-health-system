<script lang="ts" setup>
import { Dialog, InputText, Message, Button, Textarea, InputNumber, Checkbox, Select, DatePicker, Tag } from "primevue";
import { Form } from "@primevue/forms";
import { reactive, ref } from "vue";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { z } from "zod";
import { useCreateAppointmentMutation } from "../hooks/useAppointmentHooks";
import { AppointmentType, AppointmentUrgency } from "../models/Appointment";

const props = defineProps({
    visible: {
        type: Boolean,
        required: true,
    },
    patientId: {
        type: String,
        required: true,
    },
    doctorId: {
        type: String,
        required: true,
    },
    createdByUserId: {
        type: String,
        required: true,
    }
});

const emit = defineEmits(["close", "submit"]);

// Form schema with validation
const formSchema = z.object({
    doctorId: z.string().min(1, "Doctor is required"),
    patientId: z.string().min(1, "Patient is required"),

    reservationDate: z.date().refine(date => date > new Date(), {
        message: "Appointment date must be in the future"
    }),
    reservationDuration: z.number().int().positive().default(30),

    appointmentType: z.nativeEnum(AppointmentType),
    urgencyLevel: z.nativeEnum(AppointmentUrgency),

    reasonForVisit: z.string().min(5, "Reason must be at least 5 characters").max(500),
    symptoms: z.array(z.string()).optional().default([]),
    patientNotes: z.string().max(1000).optional().default(""),

    isFollowUp: z.boolean().default(false),
    previousAppointmentId: z.string().optional(),

    location: z.string().optional(),
    roomNumber: z.string().optional(),
    videoCallLink: z.string().url().optional(),

    specialtyRequired: z.string().optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

const formValues = reactive<FormSchemaType>({
    doctorId: props.doctorId,
    patientId: props.patientId,
    reservationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    reservationDuration: 30,
    appointmentType: AppointmentType.IN_PERSON,
    urgencyLevel: AppointmentUrgency.ROUTINE,
    reasonForVisit: "",
    symptoms: [],
    patientNotes: "",
    isFollowUp: false,
    location: "",
    roomNumber: "",
});

const symptomInput = ref("");
const resolver = ref(zodResolver(formSchema));

const { mutate: createAppointmentMutation, isPending: isCreating } = useCreateAppointmentMutation();

const appointmentTypeOptions = Object.values(AppointmentType);
const urgencyLevelOptions = Object.values(AppointmentUrgency);

const addSymptom = () => {
    if (symptomInput.value.trim() && !formValues.symptoms.includes(symptomInput.value.trim())) {
        formValues.symptoms.push(symptomInput.value.trim());
        symptomInput.value = "";
    }
};

const removeSymptom = (symptom: string) => {
    formValues.symptoms = formValues.symptoms.filter(s => s !== symptom);
};

const onFormSubmit = () => {
    createAppointmentMutation({
        ...formValues,
        createdByUser: props.createdByUserId,
    }, {
        onSuccess: () => {
            emit("submit");
        }
    });
};
</script>

<template>
    <Dialog v-bind:visible="visible" v-on:update:visible="emit('close')" pt:mask:class="backdrop-blur-sm"
        class="p-12 flex flex-col gap-12" :style="{ width: '650px' }">
        <template #header>
            <h2 class="text-xl font-semibold">Schedule New Appointment</h2>
        </template>
        <template #container="{ closeCallback }">
            <Form v-slot="$form" v-model="formValues" :resolver class="flex flex-col gap-4 w-full overflow-y-scroll"
                @submit="onFormSubmit">
                <div class="form-field">
                    <label for="reservationDate" class="block mb-2 font-medium">Appointment Date & Time</label>
                    <DatePicker v-model="formValues.reservationDate" dateFormat="dd/mm/yy" showTime hourFormat="24"
                        name="reservationDate" placeholder="Select Date and Time" required class="w-full" />
                    <Message v-if="$form.reservationDate?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.reservationDate.error.message }}
                    </Message>
                </div>

                <div class="form-field">
                    <label for="reservationDuration" class="block mb-2 font-medium">Duration (minutes)</label>
                    <InputNumber v-model="formValues.reservationDuration" name="reservationDuration"
                        placeholder="Duration in minutes" required class="w-full" />
                    <Message v-if="$form.reservationDuration?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.reservationDuration.error.message }}
                    </Message>
                </div>

                <div class="form-field">
                    <label for="appointmentType" class="block mb-2 font-medium">Appointment Type</label>
                    <Select v-model="formValues.appointmentType" :options="appointmentTypeOptions"
                        name="appointmentType" placeholder="Select Type" required class="w-full" />
                    <Message v-if="$form.appointmentType?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.appointmentType.error.message }}
                    </Message>
                </div>

                <div class="form-field">
                    <label for="urgencyLevel" class="block mb-2 font-medium">Urgency Level</label>
                    <Select v-model="formValues.urgencyLevel" :options="urgencyLevelOptions" name="urgencyLevel"
                        placeholder="Select Urgency" required class="w-full" />
                    <Message v-if="$form.urgencyLevel?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.urgencyLevel.error.message }}
                    </Message>
                </div>

                <div class="form-field">
                    <label for="reasonForVisit" class="block mb-2 font-medium">Reason for Visit</label>
                    <Textarea v-model="formValues.reasonForVisit" name="reasonForVisit" rows="3"
                        placeholder="Describe the reason for this appointment" required class="w-full" />
                    <Message v-if="$form.reasonForVisit?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.reasonForVisit.error.message }}
                    </Message>
                </div>

                <div class="form-field">
                    <label class="block mb-2 font-medium">Symptoms</label>
                    <div class="flex gap-2 mb-2">
                        <InputText v-model="symptomInput" placeholder="Add symptom" class="flex-grow"
                            @keyup.enter="addSymptom" />
                        <Button type="button" icon="pi pi-plus" @click="addSymptom" />
                    </div>
                    <div v-if="formValues.symptoms.length > 0" class="flex flex-wrap gap-2 mt-2">
                        <Tag v-for="symptom in formValues.symptoms" :key="symptom"
                            class="bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                            <span>{{ symptom }}</span>
                            <button type="button" class="text-xs text-red-500"
                                @click="removeSymptom(symptom)">×</button>
                        </Tag>
                    </div>
                </div>

                <div class="form-field">
                    <label for="patientNotes" class="block mb-2 font-medium">Additional Notes</label>
                    <Textarea v-model="formValues.patientNotes" name="patientNotes" rows="2"
                        placeholder="Any additional information" class="w-full" />
                    <Message v-if="$form.patientNotes?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.patientNotes.error.message }}
                    </Message>
                </div>

                <div class="form-field">
                    <div class="flex items-center gap-2 mb-2">
                        <Checkbox v-model="formValues.isFollowUp" :binary="true" inputId="isFollowUp" />
                        <label for="isFollowUp" class="cursor-pointer">This is a follow-up appointment</label>
                    </div>
                </div>

                <div v-if="formValues.appointmentType === AppointmentType.IN_PERSON" class="grid grid-cols-2 gap-4">
                    <div class="form-field">
                        <label for="location" class="block mb-2 font-medium">Location</label>
                        <InputText v-model="formValues.location" name="location" placeholder="Location"
                            class="w-full" />
                    </div>
                    <div class="form-field">
                        <label for="roomNumber" class="block mb-2 font-medium">Room Number</label>
                        <InputText v-model="formValues.roomNumber" name="roomNumber" placeholder="Room #"
                            class="w-full" />
                    </div>
                </div>

                <div v-if="formValues.appointmentType === AppointmentType.VIDEO_CALL" class="form-field">
                    <label for="videoCallLink" class="block mb-2 font-medium">Video Call Link</label>
                    <InputText v-model="formValues.videoCallLink" name="videoCallLink"
                        placeholder="https://meet.example.com/..." class="w-full" />
                    <Message v-if="$form.videoCallLink?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.videoCallLink.error.message }}
                    </Message>
                </div>

                <div class="flex justify-around mt-4">
                    <Button label="Cancel" type="button" class="p-button-text" @click="closeCallback()" />
                    <Button label="Schedule Appointment" severity="primary" type="submit" :loading="isCreating" />
                </div>
            </Form>
        </template>
    </Dialog>
</template>
