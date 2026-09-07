import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) },
        },
      ],
    }).compile();

    appController = app.get(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return a healthy status after checking the database', async () => {
      const health = await appController.getHealth();

      expect(appController.prisma.$queryRaw).toHaveBeenCalled();
      expect(health.status).toBe('ok');
      expect(health.timestamp).toEqual(expect.any(String));
      expect(health.uptime).toEqual(expect.any(Number));
    });
  });
});
