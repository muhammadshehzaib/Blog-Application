import { Module } from '@nestjs/common';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { ReactionSchema } from './schemas/reaction.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogSchema } from '../blogs/schemas/blogs.schema';
import { BlogsModule } from '../blogs/blogs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Reaction', schema: ReactionSchema }]),
    MongooseModule.forFeature([{ name: 'Blog', schema: BlogSchema }]),
    BlogsModule,
  ],
  controllers: [ReactionsController],
  providers: [ReactionsService],
})
export class ReactionsModule {}
