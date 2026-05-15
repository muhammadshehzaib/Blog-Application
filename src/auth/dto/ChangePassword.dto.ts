import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  readonly resetToken: string;

  @IsString()
  @MinLength(8)
  readonly newPassword: string;
}
