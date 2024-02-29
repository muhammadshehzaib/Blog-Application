import {
  Body,
  Controller,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth } from './schemas/auth.schema';
import { CreateUserDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: AuthService,
  ) {}

  @Post('login')
  async login(@Request() req): Promise<any> {
    // console.log('This is req', req);
    const user = req.user.id;
    const token = await this.authService.login(user);
    return { token, user };
  }

  @Post('register')
  async register(@Request() req): Promise<any> {
    const { username, email, password, role } = req.body;

    const user = await this.usersService.create(
      username,
      email,
      password,
      role,
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
    //    console.log('res.locals.otpData', res.locals.otpData)
    return this.authService.verifyOtp(query, body);
  }
}
