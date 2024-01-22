import { Controller, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBadRequestResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Auth } from './schemas/auth.schema';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService,
  private usersService:AuthService) {}

  @Post('login')
  @ApiCreatedResponse({
    description:"Created Access token as response",
    type:Auth
 })
 @ApiBadRequestResponse({       
    description:"Access token Cannot Created"
})
  async login(@Request() req): Promise<any> {
    const user = req.user;
    const token = await this.authService.login(user);
    return { token };
  }

  @Post('register')
  @ApiCreatedResponse({
    description:"Created User Object as response",
    type:Auth
 })
 @ApiBadRequestResponse({       
    description:"User object Cannot Created"
})
  async register(@Request() req): Promise<any> {
    const { username,email, password } = req.body;
    const user = await this.usersService.create(username,email, password);
    return { user };
  }

}
