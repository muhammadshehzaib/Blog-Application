import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../auth/schemas/auth.schema';
import { RolesGuard } from '../role.guard';
import { Roles } from '../roles';
import { CreateReactionDto } from './dto/create-reactions.dto';
import { ReactionsService } from './reactions.service';

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
    // console.log('Controller reactions : ' + reactions.reactions);

    const reaction = await this.reactionsService.create(
      {
        ...reactions,
        blogId,
      },
      userId,
    );

    return reaction;
  }
}
