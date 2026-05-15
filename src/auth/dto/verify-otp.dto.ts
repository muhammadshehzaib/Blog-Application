import { Matches } from 'class-validator';

export class VerifyOtpDto {
  @Matches(/^\d{6}$/, { message: 'Otp must be a 6-digit code' })
  readonly code: string;
}
