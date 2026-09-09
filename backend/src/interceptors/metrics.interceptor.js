import { Injectable, Logger } from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor {
  constructor() {
    this.logger = new Logger('Metrics');
  }

  intercept(context, next) {
    const req = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const url = req.url;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        if (duration > 500) {
          this.logger.warn(`[SLOW] ${req.method} ${url} took ${duration}ms`);
        } else {
          // Uncomment for verbose logging
          // this.logger.log(`${req.method} ${url} took ${duration}ms`);
        }
      })
    );
  }
}
