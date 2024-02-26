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

    console.log('this is reaction avalaiable : ', reaction_avaliable);
    console.log('This is userId in id : ' + reactions);

    if (reaction_avaliable === null) {
      const create_reaction = await this.reactionsModel.create(reactions);
      console.log('this is create reaction : ', create_reaction);

      const blog = await this.blogModel.findById(create_reaction.blogId);
      console.log('This is blog in if statement', blog);
      blog?.reactions.push(create_reaction._id);

      blog?.save();

      console.log('reaction created successfully');
      return create_reaction;
    }
    if (
      reaction_avaliable.reactions.toString() === reactions.reactions.toString()
    ) {
      console.log('this is 2nd if');

      console.log(
        'reaction_avaliable.reactions.toString() : ',
        reaction_avaliable.reactions.toString(),
      );
      console.log(
        'reactions.reactions.toString() : ' + reactions.reactions.toString(),
      );

      console.log('reaction_avaliable._id : ' + reaction_avaliable._id);

      const deleteReaction = await this.reactionsModel.findByIdAndDelete(
        reaction_avaliable._id,
      );
      console.log('deleteReaction : ' + deleteReaction);

      console.log('reaction_avaliable: ' + reaction_avaliable);

      console.log('reaction_avaliable.blogId : ' + reaction_avaliable.blogId);

      const blog = await this.blogModel.findById(reaction_avaliable.blogId);

      console.log('This is blog : in the 2nd if ', blog);
      // console.log('blog.reaction : ' + blog.reactions);

      blog.reactions = blog.reactions.filter((id) => {
        console.log('This is id in filter : ', id, deleteReaction._id);

        return id.toString() !== deleteReaction._id.toString();
      });
      // console.log('blog.reaction after filter method: ' + blog.reactions);
      await blog.save();
      // console.log('reaction deleted successfully');
      return deleteReaction;
    }

    console.log('entering in the update statement');
    console.log(
      'reaction_avaliable.reactions : ' + reaction_avaliable.reactions,
    );
    const updateReaction = await this.reactionsModel.findOneAndUpdate(
      { _id: reaction_avaliable._id },
      { reactions: reactions.reactions }, // Specify the field to update
      { new: true },
    );
    console.log('Please reactions.reactions : ', reactions.reactions);
    console.log(
      'reaction_avaliable.reactions : ' + reaction_avaliable.reactions,
    );

    console.log('updateReaction : ' + updateReaction);

    return updateReaction;
  }
}
