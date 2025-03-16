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
  deleteField,
  DocumentReference,
} from "firebase/firestore";
import { db } from "../firebase/app.ts";
import { z } from "zod";
import { getUserDocument, type UserSchemaType } from "./User";
import { canViewTodo } from "../utils/todoPermissionHelpers.ts";

export const TODO_COLLECTION_NAME = "todos";

export const PermissionLevel = {
  VIEW: "view",
  EDIT: "edit",
  DELETE: "delete",
  ADMIN: "admin",
};

const PermissionSchema = z.object({
  permissions: z.array(
    z.enum([
      PermissionLevel.VIEW,
      PermissionLevel.EDIT,
      PermissionLevel.DELETE,
      PermissionLevel.ADMIN,
    ])
  ),
  addedAt: z.date(),
  addedBy: z.string(),
});

const AccessControlSchema = z.record(
  z.string(),
  z.object({ ...PermissionSchema.shape })
);

export const TodoSchema = z.object({
  id: z.string(),
  text: z.string(),
  userId: z.string(),
  access: AccessControlSchema.default({}),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
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
  sharedWith: z.record(z.string(), PermissionSchema).optional(),
});

export type TodoSchemaType = z.infer<typeof TodoSchema>;
export type TodoWithUserSchemaType = z.infer<typeof TodoWithUserSchema>;
export type CreateTodoSchemaType = z.infer<typeof createTodoSchema>;
export type PermissionSchemaType = z.infer<typeof PermissionSchema>;

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

    const todos = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      const access: Record<string, any> = {};
      if (data.access) {
        Object.keys(data.access).forEach((userId) => {
          access[userId] = {
            ...data.access[userId],
            addedAt: data.access[userId].addedAt?.toDate
              ? data.access[userId].addedAt.toDate()
              : new Date(),
          };
        });
      }

      return {
        id: doc.id,
        text: data.text,
        userId: data.userId,
        access: access,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      };
    });

    const todosWithValidation = todos.map((todo) => TodoSchema.parse(todo));
    return await enhanceWithUserData(todosWithValidation);
  } catch (error) {
    console.error("Error fetching todos:", error);
    return [];
  }
}

export async function getTodosByUserId(
  userId: string,
  currentUserId: string
): Promise<TodoWithUserSchemaType[]> {
  try {
    const todosCollectionRef = collection(db, TODO_COLLECTION_NAME);
    const q = query(todosCollectionRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    const todos = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      const access: Record<string, any> = {};
      if (data.access) {
        Object.keys(data.access).forEach((userId) => {
          access[userId] = {
            ...data.access[userId],
            addedAt: data.access[userId].addedAt?.toDate
              ? data.access[userId].addedAt.toDate()
              : new Date(),
          };
        });
      }

      return {
        id: doc.id,
        text: data.text,
        userId: data.userId,
        access: access,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      };
    });

    const todosWithValidation = todos.map((todo) => TodoSchema.parse(todo));
    const filteredTodos = todosWithValidation.filter((todo) =>
      canViewTodo(todo, currentUserId)
    );
    return await enhanceWithUserData(filteredTodos);
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

    const data = docSnapshot.data();

    const access: Record<string, any> = {};
    if (data.access) {
      Object.keys(data.access).forEach((userId) => {
        access[userId] = {
          ...data.access[userId],
          addedAt: data.access[userId].addedAt?.toDate
            ? data.access[userId].addedAt.toDate()
            : new Date(),
        };
      });
    }

    const todo = {
      id: docSnapshot.id,
      text: data.text,
      userId: data.userId,
      access: access,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
    };

    const validatedTodo = TodoSchema.parse(todo);
    const enhancedTodos = await enhanceWithUserData([validatedTodo]);
    return enhancedTodos[0];
  } catch (error) {
    console.error("Error fetching todo by id:", error);
    return null;
  }
}

export async function createTodo(text: string, userId: string) {
  createTodoSchema.parse({ text, userId });

  const todoData = {
    text,
    userId,
    access: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const todosCollectionRef = collection(db, TODO_COLLECTION_NAME);
  return await addDoc(todosCollectionRef, todoData);
}

export async function deleteTodo(id: string) {
  const todosCollectionRef = doc(db, TODO_COLLECTION_NAME, id);
  return await deleteDoc(todosCollectionRef);
}

export async function updateTodo(id: string, text: string) {
  const todosCollectionRef = doc(db, TODO_COLLECTION_NAME, id);
  return await updateDoc(todosCollectionRef, { text });
}

export async function grantTodoPermission(
  todoId: string,
  targetUserId: string,
  permissions: string[],
  grantedBy: string
): Promise<void> {
  const todoRef = doc(db, TODO_COLLECTION_NAME, todoId);
  const todoDoc = await getDoc(todoRef);

  if (!todoDoc.exists()) {
    throw new Error("Todo not found");
  }

  const accessUpdate = {
    [`access.${targetUserId}`]: {
      permissions,
      addedAt: new Date(),
      addedBy: grantedBy,
    },
  };

  await updateDoc(todoRef, accessUpdate);
}

export async function revokeTodoPermission(
  todoId: string,
  userId: string
): Promise<void> {
  const todoRef = doc(db, TODO_COLLECTION_NAME, todoId);

  await updateDoc(todoRef, {
    [`access.${userId}`]: deleteField(),
  });
}

export async function createTodoWithPermissions(
  text: string,
  creatorId: string,
  sharedWith: Record<string, PermissionSchemaType> = {}
): Promise<DocumentReference> {
  console.log(sharedWith);
  const access: Record<string, any> = {};

  Object.entries(sharedWith).forEach(([userId, permissions]) => {
    access[userId] = {
      permissions: permissions.permissions,
      addedAt: new Date(),
      addedBy: creatorId,
    };
  });

  createTodoSchema.parse({ text, userId: creatorId });

  const todoData = {
    text,
    userId: creatorId,
    access,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const todosCollectionRef = collection(db, TODO_COLLECTION_NAME);
  return await addDoc(todosCollectionRef, todoData);
}
