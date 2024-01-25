import { Auth } from 'src/auth/schemas/auth.schema';
import { BlogsCategories } from '../../category/schemas/category.schema';
import { Status } from '../schemas/blogs.schema';

export class CreateBlogDto {
  readonly title: string;
  readonly content: string;
  readonly createdAt: Date;
  readonly category: BlogsCategories;
  readonly status: Status;
  readonly userId: Auth;
}
