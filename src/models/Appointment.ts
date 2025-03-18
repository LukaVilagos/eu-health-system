import { z } from "zod";
import { DefaultSchema } from "./schemas/DefaultSchema";
import {
  checkIfUserExists,
  getUserDocument,
  UserRoles,
  type UserSchemaType,
} from "./User";
import {
  addDoc,
  collection,
  getDocs,
  Query,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/app";

export const APPOINTMENT_COLLECTION_NAME = "appointments";

export enum AppointmentStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  CANCELLED = "Cancelled",
  COMPLETED = "Completed",
  NO_SHOW = "No Show",
}

export enum AppointmentType {
  IN_PERSON = "In Person",
  VIDEO_CALL = "Video Call",
  PHONE_CALL = "Phone Call",
}

export enum AppointmentUrgency {
  ROUTINE = "Routine",
  URGENT = "Urgent",
  EMERGENCY = "Emergency",
}

export const AppointmentSchema = DefaultSchema.extend({
  // Participant IDs with validation
  doctorId: z
    .string()
    .refine(async (userId) => await checkIfUserExists(userId), {
      message: "Invalid doctorId: Doctor does not exist.",
    }),
  patientId: z
    .string()
    .refine(async (userId) => await checkIfUserExists(userId), {
      message: "Invalid patientId: Patient does not exist.",
    }),

  // Schedule information
  reservationDate: z.date().refine((date) => date > new Date(), {
    message: "Appointment date must be in the future",
  }),
  reservationDuration: z.number().int().positive().default(30), // minutes

  // Status and type information
  reservationStatus: z
    .nativeEnum(AppointmentStatus)
    .default(AppointmentStatus.PENDING),
  appointmentType: z
    .nativeEnum(AppointmentType)
    .default(AppointmentType.IN_PERSON),
  urgencyLevel: z
    .nativeEnum(AppointmentUrgency)
    .default(AppointmentUrgency.ROUTINE),

  // Medical information
  reasonForVisit: z.string().min(5).max(500),
  symptoms: z.array(z.string()).optional(),
  patientNotes: z.string().max(1000).optional(),
  doctorNotes: z.string().max(2000).optional(),
  isFollowUp: z.boolean().default(false),
  previousAppointmentId: z.string().optional(),

  // Location information
  location: z.string().optional(), // Physical location or "Online"
  roomNumber: z.string().optional(),
  videoCallLink: z.string().url().optional(),

  // Administrative
  createdByUser: z.string(), // UserId of who created the appointment
  cancellationReason: z.string().optional(),
  cancellationDate: z.date().optional(),
  cancelledByUserId: z.string().optional(),
  rescheduleCount: z.number().int().nonnegative().default(0),

  // Check-in and completion
  checkedIn: z.boolean().default(false),
  checkedInTime: z.date().optional(),
  completedTime: z.date().optional(),

  // Communication
  reminderSent: z.boolean().default(false),
  lastReminderDate: z.date().optional(),

  // Billing/Insurance (basic fields)
  insuranceVerified: z.boolean().default(false),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  isPaid: z.boolean().default(false),

  // Metadata for filtering/searching
  specialtyRequired: z.string().optional(),
});

export const AppointmentWithUserSchema = AppointmentSchema.extend({
  doctorId: z.object({
    uid: z.string(),
    displayName: z.string(),
    photoUrl: z.string().optional(),
    email: z.string(),
  }),
  patientId: z.object({
    uid: z.string(),
    displayName: z.string(),
    photoUrl: z.string().optional(),
    email: z.string(),
  }),
});

export type AppointmentSchemaType = z.infer<typeof AppointmentSchema>;

async function enhanceWithUserData(appointments: AppointmentSchemaType[]) {
  const userCache: Record<string, UserSchemaType | null> = {};

  return await Promise.all(
    appointments.map(async (appointment) => {
      const doctorId = appointment.doctorId;
      const patientId = appointment.patientId;

      if (!userCache[doctorId]) {
        userCache[doctorId] = await getUserDocument(doctorId);
      }
      if (!userCache[patientId]) {
        userCache[patientId] = await getUserDocument(patientId);
      }

      return {
        ...appointment,
        doctorId: userCache[doctorId],
        patientId: userCache[patientId],
      };
    })
  );
}

export async function getAppointmentsForUser(
  userId: string,
  userRole: UserRoles
) {
  try {
    const appointmentCollectionRef = collection(
      db,
      APPOINTMENT_COLLECTION_NAME
    );
    let q: Query;
    if (userRole === UserRoles.DOCTOR) {
      q = query(appointmentCollectionRef, where("doctorId", "==", userId));
    } else if (userRole === UserRoles.PATIENT) {
      q = query(appointmentCollectionRef, where("patientId", "==", userId));
    } else {
      throw new Error("Invalid user role");
    }
    const appointments = await getDocs(q);

    if (appointments.empty) {
      return [];
    }

    const appointmentsWithValidation = appointments.docs.map((appointment) =>
      AppointmentSchema.parse(appointment.data())
    );
    return await enhanceWithUserData(appointmentsWithValidation);
  } catch (error) {
    console.error("Error getting appointments for user:", error);
    throw error;
  }
}

export async function getAppointmentById(appointmentId: string) {
  try {
    const appointmentCollectionRef = collection(
      db,
      APPOINTMENT_COLLECTION_NAME
    );
    const q = query(appointmentCollectionRef, where("id", "==", appointmentId));
    const appointments = await getDocs(q);

    if (appointments.empty) {
      return null;
    }

    const appointment = appointments.docs[0].data();
    const validatedAppointment = AppointmentSchema.parse(appointment);
    return await enhanceWithUserData([validatedAppointment]);
  } catch (error) {
    console.error("Error getting appointment by ID:", error);
    throw error;
  }
}

export async function createAppointment(
  appointmentData: AppointmentSchemaType
) {
  try {
    const appointmentCollectionRef = collection(
      db,
      APPOINTMENT_COLLECTION_NAME
    );
    return await addDoc(appointmentCollectionRef, appointmentData);
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
}
