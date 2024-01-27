import { Auth } from 'src/auth/schemas/auth.schema';
import { Reaction, Reactions } from '../schemas/reaction.schema';
import { Blog } from 'src/blogs/schemas/blogs.schema';

export class UpdateReactionDto {
  readonly reactions: Reactions;
  readonly userId: Array<Auth>;
  readonly createdAt: Date;
  readonly blogId: Blog;
}
