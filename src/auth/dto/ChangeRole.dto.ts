import { IsEnum } from 'class-validator';
import { Role } from '../schemas/auth.schema';

export class ChangeRoleDto {
  @IsEnum(Role)
  readonly role: Role;
}
