import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BlogsCategories {
  @Prop({
    required: true,
  })
  category: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export type CategoryDocument = BlogsCategories & Document;

export const CategorySchema = SchemaFactory.createForClass(BlogsCategories);
