import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comments, CommentsDocument } from './schemas/comments.schema';
import { CreateCommentsDto } from './dto/create-comment.dto';
import { Blog, BlogDocument } from 'src/blogs/schemas/blogs.schema';
import { UpdateBlogDto } from 'src/blogs/dto/update-blog.dto';
import { UpdateCommentsDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comments.name)
    private commentModel: Model<CommentsDocument>,
    @InjectModel(Blog.name)
    private blogModel: Model<BlogDocument>,
  ) {}
  async create(comment: CreateCommentsDto): Promise<CommentsDocument> {
    const newComment = await this.commentModel.create(comment);
    const blog = await this.blogModel.findById(comment.blogId);
    blog.comments.push(newComment._id);
    blog.save();
    return newComment;
  }
  async findAll(): Promise<CommentsDocument[]> {
    const comments = await this.commentModel.find();
    return comments;
  }
  async updateById(
    id: string,
    comments: UpdateCommentsDto,
    req,
  ): Promise<CommentsDocument> {
    const commentId = await this.commentModel.findById(id);
    const userId = commentId.userId.toString();
    if (userId === req) {
      return await this.commentModel.findByIdAndUpdate(id, comments);
    }
    throw new NotFoundException('UserId not found.');
  }
}
