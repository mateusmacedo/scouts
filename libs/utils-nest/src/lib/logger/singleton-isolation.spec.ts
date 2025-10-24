import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from './logger.module';
import { LOGGER_TOKEN } from './constants';
import { NestLoggerService } from './nest-logger.service';
import { AdvancedLoggerService } from './advanced-logger.service';

describe('LoggerModule Singleton Isolation', () => {
  describe('Multiple Module Instances', () => {
    it('should create isolated logger instances per module', async () => {
      // Criar primeiro módulo
      const module1: TestingModule = await Test.createTestingModule({
        imports: [LoggerModule.forRoot({ service: 'test-service-1' })],
      }).compile();

      // Criar segundo módulo
      const module2: TestingModule = await Test.createTestingModule({
        imports: [LoggerModule.forRoot({ service: 'test-service-2' })],
      }).compile();

      const logger1 = module1.get(LOGGER_TOKEN);
      const logger2 = module2.get(LOGGER_TOKEN);

      console.log('[DIAGNOSTIC] NestJS Logger instances are different:', logger1 !== logger2);
      expect(logger1).not.toBe(logger2);

      // Verificar event listeners acumulados
      const listenerCount = process.listenerCount('SIGTERM');
      console.log('[DIAGNOSTIC] SIGTERM listeners after 2 modules:', listenerCount);

      // Cleanup
      await module1.close();
      await module2.close();
    });

    it('should detect listener accumulation across test modules', async () => {
      const initialListeners = {
        SIGTERM: process.listenerCount('SIGTERM'),
        SIGINT: process.listenerCount('SIGINT'),
        uncaughtException: process.listenerCount('uncaughtException'),
      };

      console.log('[DIAGNOSTIC] Initial listeners:', JSON.stringify(initialListeners, null, 2));

      // Criar e destruir múltiplos módulos
      for (let i = 0; i < 3; i++) {
        const module = await Test.createTestingModule({
          imports: [LoggerModule.forRoot({ service: `test-service-${i}` })],
        }).compile();

        const logger = module.get(LOGGER_TOKEN);
        await logger.info(`Test message ${i}`);

        await module.close();
      }

      const finalListeners = {
        SIGTERM: process.listenerCount('SIGTERM'),
        SIGINT: process.listenerCount('SIGINT'),
        uncaughtException: process.listenerCount('uncaughtException'),
      };

      console.log('[DIAGNOSTIC] Final listeners:', JSON.stringify(finalListeners, null, 2));
      console.log('[DIAGNOSTIC] Listener growth:', {
        SIGTERM: finalListeners.SIGTERM - initialListeners.SIGTERM,
        SIGINT: finalListeners.SIGINT - initialListeners.SIGINT,
        uncaughtException: finalListeners.uncaughtException - initialListeners.uncaughtException,
      });
    });
  });

  describe('Service Isolation', () => {
    it('should maintain independent state in NestLoggerService', async () => {
      const module = await Test.createTestingModule({
        imports: [LoggerModule.forRoot()],
      }).compile();

      const service1 = module.get<NestLoggerService>(NestLoggerService);
      const service2 = module.get<NestLoggerService>(NestLoggerService);

      // NestJS DI deve retornar mesma instância dentro do mesmo módulo
      expect(service1).toBe(service2);
      console.log('[DIAGNOSTIC] NestLoggerService is singleton within module:', service1 === service2);

      await module.close();
    });
  });
});
