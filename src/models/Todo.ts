import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/app.ts";
import { z } from "zod";

export const TODO_COLLECTION_NAME = "todos";

export const TodoSchema = z.object({
  id: z.string(),
  text: z.string(),
});

const createTodoSchema = z.object({
  text: z.string().nonempty(),
});

export type TodoSchemaType = z.infer<typeof TodoSchema>;
export type CreateTodoSchemaType = z.infer<typeof createTodoSchema>;

export async function getAllTodos(): Promise<TodoSchemaType[]> {
  try {
    const todosCollectionRef = collection(db, TODO_COLLECTION_NAME);
    const querySnapshot = await getDocs(todosCollectionRef);

    if (querySnapshot.empty) {
      return [];
    }

    const todos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      text: doc.data().text,
    }));

    return todos.map((todo) => TodoSchema.parse(todo));
  } catch (error) {
    console.error("Error fetching todos:", error);
    return [];
  }
}

export async function getTodoById(id: string): Promise<TodoSchemaType | null> {
  try {
    const todosCollectionRef = doc(db, TODO_COLLECTION_NAME, id);
    const docSnapshot = await getDoc(todosCollectionRef);

    if (!docSnapshot.exists()) {
      return null;
    }

    const todo = {
      id: docSnapshot.id,
      text: docSnapshot.data().text,
    };

    return TodoSchema.parse(todo);
  } catch (error) {
    console.error("Error fetching todo by id:", error);
    return null;
  }
}

export async function createTodo(text: string) {
  const validatedData = createTodoSchema.parse({ text });
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
