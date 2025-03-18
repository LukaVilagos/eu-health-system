import { z } from "zod";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase/app.ts";
import type { User } from "firebase/auth";
import { DefaultSchema } from "./schemas/DefaultSchema.ts";

export const USER_COLLECTION_NAME = "users";

export enum UserRoles {
  DOCTOR = "Doctor",
  PATIENT = "Patient",
}

export const UserSchema = DefaultSchema.extend({
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

export async function getAllUsers(): Promise<UserSchemaType[]> {
  try {
    const usersCollectionRef = collection(db, USER_COLLECTION_NAME);
    const querySnapshot = await getDocs(usersCollectionRef);

    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid,
        email: data.email ?? null,
        displayName: data.displayName ?? null,
        photoURL: data.photoURL ?? null,
        role: data.role as UserRoles,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        deletedAt: data.deletedAt ? data.deletedAt.toDate() : null,
      };
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function checkIfUserExists(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, USER_COLLECTION_NAME, userId);
    const userDoc = await getDoc(userDocRef);

    return userDoc.exists();
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
}
