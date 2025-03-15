import { z } from "zod";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/app.ts";
import type { User } from "firebase/auth";

export const USER_COLLECTION_NAME = "users";

export enum UserRoles {
  DOCTOR = "Doctor",
  PATIENT = "Patient",
}

export const UserSchema = z.object({
  uid: z.string().nonempty(),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  photoURL: z.string().nullable(),
  role: z.nativeEnum(UserRoles),
  createdAt: z.date(),
});

export type UserSchemaType = z.infer<typeof UserSchema>;

export async function assignRoleAndCreateUserDocument(
  user: User,
  role: string
) {
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: role,
    createdAt: new Date(),
  };

  const validatedData = UserSchema.parse(userData);

  const userDocRef = doc(db, USER_COLLECTION_NAME, user.uid);
  return await setDoc(userDocRef, validatedData);
}

export async function getUserDocument(
  userId: string
): Promise<UserSchemaType | null> {
  try {
    const userDocRef = doc(db, USER_COLLECTION_NAME, userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as UserSchemaType;
  } catch (error) {
    console.error("Error fetching user document:", error);
    return null;
  }
}
