import { Role } from '../schemas/auth.schema';

export class CreateUserDto {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly blogId: Array<string>;
  readonly role: Role;
  readonly token: string;
}
