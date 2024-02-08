import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comments, CommentsDocument } from './schemas/comments.schema';
import { CreateCommentsDto } from './dto/create-comment.dto';
import { Blog, BlogDocument } from 'src/blogs/schemas/blogs.schema';

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
    const blog = await this.blogModel.findById(comment.blog);

    console.log('The is blog in backend : ', comment);

    // console.log('The is blog in backend : ', blog);
    // console.log('The is blog comments in backend : ', blog.comments);

    blog.comments.push(newComment._id);
    blog.save();
    return newComment;
  }
}
