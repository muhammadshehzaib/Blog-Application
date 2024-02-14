import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { Roles } from 'src/roles';
import { Role } from 'src/auth/schemas/auth.schema';
import { RolesGuard } from 'src/role.guard';
import { UpdateReactionDto } from './dto/update-reactions.dto';
import { Reaction, ReactionDocument } from './schemas/reaction.schema';
import { CreateReactionDto } from './dto/create-reactions.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('reactions')
export class ReactionsController {
  constructor(private reactionsService: ReactionsService) {}
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Writer)
  async createReaction(
    @Req() req: any,
    @Body()
    reactions: CreateReactionDto,
  ): Promise<any> {
    const userId = req.user.id;
    const blogId = req.body.blogId;

    const reaction = await this.reactionsService.create(
      {
        ...reactions,
        blogId,
      },
      userId,
    );

    // console.log(reaction);

    return reaction;
  }
}
