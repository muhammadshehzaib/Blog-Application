import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Otp extends Document {
  @Prop({ required: true, index: true, unique: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ default: () => new Date(Date.now() + 5 * 60 * 1000) })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
