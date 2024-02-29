import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
// import { AuthGuard } from '../auth/auth.guard';
import { CategoryService } from './category.service';
import { BlogsCategories } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../roles';
import { RolesGuard } from '../role.guard';
import { Role } from '../auth/schemas/auth.schema';
import { AuthGuard } from '@nestjs/passport';

@Controller('blogscategories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}
  @Get()
  async getAllCategories(): Promise<BlogsCategories[]> {
    return this.categoryService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  // @Roles(Role.Admin)
  async createBlogs(
    @Body()
    category: CreateCategoryDto,
  ): Promise<BlogsCategories> {
    return this.categoryService.create(category);
  }

  @Get(':id')
  async getBlogs(
    @Param('id')
    id: string,
  ): Promise<BlogsCategories> {
    return this.categoryService.findById(id);
  }

  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async updateBlogs(
    @Param('id')
    id: string,
    @Body()
    category: UpdateCategoryDto,
  ): Promise<BlogsCategories> {
    return this.categoryService.updateById(id, category.category);
  }
  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async deleteBlogs(
    @Param('id')
    id: string,
  ): Promise<BlogsCategories> {
    return this.categoryService.deleteById(id);
  }
}
