import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  readonly title: string;

  @IsString()
  @MinLength(1)
  readonly content: string;

  @IsMongoId()
  readonly category: string;
}
