import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/app";
import type { UserSchemaType } from "../models/User";

export async function searchUsersByEmail(
  partialEmail: string
): Promise<UserSchemaType[]> {
  if (!partialEmail || partialEmail.length < 3) {
    return [];
  }

  try {
    // This is a simple implementation - in a real app, you would use
    // a more sophisticated approach with proper indexing
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("email", ">=", partialEmail),
      where("email", "<=", partialEmail + "\uf8ff")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...(doc.data() as Omit<UserSchemaType, "id">),
        } as UserSchemaType)
    );
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}
