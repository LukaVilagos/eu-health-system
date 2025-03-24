import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import {
  createAppointment,
  getAppointmentsForUser,
  type AppointmentSchemaType,
} from "../models/Appointment";
import { getUserDocument, type UserSchemaType } from "../../user/models/User";

export const AppointmentKeys = {
  all: ["appointments"],
  user: (userId: string) => ["appointments", { userId }],
  detail: (appointmentId: string) => ["appointments", { appointmentId }],
};

export const useAppointmentForUserQuery = (
  userId: string,
  pUser?: UserSchemaType,
  includeReports: boolean = false
) => {
  return useQuery({
    queryKey: [AppointmentKeys.all, { userId }],
    queryFn: async () => {
      if (!pUser) {
        const user = await getUserDocument(userId);

        if (!user) {
          throw new Error("User does not exist");
        }
        return await getAppointmentsForUser(userId, user.role, includeReports);
      }

      return await getAppointmentsForUser(userId, pUser.role, includeReports);
    },
  });
};

export const useCreateAppointmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: Partial<AppointmentSchemaType>) => {
      const result = await createAppointment(
        appointmentData as AppointmentSchemaType
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AppointmentKeys.all });
    },
  });
};
