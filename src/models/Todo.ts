import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/app.ts";
import { z } from "zod";
import { getUserDocument, type UserSchemaType } from "./User";

export const TODO_COLLECTION_NAME = "todos";

export const TodoSchema = z.object({
  id: z.string(),
  text: z.string(),
  userId: z.string(),
});

export const TodoWithUserSchema = TodoSchema.extend({
  user: z
    .object({
      displayName: z.string().nullable(),
      photoURL: z.string().nullable(),
      email: z.string().nullable(),
    })
    .nullable(),
});

const createTodoSchema = z.object({
  text: z.string().nonempty(),
  userId: z.string().nonempty(),
});

export type TodoSchemaType = z.infer<typeof TodoSchema>;
export type TodoWithUserSchemaType = z.infer<typeof TodoWithUserSchema>;
export type CreateTodoSchemaType = z.infer<typeof createTodoSchema>;

async function enhanceWithUserData(
  todos: TodoSchemaType[]
): Promise<TodoWithUserSchemaType[]> {
  const userCache: Record<string, UserSchemaType | null> = {};

  const enhancedTodos = await Promise.all(
    todos.map(async (todo) => {
      if (!userCache[todo.userId]) {
        userCache[todo.userId] = await getUserDocument(todo.userId);
      }

      const user = userCache[todo.userId];
      return {
        ...todo,
        user: user
          ? {
              displayName: user.displayName,
              photoURL: user.photoURL,
              email: user.email,
            }
          : null,
      };
    })
  );

  return enhancedTodos;
}

export async function getAllTodos(): Promise<TodoWithUserSchemaType[]> {
  try {
    const todosCollectionRef = collection(db, TODO_COLLECTION_NAME);
    const querySnapshot = await getDocs(todosCollectionRef);

    if (querySnapshot.empty) {
      return [];
    }

    const todos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      text: doc.data().text,
      userId: doc.data().userId,
    }));

    const todosWithValidation = todos.map((todo) => TodoSchema.parse(todo));
    return await enhanceWithUserData(todosWithValidation);
  } catch (error) {
    console.error("Error fetching todos:", error);
    return [];
  }
}

export async function getTodosByUserId(
  userId: string
): Promise<TodoWithUserSchemaType[]> {
  try {
    const todosCollectionRef = collection(db, TODO_COLLECTION_NAME);
    const q = query(todosCollectionRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    const todos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      text: doc.data().text,
      userId: doc.data().userId,
    }));

    const todosWithValidation = todos.map((todo) => TodoSchema.parse(todo));
    return await enhanceWithUserData(todosWithValidation);
  } catch (error) {
    console.error("Error fetching todos for user:", error);
    return [];
  }
}

export async function getTodoById(
  id: string
): Promise<TodoWithUserSchemaType | null> {
  try {
    const todosCollectionRef = doc(db, TODO_COLLECTION_NAME, id);
    const docSnapshot = await getDoc(todosCollectionRef);

    if (!docSnapshot.exists()) {
      return null;
    }

    const todo = {
      id: docSnapshot.id,
      text: docSnapshot.data().text,
      userId: docSnapshot.data().userId,
    };

    const validatedTodo = TodoSchema.parse(todo);
    const enhancedTodos = await enhanceWithUserData([validatedTodo]);
    return enhancedTodos[0];
  } catch (error) {
    console.error("Error fetching todo by id:", error);
    return null;
  }
}

// Keep the existing createTodo, deleteTodo, and updateTodo functions
export async function createTodo(text: string, userId: string) {
  const validatedData = createTodoSchema.parse({ text, userId });
  const todosCollectionRef = collection(db, TODO_COLLECTION_NAME);
  return await addDoc(todosCollectionRef, validatedData);
}

export async function deleteTodo(id: string) {
  const todosCollectionRef = doc(db, TODO_COLLECTION_NAME, id);
  return await deleteDoc(todosCollectionRef);
}

export async function updateTodo(id: string, text: string) {
  const todosCollectionRef = doc(db, TODO_COLLECTION_NAME, id);
  return await updateDoc(todosCollectionRef, { text });
}
