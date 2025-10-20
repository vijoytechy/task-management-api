import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const { user } = req;
    if (!user) {
      this.logger.warn(`Access denied: missing user (required roles: ${requiredRoles.join(', ')})`);
      return false;
    }

    const userRole = typeof user.role === 'string' ? user.role : user.role?.name;
    const allowed = requiredRoles.includes(userRole);
    if (!allowed) {
      this.logger.warn(
        `Access denied for ${user.email || user.userId}: role ${userRole} not in [${requiredRoles.join(', ')}]`,
      );
    }
    return allowed;
  }
}
