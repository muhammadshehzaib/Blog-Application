import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReactionDto } from './dto/create-reactions.dto';
import { Reaction, ReactionDocument } from './schemas/reaction.schema';
import { Blog, BlogDocument } from '../blogs/schemas/blogs.schema';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectModel(Reaction.name)
    private reactionsModel: Model<ReactionDocument>,
    @InjectModel(Blog.name)
    private blogModel: Model<BlogDocument>,
  ) {}
  async create(reactions: CreateReactionDto, id: string): Promise<any> {
    const reaction_avaliable = await this.reactionsModel.findOne(
      reactions.userId,
    );

    if (reaction_avaliable === null) {
      const create_reaction = await this.reactionsModel.create(reactions);

      const blog = await this.blogModel.findById(create_reaction.blogId);
      blog?.reactions.push(create_reaction._id);

      blog?.save();

      return create_reaction;
    }
    if (
      reaction_avaliable?.reactions?.toString() ===
      reactions?.reactions?.toString()
    ) {
      const deleteReaction = await this.reactionsModel.findByIdAndDelete(
        reaction_avaliable?._id,
      );

      const blog = await this.blogModel.findById(reaction_avaliable.blogId);

      blog.reactions = blog.reactions.filter((id) => {
        return id.toString() !== deleteReaction._id?.toString();
      });
      await blog.save();
      return deleteReaction;
    }

    const updateReaction = await this.reactionsModel.findOneAndUpdate(
      { _id: reaction_avaliable._id },
      { reactions: reactions.reactions }, // Specify the field to update
      { new: true },
    );
    return updateReaction;
  }
}
