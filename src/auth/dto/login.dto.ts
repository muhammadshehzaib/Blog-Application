import { IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsString()
  @MinLength(3)
  readonly username: string;

  @IsString()
  @MinLength(8)
  readonly password: string;
}
