import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Mongoose, Schema as MongooseSchema } from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { Blog } from 'src/blogs/schemas/blogs.schema';

export type UserDocument = HydratedDocument<Auth>;

export enum Role {
  Admin = 'Admin',
  Reader = 'Reader',
  Writer = 'Writer',
}

@Schema()
export class Auth {
  @Prop({
    required: true,
    message: 'Username is required and it should be unique',
    unique: true,
  })
  username: string;

  @Prop({ required: false, message: 'Email is required' })
  email: string;

  @Prop({ required: true, message: 'Password is required' })
  password: string;

  @Prop({ required: false })
  role: Role;

  // @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Blog' })
  // blogId: [Blog];
}

export const AuthSchema = SchemaFactory.createForClass(Auth);
