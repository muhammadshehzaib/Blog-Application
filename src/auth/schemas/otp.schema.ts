import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema({
  timestamps: true,
})
export class Otp extends Document {
  @Prop()
  email: string;
  @Prop()
  code: string;
  @Prop({ default: () => new Date(Date.now() + 5 * 60 * 1000) })
  expiresAt: Date;
}
export const OtpSchema = SchemaFactory.createForClass(Otp);
