import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Bind } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server;

  @SubscribeMessage('join-queue-room')
  @Bind(MessageBody(), ConnectedSocket())
  handleJoinRoom(data, client) {
    if (data && data.queueId) {
      client.join(`queue_${data.queueId}`);
      console.log(`Client joined room queue_${data.queueId}`);
    }
  }

  @SubscribeMessage('leave-queue-room')
  @Bind(MessageBody(), ConnectedSocket())
  handleLeaveRoom(data, client) {
    if (data && data.queueId) {
      client.leave(`queue_${data.queueId}`);
    }
  }

  @SubscribeMessage('join-business-room')
  @Bind(MessageBody(), ConnectedSocket())
  handleJoinBranchRoom(data, client) {
    if (data && data.businessId) {
      client.join(`business_${data.businessId}`);
      console.log(`Client joined room business_${data.businessId}`);
    }
  }

  @SubscribeMessage('leave-business-room')
  @Bind(MessageBody(), ConnectedSocket())
  handleLeaveBranchRoom(data, client) {
    if (data && data.businessId) {
      client.leave(`business_${data.businessId}`);
    }
  }

  broadcastQueueUpdate(queueId, businessId) {
    const payload = { queueId, businessId, timestamp: new Date() };
    this.server.to(`queue_${queueId}`).emit('queue_updated', payload);
    if (businessId) {
      this.server.to(`business_${businessId}`).emit('business_updated', payload);
    }
  }
}

