import { PermissionLevel, type TodoSchemaType } from "../models/Todo";

export function hasPermission(
  todo: TodoSchemaType,
  userId: string,
  permission: string
): boolean {
  if (todo.userId === userId) return true;

  const userAccess = todo.sharedWith?.[userId];
  if (!userAccess) return false;

  return (
    userAccess.permissions.includes(permission) ||
    userAccess.permissions.includes(PermissionLevel.ADMIN)
  );
}

export function canViewTodo(todo: TodoSchemaType, userId: string): boolean {
  return hasPermission(todo, userId, PermissionLevel.VIEW);
}

export function canEditTodo(todo: TodoSchemaType, userId: string): boolean {
  return hasPermission(todo, userId, PermissionLevel.EDIT);
}

export function canDeleteTodo(todo: TodoSchemaType, userId: string): boolean {
  return hasPermission(todo, userId, PermissionLevel.DELETE);
}

export function isAdminOfTodo(todo: TodoSchemaType, userId: string): boolean {
  return hasPermission(todo, userId, PermissionLevel.ADMIN);
}

export function getUserPermissions(
  todo: TodoSchemaType,
  userId: string
): string[] {
  if (todo.userId === userId) {
    return [
      PermissionLevel.VIEW,
      PermissionLevel.EDIT,
      PermissionLevel.DELETE,
      PermissionLevel.ADMIN,
    ];
  }

  return todo.sharedWith[userId]?.permissions || [];
}
