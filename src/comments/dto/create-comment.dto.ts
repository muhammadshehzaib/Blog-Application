import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  readonly comment: string;

  @IsMongoId()
  readonly blog: string;
}
