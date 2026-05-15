import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  readonly title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  readonly content?: string;

  @IsOptional()
  @IsMongoId()
  readonly category?: string;
}
