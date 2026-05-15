import { IsArray, IsEnum, IsMongoId } from 'class-validator';
import { Reactions } from '../schemas/reaction.schema';

export class CreateReactionDto {
  @IsArray()
  @IsEnum(Reactions, {
    each: true,
    message: 'Please enter correct reaction',
  })
  readonly reactions: Reactions[];

  @IsMongoId()
  readonly blogId: string;
}
