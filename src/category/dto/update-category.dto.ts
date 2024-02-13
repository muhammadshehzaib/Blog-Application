import { BlogsCategories } from '../schemas/category.schema';

export class UpdateCategoryDto {
  readonly category: BlogsCategories;
  readonly createdAt: Date;
}
