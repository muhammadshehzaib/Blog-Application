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
export class CommentsGateway {
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

  broadcastNewComment(postId: string, comment: any) {
    this.server.to(`post:${postId}`).emit('commentCreated', comment);
  }
}
