import { z } from "zod";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { DefaultSchema } from "../../../services/shared/schemas/DefaultSchema";
import { db } from "../../../services/api/firebase";

export const USER_COLLECTION_NAME = "users";

export enum UserRoles {
  DOCTOR = "Doctor",
  PATIENT = "Patient",
}

export const UserSchema = DefaultSchema.extend({
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  photoURL: z.string().nullable(),
  role: z.nativeEnum(UserRoles),
});

export type UserSchemaType = z.infer<typeof UserSchema>;

export async function assignRoleAndCreateUserDocument(
  user: User,
  role: string
) {
  const userData = {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: role,
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
