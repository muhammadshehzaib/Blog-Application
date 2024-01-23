import { Body, Controller, Delete, Get, Param, Post, Put,UseGuards  } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { BlogsService } from './blogs.service';
import { Blog, Status } from './schemas/blogs.schema';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Roles } from 'src/roles';
import { RolesGuard } from 'src/role.guard';
import { Role } from 'src/auth/schemas/auth.schema';

@Controller('blogs')

export class BlogsController {
    constructor(private blogsService:BlogsService){}
    @Get()
    @Roles(Role.Reader)
    @UseGuards(RolesGuard)
    async getAllBlogs():Promise<Blog[]>{
        return this.blogsService.findAll()
    }

    @Post()
    @Roles(Role.Writer)
    @UseGuards(RolesGuard, AuthGuard)
    async createBlogs(
    @Body()
    blog:CreateBlogDto,
    ):Promise<Blog>{
        return this.blogsService.create(blog)
    }
    @Get(':id') 
    @Roles(Role.Reader)
    async getBlogs(
        @Param('id')
        id:string
    ):Promise<Blog>{

        return this.blogsService.findById(id)
    }

    @Put(':id')
    @Roles(Role.Writer)
    @UseGuards(RolesGuard,AuthGuard)
    async updateBlogs(
        @Param('id')
        id:string,
        @Body()
    blog:UpdateBlogDto,
    ):Promise<Blog>{
        return this.blogsService.updateById(id,blog)
    }

    @Post('approved/:id')
    @Roles(Role.Admin)
    @UseGuards(RolesGuard,AuthGuard)
    async approvedBlog(
        @Param('id')
        id:string,
        status:Status
    ):Promise<Blog>{
        return this.blogsService.findIdAndApproved(id,status)
    }

    @Post('disapproved/:id')
    @Roles(Role.Admin)
    @UseGuards(RolesGuard,AuthGuard)
    async disApprovedBlog(
        @Param('id')
        id:string,
        status:Status
    ):Promise<Blog>{
        return this.blogsService.findIdAndDisapproved(id,status)
    }
    
    @Delete(':id')
    @Roles(Role.Writer)
    @UseGuards(RolesGuard,AuthGuard)
    async deleteBlogs(
        @Param('id')
        id:string
    ):Promise<Blog>{

        return this.blogsService.deleteById(id)
    }

}
