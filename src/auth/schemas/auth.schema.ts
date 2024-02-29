import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Date, HydratedDocument } from 'mongoose';

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

  @Prop({ required: false, default: 'Writer' })
  role: Role;

  @Prop({
    type: Date,
    default: Date.now,
    expires: 3600,
  })
  createdAt: Date;

  @Prop({ required: true })
  token: string;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);
