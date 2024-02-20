import { BlogsCategories } from '../schemas/category.schema';

export class CreateCategoryDto {
  readonly category: string;
  readonly createdAt: Date;
}
