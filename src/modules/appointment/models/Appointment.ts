import { z } from "zod";
import {
  addDoc,
  collection,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  Query,
  query,
  QueryDocumentSnapshot,
  where,
  type DocumentData,
} from "firebase/firestore";
import { DefaultSchema } from "../../../services/shared/schemas/DefaultSchema";
import {
  checkIfUserExists,
  getUserDocument,
  UserRoles,
  UserSchema,
  type UserSchemaType,
} from "../../user/models/User";
import { db } from "../../../services/api/firebase";
import {
  AppointmentReportSchema,
  getReportByAppointmentId,
} from "./AppointmentReport";
import { ensureDate } from "../../../utils/dateUtils";

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

  reservationDate: z.date().refine((date) => date > new Date(), {
    message: "Appointment date must be in the future",
  }),
  reservationDuration: z.number().int().positive().default(30),

  reservationStatus: z
    .nativeEnum(AppointmentStatus)
    .default(AppointmentStatus.PENDING),
  appointmentType: z
    .nativeEnum(AppointmentType)
    .default(AppointmentType.IN_PERSON),
  urgencyLevel: z
    .nativeEnum(AppointmentUrgency)
    .default(AppointmentUrgency.ROUTINE),

  reasonForVisit: z.string().min(5).max(500),
  symptoms: z.array(z.string()).optional(),
  patientNotes: z.string().max(1000).optional(),
  isFollowUp: z.boolean().default(false),
  previousAppointmentId: z.string().optional(),

  location: z.string().optional(),
  roomNumber: z.string().optional(),
  videoCallLink: z.string().url().optional(),

  createdByUser: z.string(),
  cancellationReason: z.string().optional(),
  cancellationDate: z.date().optional(),
  cancelledByUserId: z.string().optional(),
  rescheduleCount: z.number().int().nonnegative().default(0),

  checkedIn: z.boolean().default(false),
  checkedInTime: z.date().optional(),
  completedTime: z.date().optional(),

  reminderSent: z.boolean().default(false),
  lastReminderDate: z.date().optional(),

  insuranceVerified: z.boolean().default(false),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  isPaid: z.boolean().default(false),

  specialtyRequired: z.string().optional(),

  reportId: z.string().nullable(),
});

export const AppointmentWithUserSchema = AppointmentSchema.extend({
  doctorId: UserSchema,
  patientId: UserSchema,
});

export const AppointmentWithReportSchema = AppointmentWithUserSchema.extend({
  report: AppointmentReportSchema,
});

export const AppointmentCreateSchema = AppointmentSchema.omit({
  id: true,
  reservationStatus: true,
  cancellationReason: true,
  cancellationDate: true,
  cancelledByUserId: true,
  checkedIn: true,
  checkedInTime: true,
  completedTime: true,
  reminderSent: true,
  lastReminderDate: true,
  insuranceVerified: true,
  estimatedCost: true,
  actualCost: true,
  isPaid: true,
  reportId: true,
});

export type AppointmentSchemaType = z.infer<typeof AppointmentSchema>;
export type AppointmentCreateSchemaType = z.infer<
  typeof AppointmentCreateSchema
>;
export type AppointmentWithUserSchemaType = z.infer<
  typeof AppointmentWithUserSchema
>;
export type AppointmentWithReportSchemaType = z.infer<
  typeof AppointmentWithReportSchema
>;

async function enhanceWithUserData(
  appointments: AppointmentSchemaType[]
): Promise<AppointmentWithUserSchemaType[]> {
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

      if (!userCache[doctorId] || !userCache[patientId]) {
        throw new Error("Doctor or Patient data is missing");
      }

      return {
        ...appointment,
        doctorId: userCache[doctorId]!,
        patientId: userCache[patientId]!,
      };
    })
  );
}

async function enhanceWithReportData(
  appointments: AppointmentWithUserSchemaType[]
): Promise<AppointmentWithReportSchemaType[]> {
  return await Promise.all(
    appointments.map(async (appointment) => {
      const report = await getReportByAppointmentId(appointment.id);

      if (!report) {
        throw new Error("Report data is missing");
      }

      return {
        ...appointment,
        report: report,
      };
    })
  );
}

