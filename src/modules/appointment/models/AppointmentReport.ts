import { z } from "zod";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
  DocumentReference,
  type DocumentData,
} from "firebase/firestore";
import { DefaultSchema } from "../../../services/shared/schemas/DefaultSchema";
import { checkIfUserExists } from "../../user/models/User";
import { db } from "../../../services/api/firebase";
import { AppointmentStatus, checkIfAppointmentExists } from "./Appointment";

export const APPOINTMENT_REPORT_COLLECTION_NAME = "appointmentReports";

export enum ReportStatus {
  DRAFT = "Draft",
  FINALIZED = "Finalized",
}

export const VitalSignsSchema = z
  .object({
    bloodPressure: z.string().optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    respiratoryRate: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    bmi: z.number().optional(),
  })
  .optional();

export const MedicationSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string().optional(),
  notes: z.string().optional(),
});

export const LabTestSchema = z.object({
  name: z.string(),
  reason: z.string().optional(),
  urgency: z.string().optional(),
  results: z.string().optional(),
  dateOrdered: z.date(),
  dateCompleted: z.date().optional(),
});

export const ReferralSchema = z.object({
  specialistType: z.string(),
  reason: z.string(),
  urgency: z.string().optional(),
  notes: z.string().optional(),
});

export const AppointmentReportSchema = DefaultSchema.extend({
  appointmentId: z
    .string()
    .refine(
      async (appointmentId) => await checkIfAppointmentExists(appointmentId),
      {
        message: "Invalid appointmentId: Appointment does not exist.",
      }
    ),

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

  diagnosis: z.string().min(5).max(2000),
  treatment: z.string().min(5).max(2000),
  medications: z.array(MedicationSchema).optional(),
  labTests: z.array(LabTestSchema).optional(),
  followUpNeeded: z.boolean().default(false),
  followUpDate: z.date().optional(),

  doctorNotes: z.string().max(5000).optional(),
  clinicalObservations: z.string().max(2000).optional(),

  reportStatus: z.nativeEnum(ReportStatus).default(ReportStatus.DRAFT),
  reportSubmissionDate: z.date().optional(),

  vitalSigns: VitalSignsSchema,
  referrals: z.array(ReferralSchema).optional(),

  attachments: z.array(z.string()).optional(),
});

export const AppointmentReportCreateSchema = AppointmentReportSchema.omit({
  id: true,
  reportSubmissionDate: true,
});

export type AppointmentReportSchemaType = z.infer<
  typeof AppointmentReportSchema
>;
export type AppointmentReportCreateSchemaType = z.infer<
  typeof AppointmentReportCreateSchema
>;

export async function getReportByAppointmentId(
  appointmentId: string
): Promise<AppointmentReportSchemaType | null> {
  try {
    const reportCollectionRef = collection(
      db,
      APPOINTMENT_REPORT_COLLECTION_NAME
    );
    const q = query(
      reportCollectionRef,
      where("appointmentId", "==", appointmentId)
    );
    const reports = await getDocs(q);

    if (reports.empty) {
      return null;
    }

    return AppointmentReportSchema.parse(reports.docs[0].data());
  } catch (error) {
    console.error("Error getting report by appointment ID:", error);
    throw error;
  }
}

export async function createAppointmentReport(
  reportData: AppointmentReportCreateSchemaType
): Promise<DocumentReference<DocumentData>> {
  try {
    const reportCollectionRef = collection(
      db,
      APPOINTMENT_REPORT_COLLECTION_NAME
    );
    const validatedReportData = AppointmentReportCreateSchema.parse(reportData);

    return await addDoc(reportCollectionRef, validatedReportData);
  } catch (error) {
    console.error("Error creating appointment report:", error);
    throw error;
  }
}

export async function finalizeReport(reportId: string): Promise<boolean> {
  try {
    const reportRef = doc(db, APPOINTMENT_REPORT_COLLECTION_NAME, reportId);

    await updateDoc(reportRef, {
      reportStatus: ReportStatus.FINALIZED,
      reportSubmissionDate: new Date(),
    });

    const report = await getReportById(reportId);
    if (report) {
      await updateAppointmentStatus(
        report.appointmentId,
        AppointmentStatus.COMPLETED
      );
    }

    return true;
  } catch (error) {
    console.error("Error finalizing report:", error);
    throw error;
  }
}

export async function getReportById(
  reportId: string
): Promise<AppointmentReportSchemaType | null> {
  try {
    const reportRef = doc(db, APPOINTMENT_REPORT_COLLECTION_NAME, reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) {
      return null;
    }

    return AppointmentReportSchema.parse({
      id: reportDoc.id,
      ...reportDoc.data(),
    });
  } catch (error) {
    console.error("Error getting report by ID:", error);
    throw error;
  }
}

async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<boolean> {
  try {
    const appointmentCollectionRef = collection(db, "appointments");
    const q = query(appointmentCollectionRef, where("id", "==", appointmentId));
    const appointments = await getDocs(q);

    if (!appointments.empty) {
      const appointmentRef = doc(db, "appointments", appointments.docs[0].id);
      await updateDoc(appointmentRef, {
        reservationStatus: status,
        completedTime: new Date(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating appointment status:", error);
    throw error;
  }
}

export async function getReportsByDoctorId(
  doctorId: string
): Promise<AppointmentReportSchemaType[]> {
  try {
    const reportCollectionRef = collection(
      db,
      APPOINTMENT_REPORT_COLLECTION_NAME
    );
    const q = query(reportCollectionRef, where("doctorId", "==", doctorId));
    const reports = await getDocs(q);

    if (reports.empty) {
      return [];
    }

    return reports.docs.map((doc) => AppointmentReportSchema.parse(doc.data()));
  } catch (error) {
    console.error("Error getting reports by doctor ID:", error);
    throw error;
  }
}

export async function getReportsByPatientId(
  patientId: string
): Promise<AppointmentReportSchemaType[]> {
  try {
    const reportCollectionRef = collection(
      db,
      APPOINTMENT_REPORT_COLLECTION_NAME
    );
    const q = query(reportCollectionRef, where("patientId", "==", patientId));
    const reports = await getDocs(q);

    if (reports.empty) {
      return [];
    }

    return reports.docs.map((doc) => AppointmentReportSchema.parse(doc.data()));
  } catch (error) {
    console.error("Error getting reports by patient ID:", error);
    throw error;
  }
}

export async function checkIfReportExists(reportId: string): Promise<boolean> {
  try {
    const reportRef = doc(db, APPOINTMENT_REPORT_COLLECTION_NAME, reportId);
    const reportDoc = await getDoc(reportRef);

    return reportDoc.exists();
  } catch (error) {
    console.error("Error checking if appointment report exists:", error);
    throw error;
  }
}
