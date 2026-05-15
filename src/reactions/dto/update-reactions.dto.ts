import { IsArray, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { Reactions } from '../schemas/reaction.schema';

export class UpdateReactionDto {
  @IsOptional()
  @IsArray()
  @IsEnum(Reactions, { each: true })
  readonly reactions?: Reactions[];

  @IsOptional()
  @IsMongoId()
  readonly blogId?: string;
}
