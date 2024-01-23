import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "./auth/schemas/auth.schema";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // get the roles required
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [context.getHandler(), context.getClass()]);
    if (!roles) {
      return false;
    }
    const request = context.switchToHttp().getRequest();
    const userRoles = request.headers?.role?.split(',');

    // Allow unrestricted access for Role.Reader
    if (roles.includes(Role.Reader)) {
        return true;
    }
    return this.validateRoles(roles, userRoles);
  }

  validateRoles(roles: Role[], userRoles: string[]) {
    return roles.some(role => userRoles?.includes(role));
  }
}