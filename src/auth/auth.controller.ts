import { Controller, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth } from './schemas/auth.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: AuthService,
  ) {}

  @Post('login')
  async login(@Request() req): Promise<any> {
    console.log('This is req', req);
    const user = req.user;
    console.log('This is user', user);

    const token = await this.authService.login(user);

    console.log('This is token', token);

    return { token };
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
}
