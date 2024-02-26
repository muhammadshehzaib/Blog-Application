import { SetMetadata } from '@nestjs/common';
import { Role } from './auth/schemas/auth.schema';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
