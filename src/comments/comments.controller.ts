import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/role.guard';
import { Roles } from 'src/roles';
import { Role } from 'src/auth/schemas/auth.schema';
import { CreateCommentsDto } from './dto/create-comment.dto';
import { Comments, CommentsDocument } from './schemas/comments.schema';
import { BlogsService } from 'src/blogs/blogs.service';

@Controller('comments')
export class CommentsController {
  constructor(
    private commentsService: CommentsService,
    private blogsService: BlogsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Writer)
  async createComments(
    @Req() req: any,
    @Body()
    comments: CreateCommentsDto,
  ): Promise<CommentsDocument> {
    const userId = req.user.id;
    const blogId = req.body.blogId;
    return this.commentsService.create({ ...comments, userId: userId, blogId });
  }
}
