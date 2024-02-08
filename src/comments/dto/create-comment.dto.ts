import { Auth } from 'src/auth/schemas/auth.schema';
import { Blog } from 'src/blogs/schemas/blogs.schema';

export class CreateCommentsDto {
  readonly comment: string;
  readonly blog: Array<Blog>;
  readonly userId: Array<Auth>;
}
