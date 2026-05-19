import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { AuthService } from './auth.service';

export interface SocketUser {
  userId: string;
  name: string;
}

@Injectable()
export class WsAuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async verifyClient(client: Socket): Promise<SocketUser | null> {
    try {
      const headerToken = (client.handshake.headers.authorization ?? '').replace(
        /^bearer\s+/i,
        '',
      );
      const token = client.handshake.auth?.token || headerToken;
      if (!token) return null;

      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      const user = await this.authService.findById(payload.sub);
      if (!user) return null;
      if ((user.tokenVersion ?? 0) !== (payload.tokenVersion ?? 0)) return null;

      return {
        userId: String((user as any)._id),
        name: user.username ?? user.email ?? 'anonymous',
      };
    } catch {
      return null;
    }
  }
}
