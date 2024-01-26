import { Auth } from 'src/auth/schemas/auth.schema';
import { Blog } from 'src/blogs/schemas/blogs.schema';

export class UpdateCommentsDto {
  readonly comment: string;
  readonly blogId: Array<Blog>;
  readonly userId: Array<Auth>;
}