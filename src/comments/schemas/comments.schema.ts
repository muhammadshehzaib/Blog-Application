import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Auth } from '../../auth/schemas/auth.schema';
import { Blog } from '../../blogs/schemas/blogs.schema';

export type CommentsDocument = Comments & Document;

@Schema()
export class Comments {
  @Prop({ required: true })
  comment: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Blog' })
  blogId: [Blog];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Auth' })
  userId: [Auth];
}

export const CommentsSchema = SchemaFactory.createForClass(Comments);
