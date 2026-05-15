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
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import { ChangeRoleDto } from './dto/ChangeRole.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LocalAuthGuard } from './local-auth.guard';
import { RolesGuard } from '../role.guard';
import { Roles } from '../roles';
import { Role } from './schemas/auth.schema';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @UseGuards(LocalAuthGuard)
  async login(@Request() req): Promise<any> {
    return this.authService.login(req.user);
  }

  @Post('register')
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  async register(@Body() body: RegisterDto): Promise<any> {
    const user = await this.authService.create(
      body.username,
      body.email,
      body.password,
      Role.Reader,
    );
    return { user };
  }

  @Post('/generateOtp')
  @Throttle({ short: { limit: 3, ttl: 60_000 } })
  generateOtp(@Body() body: CreateUserDto) {
    return this.authService.generateOtp(body);
  }

  @Patch('/verifyOtp')
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  verifyOtp(
    @Query() query: VerifyOtpDto,
    @Body() body: CreateUserDto,
  ): Promise<any> {
    return this.authService.verifyOtp(query, body);
  }

  @Post('/changePassword')
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  changePassword(@Body() body: ChangePasswordDto): Promise<any> {
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
