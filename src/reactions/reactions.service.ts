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
  async create(reactions: CreateReactionDto): Promise<any> {
    const reaction_avaliable = await this.reactionsModel.findOne(reactions);

    console.log('this is reaction avalaiable : ', reaction_avaliable);

    if (reaction_avaliable === null) {
      const create_reaction = await this.reactionsModel.create(reactions);
      console.log('this is create reaction : ', create_reaction);

      const blog = await this.blogModel.findById(create_reaction.blogId);
      console.log('This is blog in if statement', blog);
      blog.reactions.push(create_reaction._id);
      console.log('This is blog reactions : ', blog.reactions);

      blog.save();
      console.log('reaction created successfully');
      return create_reaction;
    }

    if (
      reaction_avaliable.reactions.toString() === reactions.reactions.toString()
    ) {
      console.log('this is 2nd if');
      console.log(
        'reaction_avaliable[0]._id',
        reaction_avaliable.reactions.toString(),
      );
      console.log(
        'reactions.reactions.toString() : ' + reactions.reactions.toString(),
      );

      const deleteReaction = await this.reactionsModel.findByIdAndDelete(
        reaction_avaliable._id,
      );
      console.log('deleteReaction : ' + deleteReaction);

      const blog = await this.blogModel.findById(reactions.blogId);

      console.log('This is blog : in the 2nd if ' + blog);
      console.log('blog.reaction : ' + blog.reactions);

      blog.reactions = blog.reactions.filter(
        (id) => id !== deleteReaction._id.toString(),
      );
      console.log('blog.reaction after filter method: ' + blog.reactions);

      // console.log('This is deleted Reaction' + deleteReaction);

      // console.log(
      //   'deleteReaction._id.toString()' + deleteReaction._id.toString(),
      // );

      // console.log('blog.reactions : ', blog.reactions);

      await blog.save();
      console.log('reaction deleted successfully');
      return deleteReaction;
    }

    // console.log('This is reaction avalaiable : ', reaction_avaliable);
    const updateReaction = await this.reactionsModel.findByIdAndUpdate(
      reaction_avaliable._id,
      reactions,
    );

    console.log('updateReaction : ' + updateReaction);

    // console.log('This is update reaction : ' + updateReaction);

    return updateReaction;
    // const updateReaction = await this.reactionsModel.
  }
}
