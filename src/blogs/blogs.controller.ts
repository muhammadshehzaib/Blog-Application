import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { Blog } from './schemas/blogs.schema';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blogs')
export class BlogsController {
    constructor(private blogsService:BlogsService){}
    @Get()
    async getAllBlogs():Promise<Blog[]>{
        return this.blogsService.findAll()
    }

    @Post()
    async createBlogs(
    @Body()
    blog:CreateBlogDto,
    ):Promise<Blog>{
        return this.blogsService.create(blog)
    }

    @Get(':id')
    async getBlogs(
        @Param('id')
        id:string
    ):Promise<Blog>{

        return this.blogsService.findById(id)
    }


    @Put(':id')
    async updateBlogs(
        @Param('id')
        id:string,
        @Body()
    contact:UpdateBlogDto,
    ):Promise<Blog>{
        return this.blogsService.updateById(id,contact)
    }
    @Delete(':id')
    async deleteBlogs(
        @Param('id')
        id:string
    ):Promise<Blog>{

        return this.blogsService.deleteById(id)
    }

}
