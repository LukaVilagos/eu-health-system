import type { RouteLocationNormalizedGeneric } from "vue-router";
import { USER_COLLECTION_NAME } from "../models/User";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/app";
import type { User } from "firebase/auth";

export const roleSelectionGuard = async (
  to: RouteLocationNormalizedGeneric,
  currentUser: User | null
) => {
  if (to.name === "RoleSelection" && currentUser) {
    const userDocRef = doc(db, USER_COLLECTION_NAME, currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().role) {
      return { name: "Home", params: { userId: currentUser.uid } };
    }
  }
  return true;
};

export const authGuard = (
  to: RouteLocationNormalizedGeneric,
  currentUser: User | null
) => {
  if (to.meta.isProtected && !currentUser) {
    return { name: "Forbidden" };
  }
  return true;
};

export const guestGuard = (
  to: RouteLocationNormalizedGeneric,
  currentUser: User | null
) => {
  if (to.meta.isGuestRoute && currentUser) {
    return { name: "Home", params: { userId: currentUser.uid } };
  }
  return true;
};
