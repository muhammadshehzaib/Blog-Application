import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  readonly username?: string;

  @IsEmail()
  readonly email: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  readonly password?: string;
}
