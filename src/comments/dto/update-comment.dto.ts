import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  readonly comment?: string;
}
