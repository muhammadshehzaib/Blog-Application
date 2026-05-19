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
export class CommentsGateway implements OnGatewayConnection {
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

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() postId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`post:${postId}`).emit('userTyping', {
      userId: client.data.userId,
      name: client.data.name,
    });
  }

  broadcastNewComment(postId: string, comment: any) {
    this.server.to(`post:${postId}`).emit('commentCreated', comment);
  }
}
