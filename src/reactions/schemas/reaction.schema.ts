import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  HydratedDocument,
  Mongoose,
  Schema as MongooseSchema,
} from 'mongoose';
import { Auth } from '../../auth/schemas/auth.schema';
import { Blog } from '../../blogs/schemas/blogs.schema';

export enum Reactions {
  happy = 'happy',
  sad = 'sad',
  Angry = 'angry',
  Love = 'love',
  Surprised = 'surprised',
  Boring = 'boring',
  Excited = 'excited',
  Laugh = 'laugh',
  Shocked = 'shocked',
}

export type ReactionDocuments = HydratedDocument<Reaction>;

@Schema()
export class Reaction {
  @Prop([{ type: String, enum: Object.values(Reactions) }])
  reactions: Reactions[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Auth' }) //User
  userId: Auth;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Blog' }) //Blog
  blogId: Blog;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export type ReactionDocument = Reaction & Document;

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
