import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/role.guard';
import { Roles } from 'src/roles';
import { Role } from 'src/auth/schemas/auth.schema';
import { CreateCommentsDto } from './dto/create-comment.dto';
import { Comments, CommentsDocument } from './schemas/comments.schema';
import { BlogsService } from 'src/blogs/blogs.service';
import { UpdateCommentsDto } from './dto/update-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Writer)
  async createComments(
    @Req() req: any,
    @Body()
    comments: CreateCommentsDto,
  ): Promise<CommentsDocument> {
    const userId = req.user.id;
    const blog = req.body.blog;
    console.log(blog);

    return this.commentsService.create({ ...comments, userId: userId, blog });
  }
  @Get()
  async getAllomments(): Promise<CommentsDocument[]> {
    return this.commentsService.findAll();
  }
  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Writer)
  async updateComments(
    @Param('id')
    id: string,
    @Req()
    req: any,
    @Body()
    comments: UpdateCommentsDto,
  ): Promise<CommentsDocument> {
    const userId = req.user.id.toString();

    return this.commentsService.updateById(id, comments, userId);
  }
}
