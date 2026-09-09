import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Bind, Injectable, Dependencies } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@Dependencies(RedisService)
export class EventsGateway {
  @WebSocketServer()
  server;

  constructor(redisService) {
    this.redisService = redisService;
  }

  onModuleInit() {
    // Subscribe to Redis pub/sub for queue updates
    if (this.redisService) {
      this.redisService.subscribe('queue-updates', (payload) => {
        if (payload && payload.queueId) {
          const eventName = payload.eventType || 'queue_updated';
          this.server.to(`queue_${payload.queueId}`).emit(eventName, payload);
          // Keep backwards compatibility for old listeners
          if (eventName !== 'queue_updated') {
            this.server.to(`queue_${payload.queueId}`).emit('queue_updated', payload);
          }
          
          if (payload.businessId) {
            const bizEventName = payload.eventType ? `business_${payload.eventType}` : 'business_updated';
            this.server.to(`business_${payload.businessId}`).emit(bizEventName, payload);
            if (bizEventName !== 'business_updated') {
              this.server.to(`business_${payload.businessId}`).emit('business_updated', payload);
            }
          }
        }
      });
    }
  }

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

