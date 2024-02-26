import { Auth } from '../../auth/schemas/auth.schema';
import { Blog } from '../../blogs/schemas/blogs.schema';

export class UpdateCommentsDto {
  readonly comment: string;
  readonly blog: Array<Blog>;
  readonly userId: Array<Auth>;
}
