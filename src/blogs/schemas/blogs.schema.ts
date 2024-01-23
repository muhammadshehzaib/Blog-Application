    import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
    import { ApiProperty } from '@nestjs/swagger';
    import { ObjectId } from 'mongodb';
    import { HydratedDocument } from 'mongoose';
    import { Document, Mongoose, Schema as MongooseSchema } from 'mongoose';
    import { BlogsCategories } from '../../category/schemas/category.schema';


    export type BlogDocument = HydratedDocument<Blog>;

    @Schema()
    export class Blog {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BlogsCategories',required:true })
    category: BlogsCategories;  

    //   @Prop({ 
    //     type: ObjectId, ref: 'User',
    //    required: true })
    //   author: ObjectId;


    }

    export const BlogSchema = SchemaFactory.createForClass(Blog);