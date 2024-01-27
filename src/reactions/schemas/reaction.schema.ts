import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  HydratedDocument,
  Mongoose,
  Schema as MongooseSchema,
} from 'mongoose';
import { Auth } from 'src/auth/schemas/auth.schema';
import { Blog } from 'src/blogs/schemas/blogs.schema';

export enum Reactions {
  Happy = 'happy',
  Sad = 'sad',
  // Angry = '😡',
  // Love = '❤️',
  // Surprised = '😲',
  // Boring = '😐',
  // Excited = '😃',
  // Laugh = '😆',
  // Shocked = '😱',
}

export type ReactionDocuments = HydratedDocument<Reaction>;

@Schema()
export class Reaction {
  @Prop({ type: String })
  reactions: Reactions;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Auth' }) //User
  userId: Auth;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Blog' }) //User
  blogId: Blog;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export type ReactionDocument = Reaction & Document;

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
