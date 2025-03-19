import { PermissionLevel } from "../models/Todo";
import type { TodoSchemaType } from "../models/Todo";

/**
 * Checks if a user has specific permission for a todo
 */
export function hasPermission(
  todo: TodoSchemaType,
  userId: string,
  permission: string
): boolean {
  // Owner has all permissions
  if (todo.userId === userId) return true;

  const userAccess = todo.sharedWith?.[userId];
  if (!userAccess) return false;

  // Fix type safety by checking permission directly
  return (
    userAccess.permissions.includes(permission) ||
    userAccess.permissions.includes(PermissionLevel.ADMIN)
  );
}

/**
 * Check if user can view a todo
 */
export function canViewTodo(todo: TodoSchemaType, userId: string): boolean {
  return hasPermission(todo, userId, PermissionLevel.VIEW);
}

/**
 * Check if user can edit a todo
 */
export function canEditTodo(todo: TodoSchemaType, userId: string): boolean {
  return hasPermission(todo, userId, PermissionLevel.EDIT);
}

/**
 * Check if user can delete a todo
 */
export function canDeleteTodo(todo: TodoSchemaType, userId: string): boolean {
  return hasPermission(todo, userId, PermissionLevel.DELETE);
}

/**
 * Check if user is admin of a todo
 */
export function isAdminOfTodo(todo: TodoSchemaType, userId: string): boolean {
  return hasPermission(todo, userId, PermissionLevel.ADMIN);
}

/**
 * Return all permissions a user has on a todo
 */
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
