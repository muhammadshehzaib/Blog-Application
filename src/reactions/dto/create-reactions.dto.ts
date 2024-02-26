import { Auth } from '../../auth/schemas/auth.schema';
import { Reaction } from '../schemas/reaction.schema';
import { Blog } from '../../blogs/schemas/blogs.schema';
import { IsEnum } from 'class-validator';

export class CreateReactionDto {
  @IsEnum(Reaction, { message: 'Please enter correct reaction' })
  readonly reactions: Array<string>;
  readonly userId: Array<Auth>;
  readonly createdAt: Date;
  readonly blogId: Blog;
}
