import { Auth } from '../../auth/schemas/auth.schema';
import { Reaction } from '../schemas/reaction.schema';
import { Blog } from '../../blogs/schemas/blogs.schema';

export class UpdateReactionDto {
  readonly reactions: Array<Reaction>;
  readonly userId: Array<Auth>;
  readonly createdAt: Date;
  readonly blogId: Blog;
}
