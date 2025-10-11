/**
 * User roles in the system
 */
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SERVICE = 'service',
}

/**
 * Granular permissions for fine-grained access control
 */
export enum Permission {
  // User Management
  READ_OWN_PROFILE = 'read:own_profile',
  UPDATE_OWN_PROFILE = 'update:own_profile',
  DELETE_OWN_PROFILE = 'delete:own_profile',
  READ_ANY_PROFILE = 'read:any_profile',
  UPDATE_ANY_PROFILE = 'update:any_profile',
  DELETE_ANY_PROFILE = 'delete:any_profile',

  // Photo Management
  UPLOAD_PHOTO = 'upload:photo',
  DELETE_OWN_PHOTO = 'delete:own_photo',
  DELETE_ANY_PHOTO = 'delete:any_photo',
  MODERATE_PHOTO = 'moderate:photo',

  // Matching & Interactions
  SWIPE = 'swipe',
  SEND_MESSAGE = 'send:message',
  READ_OWN_MESSAGES = 'read:own_messages',
  READ_ANY_MESSAGES = 'read:any_messages',

  // Moderation
  READ_REPORTS = 'read:reports',
  RESOLVE_REPORTS = 'resolve:reports',
  BAN_USER = 'ban:user',
  UNBAN_USER = 'unban:user',

  // Analytics & Audit
  READ_ANALYTICS = 'read:analytics',
  READ_AUDIT_LOGS = 'read:audit_logs',
  EXPORT_DATA = 'export:data',

  // System Administration
  MANAGE_ROLES = 'manage:roles',
  MANAGE_SETTINGS = 'manage:settings',
  MANAGE_CODES = 'manage:codes',
}

/**
 * Base permissions for each role
 */
const USER_PERMISSIONS: Permission[] = [
  Permission.READ_OWN_PROFILE,
  Permission.UPDATE_OWN_PROFILE,
  Permission.DELETE_OWN_PROFILE,
  Permission.UPLOAD_PHOTO,
  Permission.DELETE_OWN_PHOTO,
  Permission.SWIPE,
  Permission.SEND_MESSAGE,
  Permission.READ_OWN_MESSAGES,
];

const MODERATOR_PERMISSIONS: Permission[] = [
  ...USER_PERMISSIONS,
  Permission.READ_ANY_PROFILE,
  Permission.UPDATE_ANY_PROFILE,
  Permission.DELETE_ANY_PHOTO,
  Permission.MODERATE_PHOTO,
  Permission.READ_ANY_MESSAGES,
  Permission.READ_REPORTS,
  Permission.RESOLVE_REPORTS,
  Permission.BAN_USER,
  Permission.READ_ANALYTICS,
  Permission.READ_AUDIT_LOGS,
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...MODERATOR_PERMISSIONS,
  Permission.DELETE_ANY_PROFILE,
  Permission.UNBAN_USER,
  Permission.EXPORT_DATA,
  Permission.MANAGE_ROLES,
  Permission.MANAGE_SETTINGS,
  Permission.MANAGE_CODES,
];

const SERVICE_PERMISSIONS: Permission[] = Object.values(Permission);

/**
 * Role-Permission mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: USER_PERMISSIONS,
  [UserRole.MODERATOR]: MODERATOR_PERMISSIONS,
  [UserRole.ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.SERVICE]: SERVICE_PERMISSIONS,
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.every((p) => rolePermissions.includes(p));
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.some((p) => rolePermissions.includes(p));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
