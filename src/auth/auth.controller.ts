import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import { ChangeRoleDto } from './dto/ChangeRole.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from '../role.guard';
import { Roles } from '../roles';
import { Role } from './schemas/auth.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: AuthService,
  ) {}

  @Post('login')
  async login(@Request() req): Promise<any> {
    const user = req.user.id;
    const token = await this.authService.login(user);
    return { token, user };
  }

  @Post('register')
  async register(@Request() req): Promise<any> {
    const { username, email, password } = req.body;

    const user = await this.usersService.create(
      username,
      email,
      password,
      Role.Reader,
    );
    return { user };
  }
  @Post('/generateOtp')
  generateOtp(
    @Body()
    body: CreateUserDto,
  ) {
    return this.authService.generateOtp(body);
  }
  @Patch('/verifyOtp')
  verifyOtp(
    @Query() query,
    @Body()
    body: CreateUserDto,
  ): Promise<any> {
    return this.authService.verifyOtp(query, body);
  }
  @Post('/changePassword')
  changePassword(
    @Body()
    body: ChangePasswordDto,
  ): Promise<any> {
    return this.authService.changePassword(body);
  }

  @Patch('/users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  changeRole(
    @Request() req,
    @Param('id') id: string,
    @Body() body: ChangeRoleDto,
  ): Promise<any> {
    if (!Object.values(Role).includes(body.role)) {
      throw new BadRequestException('Invalid role');
    }
    return this.authService.changeRole(req.user, id, body.role);
  }
}
