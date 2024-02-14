import { Auth } from 'src/auth/schemas/auth.schema';
import { BlogsCategories } from '../../category/schemas/category.schema';
import { Status } from '../schemas/blogs.schema';
import { Comments } from 'src/comments/schemas/comments.schema';
import { Reaction, Reactions } from 'src/reactions/schemas/reaction.schema';

export class UpdateBlogDto {
  readonly title: string;
  readonly content: string;
  readonly createdAt: Date;
  readonly category: BlogsCategories;
  readonly status: Status;
  readonly userId: Auth;
  readonly comments: Array<Comments>;
  readonly reactions: Array<Reactions>;

  // readonly comments: Comments;
}
