import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateReactionDto } from './dto/create-reactions.dto';
import { ReactionsGateway } from './reactions.gateway';
import { Reaction, ReactionDocument } from './schemas/reaction.schema';
import { Blog, BlogDocument } from '../blogs/schemas/blogs.schema';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectModel(Reaction.name)
    private reactionsModel: Model<ReactionDocument>,
    @InjectModel(Blog.name)
    private blogModel: Model<BlogDocument>,
    private reactionsGateway: ReactionsGateway,
  ) {}

  private async getCountsForBlog(
    blogId: string,
  ): Promise<Record<string, number>> {
    const rows = await this.reactionsModel.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { blogId: new Types.ObjectId(blogId) } },
      { $unwind: '$reactions' },
      { $group: { _id: '$reactions', count: { $sum: 1 } } },
    ]);
    return rows.reduce(
      (acc, r) => ({ ...acc, [r._id]: r.count }),
      {} as Record<string, number>,
    );
  }

  private async broadcastCounts(blogId: string): Promise<void> {
    const counts = await this.getCountsForBlog(blogId);
    this.reactionsGateway.broadcastReactionUpdate(blogId, counts);
  }

  async create(reactions: CreateReactionDto, id: string): Promise<any> {
    const reaction_avaliable = await this.reactionsModel.findOne({
      userId: id,
      blogId: reactions.blogId,
    });

    if (reaction_avaliable === null) {
      const create_reaction = await this.reactionsModel.create({
        ...reactions,
        userId: id,
      });

      await this.blogModel.updateOne(
        { _id: create_reaction.blogId },
        { $push: { reactions: create_reaction._id } },
      );

      await this.broadcastCounts(reactions.blogId);
      return create_reaction;
    }
    if (
      reaction_avaliable?.reactions?.toString() ===
      reactions?.reactions?.toString()
    ) {
      const deleteReaction = await this.reactionsModel.findByIdAndDelete(
        reaction_avaliable?._id,
      );

      await this.blogModel.updateOne(
        { _id: reaction_avaliable.blogId },
        { $pull: { reactions: deleteReaction._id } },
      );

      await this.broadcastCounts(reactions.blogId);
      return deleteReaction;
    }

    const updateReaction = await this.reactionsModel.findOneAndUpdate(
      { _id: reaction_avaliable._id },
      { reactions: reactions.reactions },
      { new: true },
    );
    await this.broadcastCounts(reactions.blogId);
    return updateReaction;
  }
}
