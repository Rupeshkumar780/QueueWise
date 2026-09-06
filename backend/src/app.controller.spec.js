import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return a healthy status', () => {
      const health = appController.getHealth();

      expect(health.status).toBe('ok');
      expect(health.timestamp).toEqual(expect.any(String));
      expect(health.uptime).toEqual(expect.any(Number));
    });
  });
});
