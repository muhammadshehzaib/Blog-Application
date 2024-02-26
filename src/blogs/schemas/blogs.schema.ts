import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BlogsCategories } from '../../category/schemas/category.schema';
import { Auth } from '../../auth/schemas/auth.schema';
import { Comments } from '../../comments/schemas/comments.schema';
import { Reaction, Reactions } from '../../reactions/schemas/reaction.schema';

// export type BlogDocument = HydratedDocument<Blog>;
export type BlogDocument = Blog & Document;
export enum Status {
  Approved = 'Approved',
  Disapproved = 'Disapproved',
  Pending = 'Pending',
}

@Schema()
export class Blog {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ required: true })
  image: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'BlogsCategories',
  })
  category: BlogsCategories;

  @Prop({ type: String, enum: Object.values(Status), default: Status.Pending })
  status: Status;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Auth' })
  userId: Auth;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Comments' }])
  comments: [Comments];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Reaction' }])
  reactions: Reaction[];
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
