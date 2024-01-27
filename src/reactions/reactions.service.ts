import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReactionDto } from './dto/create-reactions.dto';
import { Reaction, ReactionDocument } from './schemas/reaction.schema';
import { Blog, BlogDocument } from 'src/blogs/schemas/blogs.schema';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectModel(Reaction.name)
    private reactionsModel: Model<ReactionDocument>,
    @InjectModel(Blog.name)
    private blogModel: Model<BlogDocument>,
  ) {}
  async create(reactions: CreateReactionDto): Promise<ReactionDocument> {
    const create_reaction = await this.reactionsModel.create(reactions);
    const reaction = await this.blogModel.findById(create_reaction.blogId);

    if (reaction.userId.toString() === create_reaction.userId.toString()) {
      reaction.reactions.push(create_reaction._id);
      reaction.save();

      return create_reaction;
    }

    throw new NotFoundException();
  }
}
