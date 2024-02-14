import { BlogsCategories } from '../schemas/category.schema';

export class CreateCategoryDto {
  readonly category: BlogsCategories;
  readonly createdAt: Date;
}
