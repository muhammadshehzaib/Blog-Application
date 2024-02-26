import { Auth } from '../../auth/schemas/auth.schema';
import { BlogsCategories } from '../../category/schemas/category.schema';
import { Status } from '../schemas/blogs.schema';
import { Comments } from '../../comments/schemas/comments.schema';
import { Reaction, Reactions } from '../../reactions/schemas/reaction.schema';

export class CreateBlogDto {
  readonly title: string;
  readonly content: string;
  readonly createdAt: Date;
  readonly image: string;
  readonly category: BlogsCategories;

  readonly status: Status;
  readonly userId: Auth;
  readonly comments: Array<Comments>;
  readonly reactions: Array<Reactions>;
}
