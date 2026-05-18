import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ReactionsGateway {
  @WebSocketServer()
  server: Server;

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
