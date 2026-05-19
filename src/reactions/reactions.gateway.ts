import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthService } from '../auth/ws-auth.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ReactionsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private wsAuth: WsAuthService) {}

  async handleConnection(client: Socket) {
    const user = await this.wsAuth.verifyClient(client);
    if (!user) {
      client.disconnect();
      return;
    }
    client.data.userId = user.userId;
    client.data.name = user.name;
  }

  @SubscribeMessage('joinPost')
  handleJoinPost(
    @MessageBody() postId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`post:${postId}`);
    return { joined: postId };
  }

  broadcastReactionUpdate(postId: string, counts: Record<string, number>) {
    this.server.to(`post:${postId}`).emit('reactionUpdated', {
      blogId: postId,
      counts,
    });
  }
}
