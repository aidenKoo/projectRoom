import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  Permission,
  UserRole,
  hasAllPermissions,
  hasAnyPermission,
} from "../enums/permissions.enum";

export const PERMISSIONS_KEY = "permissions";
export const REQUIRE_ALL_KEY = "requireAll";

/**
 * Decorator to require specific permissions
 * @param permissions - Array of required permissions
 * @param requireAll - If true, user must have all permissions. If false, user needs at least one
 */
export const RequirePermissions = (
  permissions: Permission[],
  requireAll: boolean = true,
) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(PERMISSIONS_KEY, permissions)(target, propertyKey, descriptor);
    SetMetadata(REQUIRE_ALL_KEY, requireAll)(target, propertyKey, descriptor);
  };
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const requireAll = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ALL_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    const userRole: UserRole = user.role ?? UserRole.USER;

    const hasAccess = requireAll
      ? hasAllPermissions(userRole, requiredPermissions)
      : hasAnyPermission(userRole, requiredPermissions);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Required permissions: ${requiredPermissions.join(", ")}`,
      );
    }

    return true;
  }
}
