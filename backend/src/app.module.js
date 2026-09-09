import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';
import { ServicesModule } from './services/services.module';
import { CountersModule } from './counters/counters.module';
import { RedisModule } from './redis/redis.module';
import { RateLimiterMiddleware } from './middleware/rate-limiter.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { QueuesModule } from './queues/queues.module';
import { QueueEntriesModule } from './queue-entries/queue-entries.module';

import { UtilsController } from './routes/utils.routes';
import { MetricsController } from './routes/metrics.routes';

import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    RedisModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    ServicesModule,
    CountersModule,
    QueuesModule,
    QueueEntriesModule,
  ],
  controllers: [AppController, UtilsController, MetricsController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    }
  ],
})
export class AppModule {
  configure(consumer) {
    consumer.apply(RateLimiterMiddleware).forRoutes('queue-entries/*/join', 'auth/*');
  }
}


