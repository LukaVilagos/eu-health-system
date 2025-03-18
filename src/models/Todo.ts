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
import {
  checkIfUserExists,
  getUserDocument,
  type UserSchemaType,
} from "./User";
import { canViewTodo } from "../utils/todoPermissionHelpers.ts";
import { DefaultSchema } from "./schemas/DefaultSchema.ts";

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

export const TodoSchema = DefaultSchema.extend({
  text: z.string(),
  userId: z.string().refine(async (userId) => await checkIfUserExists(userId), {
    message: "Invalid userId: User does not exist.",
  }),
  access: AccessControlSchema.default({}),
  viewerIds: z.array(z.string()).default([]),
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

  return await Promise.all(
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
        viewerIds: data.viewerIds || [],
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
        viewerIds: data.viewerIds || [],
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
      viewerIds: data.viewerIds || [],
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
    viewerIds: [],
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

  const todoData = todoDoc.data();
  const currentViewerIds = todoData.viewerIds || [];
  const updateData: Record<string, any> = {
    [`access.${targetUserId}`]: {
      permissions,
      addedAt: new Date(),
      addedBy: grantedBy,
    },
  };

  if (permissions.includes(PermissionLevel.VIEW)) {
    if (!currentViewerIds.includes(targetUserId)) {
      updateData.viewerIds = [...currentViewerIds, targetUserId];
    }
  }

  await updateDoc(todoRef, updateData);
}

export async function revokeTodoPermission(
  todoId: string,
  userId: string
): Promise<void> {
  const todoRef = doc(db, TODO_COLLECTION_NAME, todoId);
  const todoDoc = await getDoc(todoRef);

  if (!todoDoc.exists()) {
    throw new Error("Todo not found");
  }

  const todoData = todoDoc.data();
  const updateData: Record<string, any> = {
    [`access.${userId}`]: deleteField(),
  };

  if (todoData.viewerIds && todoData.viewerIds.includes(userId)) {
    updateData.viewerIds = todoData.viewerIds.filter(
      (id: string) => id !== userId
    );
  }

  await updateDoc(todoRef, updateData);
}

export async function createTodoWithPermissions(
  text: string,
  creatorId: string,
  sharedWith: Record<string, PermissionSchemaType> = {}
): Promise<DocumentReference> {
  const access: Record<string, any> = {};
  const viewerIds: string[] = [];

  Object.entries(sharedWith).forEach(([userId, permissions]) => {
    access[userId] = {
      permissions: permissions.permissions,
      addedAt: new Date(),
      addedBy: creatorId,
    };

    if (permissions.permissions.includes(PermissionLevel.VIEW)) {
      viewerIds.push(userId);
    }
  });

  createTodoSchema.parse({ text, userId: creatorId });

  const todoData = {
    text,
    userId: creatorId,
    access,
    viewerIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const todosCollectionRef = collection(db, TODO_COLLECTION_NAME);
  return await addDoc(todosCollectionRef, todoData);
}

export async function getTodosSharedWithUser(
  userId: string
): Promise<TodoWithUserSchemaType[]> {
  try {
    const todosCollectionRef = collection(db, TODO_COLLECTION_NAME);
    const q = query(
      todosCollectionRef,
      where("viewerIds", "array-contains", userId),
      where("userId", "!=", userId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    const todos = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      const access: Record<string, any> = {};
      if (data.access) {
        Object.keys(data.access).forEach((accessUserId) => {
          access[accessUserId] = {
            ...data.access[accessUserId],
            addedAt: data.access[accessUserId].addedAt?.toDate
              ? data.access[accessUserId].addedAt.toDate()
              : new Date(),
          };
        });
      }

      return {
        id: doc.id,
        text: data.text,
        userId: data.userId,
        access: access,
        viewerIds: data.viewerIds || [],
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      };
    });

    const todosWithValidation = todos.map((todo) => TodoSchema.parse(todo));
    return await enhanceWithUserData(todosWithValidation);
  } catch (error) {
    console.error("Error fetching shared todos:", error);
    return [];
  }
}
