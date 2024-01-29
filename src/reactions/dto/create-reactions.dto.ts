import { Auth } from 'src/auth/schemas/auth.schema';
import { Reactions } from '../schemas/reaction.schema';
import { Blog } from 'src/blogs/schemas/blogs.schema';
import { IsEnum } from 'class-validator';

export class CreateReactionDto {
  @IsEnum(Reactions, { message: 'Please enter correct reaction' })
  readonly reactions: Reactions;
  readonly userId: Array<Auth>;
  readonly createdAt: Date;
  readonly blogId: Blog;
}
