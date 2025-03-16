import type { RouteLocationNormalizedGeneric } from "vue-router";
import { UserRoles } from "../models/User";

export const protectedGuard = (
  to: RouteLocationNormalizedGeneric,
  user: any
) => {
  if (to.meta.isProtected && !user) {
    return { name: "SignIn", params: {} };
  }
  return true;
};

export const roleSelectionGuard = (
  to: RouteLocationNormalizedGeneric,
  user: any
) => {
  if (to.name === "RoleSelection" && user) {
    if (user.role) {
      return { name: "Home", params: {} };
    }
  }
  return true;
};

export const authGuard = (to: RouteLocationNormalizedGeneric, user: any) => {
  if (to.meta.isProtected && !user) {
    return { name: "Forbidden" };
  }
  return true;
};

export const guestGuard = (to: RouteLocationNormalizedGeneric, user: any) => {
  if (to.meta.isGuestRoute && user) {
    return { name: "Home", params: {} };
  }
  return true;
};

export const patientGuard = (to: RouteLocationNormalizedGeneric, user: any) => {
  if (to.meta.isPatientRoute && user) {
    if (user.value.role == UserRoles.PATIENT) {
      return true;
    }

    return { name: "Forbidden" };
  }
  return true;
};

export const doctorGuard = (to: RouteLocationNormalizedGeneric, user: any) => {
  if (to.meta.isDoctorRoute && user) {
    if (user.value.role == UserRoles.DOCTOR) {
      return true;
    }

    return { name: "Forbidden" };
  }
  return true;
};
