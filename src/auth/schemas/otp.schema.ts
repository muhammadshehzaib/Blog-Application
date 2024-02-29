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
  @Prop({ default: Date.now() + 5 * 60 * 1000 }) // Expire after 5 minutes
  expiresAt: Date;
}
export const OtpSchema = SchemaFactory.createForClass(Otp);