function processAppointmentDocument(
  doc: QueryDocumentSnapshot<DocumentData>
): AppointmentSchemaType {
  const data = doc.data();

  // Process dates to ensure they're proper JavaScript Date objects
  const processedData: Partial<AppointmentSchemaType> = {
    id: doc.id,
    doctorId: data.doctorId,
    patientId: data.patientId,
    reservationDate: ensureDate(data.reservationDate),
    reservationDuration: data.reservationDuration || 30,
    reservationStatus: data.reservationStatus || AppointmentStatus.PENDING,
    appointmentType: data.appointmentType || AppointmentType.IN_PERSON,
    urgencyLevel: data.urgencyLevel || AppointmentUrgency.ROUTINE,
    reasonForVisit: data.reasonForVisit,
    symptoms: data.symptoms || [],
    patientNotes: data.patientNotes || "",
    isFollowUp: data.isFollowUp || false,
    previousAppointmentId: data.previousAppointmentId,
    location: data.location,
    roomNumber: data.roomNumber,
    videoCallLink: data.videoCallLink,
    createdByUser: data.createdByUser,
    cancellationReason: data.cancellationReason,
    cancellationDate: data.cancellationDate
      ? ensureDate(data.cancellationDate)
      : undefined,
    cancelledByUserId: data.cancelledByUserId,
    rescheduleCount: data.rescheduleCount || 0,
    checkedIn: data.checkedIn || false,
    checkedInTime: data.checkedInTime
      ? ensureDate(data.checkedInTime)
      : undefined,
    completedTime: data.completedTime
      ? ensureDate(data.completedTime)
      : undefined,
    reminderSent: data.reminderSent || false,
    lastReminderDate: data.lastReminderDate
      ? ensureDate(data.lastReminderDate)
      : undefined,
    insuranceVerified: data.insuranceVerified || false,
    estimatedCost: data.estimatedCost,
    actualCost: data.actualCost,
    isPaid: data.isPaid || false,
    specialtyRequired: data.specialtyRequired,
    reportId: data.reportId || null,
    createdAt: ensureDate(data.createdAt),
    updatedAt: ensureDate(data.updatedAt),
    deletedAt: data.deletedAt ? ensureDate(data.deletedAt) : null,
  };

  return processedData as AppointmentSchemaType;
}

export async function getAppointmentsForUser(
  userId: string,
  userRole: UserRoles,
  includeReports: boolean = false
): Promise<
  AppointmentWithUserSchemaType[] | AppointmentWithReportSchemaType[]
> {
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

    const processedAppointments = appointments.docs.map(
      processAppointmentDocument
    );

    const appointmentsWithValidation = await Promise.all(
      processedAppointments.map((appointment) =>
        AppointmentSchema.parseAsync(appointment)
      )
    );

    const enhancedAppointments = await enhanceWithUserData(
      appointmentsWithValidation
    );

    if (includeReports) {
      return await enhanceWithReportData(enhancedAppointments);
    }

    return enhancedAppointments;
  } catch (error) {
    console.error("Error getting appointments for user:", error);
    throw error;
  }
}

export async function getAppointmentById(
  appointmentId: string,
  includeReport: boolean = false
): Promise<
  AppointmentWithUserSchemaType | AppointmentWithReportSchemaType | null
> {
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

    const processedAppointment = processAppointmentDocument(
      appointments.docs[0]
    );
    const validatedAppointment = await AppointmentSchema.parseAsync(
      processedAppointment
    );

    let enhancedAppointment = await enhanceWithUserData([validatedAppointment]);

    if (includeReport) {
      enhancedAppointment = await enhanceWithReportData(enhancedAppointment);
    }

    return enhancedAppointment[0];
  } catch (error) {
    console.error("Error getting appointment by ID:", error);
    throw error;
  }
}

export async function createAppointment(
  appointmentData: AppointmentSchemaType
): Promise<DocumentReference<DocumentData>> {
  try {
    const appointmentCollectionRef = collection(
      db,
      APPOINTMENT_COLLECTION_NAME
    );

    const validatedAppointmentData = await AppointmentCreateSchema.parseAsync(
      appointmentData
    );

    return await addDoc(appointmentCollectionRef, validatedAppointmentData);
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
}

export async function checkIfAppointmentExists(
  appointmentId: string
): Promise<boolean> {
  try {
    const appointmentCollectionRef = doc(
      db,
      APPOINTMENT_COLLECTION_NAME,
      appointmentId
    );
    const appointmentDoc = await getDoc(appointmentCollectionRef);
    return appointmentDoc.exists();
  } catch (error) {
    console.error("Error checking if appointment exists:", error);
    throw error;
  }
}
