    import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BlogsCategories } from '../../category/schemas/category.schema';


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

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BlogsCategories',required:true })
    category: BlogsCategories;  


    @Prop({ type: String, enum: Object.values(Status), default: Status.Pending })
    status: Status;
    //   @Prop({ 
    //     type: ObjectId, ref: 'User',
    //    required: true })
    //   author: ObjectId;


    }

    export const BlogSchema = SchemaFactory.createForClass(Blog);