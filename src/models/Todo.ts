import { collection, getDocs, addDoc } from "firebase/firestore";
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

export async function createTodo(text: string) {
  const validatedData = createTodoSchema.parse({ text });
  const todosCollectionRef = collection(db, TODO_COLLECTION_NAME);
  return await addDoc(todosCollectionRef, validatedData);
}
