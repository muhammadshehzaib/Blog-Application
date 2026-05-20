import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Model } from 'mongoose';
import { Counter } from 'prom-client';
import { Blog, BlogDocument } from '../blogs/schemas/blogs.schema';
import { CacheService } from '../cache/cache.service';
import { COMMENTS_CREATED } from '../metrics/metrics.module';
import { CommentsGateway } from './comments.gateway';
import { CreateCommentsDto } from './dto/create-comment.dto';
import { UpdateCommentsDto } from './dto/update-comment.dto';
import { Comments, CommentsDocument } from './schemas/comments.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comments.name)
    private commentModel: Model<CommentsDocument>,
    @InjectModel(Blog.name)
    private blogModel: Model<BlogDocument>,
    private commentsGateway: CommentsGateway,
    private cache: CacheService,
    @InjectMetric(COMMENTS_CREATED)
    private commentsCreated: Counter<string>,
  ) {}
  async create(
    comment: CreateCommentsDto & { userId: string },
  ): Promise<CommentsDocument> {
    const newComment = await this.commentModel.create(comment);
    await this.blogModel.updateOne(
      { _id: comment.blog },
      { $push: { comments: newComment._id } },
    );
    await this.cache.del(`blog:${comment.blog}`, 'blogs:list:all');
    this.commentsGateway.broadcastNewComment(
      String(comment.blog),
      newComment,
    );
    this.commentsCreated.inc();
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
