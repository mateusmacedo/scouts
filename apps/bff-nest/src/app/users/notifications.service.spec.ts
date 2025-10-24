import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { NotificationsService } from './notifications.service';
import { AdvancedLoggerService } from '@scouts/utils-nest';
import { User } from '@scouts/user-node';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let httpService: HttpService;
  let advancedLogger: AdvancedLoggerService;

  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn()
          }
        },
        {
          provide: AdvancedLoggerService,
          useValue: {
            logBusinessEvent: jest.fn(),
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn()
          }
        }
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    httpService = module.get<HttpService>(HttpService);
    advancedLogger = module.get<AdvancedLoggerService>(AdvancedLoggerService);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const mockResponse = {
        data: {
          id: 'notification-123',
          status: 'sent' as const,
          type: 'email' as const,
          recipient: mockUser.email,
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString()
        }
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.sendWelcomeEmail(mockUser);

      expect(result).toEqual(mockResponse.data);
      expect(httpService.post).toHaveBeenCalledWith(
        '/api/v1/notifications/email',
        expect.objectContaining({
          to: mockUser.email,
          subject: 'Bem-vindo ao Scouts!',
          body: expect.stringContaining(mockUser.name)
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-correlation-id': expect.any(String),
            'Content-Type': 'application/json'
          })
        })
      );

      expect(advancedLogger.logBusinessEvent).toHaveBeenCalledWith(
        'welcome_email_requested',
        expect.objectContaining({
          userId: mockUser.id,
          userEmail: mockUser.email
        })
      );

      expect(advancedLogger.logBusinessEvent).toHaveBeenCalledWith(
        'welcome_email_sent',
        expect.objectContaining({
          userId: mockUser.id,
          notificationId: mockResponse.data.id,
          status: mockResponse.data.status
        })
      );
    });

    it('should handle email sending failure', async () => {
      const axiosError = new AxiosError('Network error');
      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => axiosError));

      const promise = service.sendWelcomeEmail(mockUser);
      
      // Avançar todos os timers do retry
      jest.runAllTimers();
      
      await expect(promise).rejects.toThrow();

      expect(advancedLogger.error).toHaveBeenCalledWith(
        'Failed to send welcome email',
        expect.objectContaining({
          userId: mockUser.id,
          userEmail: mockUser.email,
          error: 'Network error'
        })
      );
    });
  });

  describe('sendUserUpdateNotification', () => {
    it('should send SMS notification successfully', async () => {
      const mockResponse = {
        data: {
          id: 'notification-456',
          status: 'sent' as const,
          type: 'sms' as const,
          recipient: mockUser.phone,
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString()
        }
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.sendUserUpdateNotification(mockUser);

      expect(result).toEqual(mockResponse.data);
      expect(httpService.post).toHaveBeenCalledWith(
        '/api/v1/notifications/sms',
        expect.objectContaining({
          to: mockUser.phone,
          message: expect.stringContaining(mockUser.name)
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-correlation-id': expect.any(String),
            'Content-Type': 'application/json'
          })
        })
      );

      expect(advancedLogger.logBusinessEvent).toHaveBeenCalledWith(
        'user_update_notification_requested',
        expect.objectContaining({
          userId: mockUser.id,
          userPhone: mockUser.phone
        })
      );
    });

    it('should handle SMS sending failure', async () => {
      const axiosError = new AxiosError('SMS service unavailable');
      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => axiosError));

      const promise = service.sendUserUpdateNotification(mockUser);
      
      // Avançar todos os timers do retry
      jest.runAllTimers();
      
      await expect(promise).rejects.toThrow();

      expect(advancedLogger.error).toHaveBeenCalledWith(
        'Failed to send user update notification',
        expect.objectContaining({
          userId: mockUser.id,
          userPhone: mockUser.phone,
          error: 'SMS service unavailable'
        })
      );
    });
  });

  describe('getNotificationStatus', () => {
    it('should get notification status successfully', async () => {
      const notificationId = 'notification-123';
      const mockResponse = {
        data: {
          id: notificationId,
          status: 'sent' as const,
          type: 'email' as const,
          recipient: 'test@example.com',
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString()
        }
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.getNotificationStatus(notificationId);

      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        `/api/v1/notifications/${notificationId}/status`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-correlation-id': expect.any(String)
          })
        })
      );
    });

    it('should return null when notification not found', async () => {
      const notificationId = 'non-existent';
      const axiosError = new AxiosError('Not Found');
      axiosError.response = { status: 404 } as any;

      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => axiosError));

      const promise = service.getNotificationStatus(notificationId);
      
      // Avançar todos os timers do retry
      jest.runAllTimers();
      
      const result = await promise;

      expect(result).toBeNull();
      expect(advancedLogger.error).toHaveBeenCalledWith(
        'Failed to get notification status after retries',
        expect.objectContaining({
          notificationId,
          error: 'Not Found'
        })
      );
    });
  });

  describe('retry logic', () => {
    it('should handle retry configuration', async () => {
      const mockResponse = {
        data: {
          id: 'notification-123',
          status: 'sent' as const,
          type: 'email' as const,
          recipient: mockUser.email,
          createdAt: new Date().toISOString()
        }
      };

      // Test successful call without retry
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.sendWelcomeEmail(mockUser);

      expect(result).toEqual(mockResponse.data);
      expect(httpService.post).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      const axiosError = new AxiosError('Service unavailable');
      
      jest.spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => axiosError));

      const promise = service.sendWelcomeEmail(mockUser);
      
      // Avançar todos os timers do retry
      jest.runAllTimers();
      
      await expect(promise).rejects.toThrow('Service unavailable');
      
      expect(advancedLogger.error).toHaveBeenCalledWith(
        'Failed to send welcome email',
        expect.objectContaining({
          userId: mockUser.id,
          userEmail: mockUser.email,
          error: 'Service unavailable'
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle user without email', async () => {
      const userWithoutEmail: User = {
        ...mockUser,
        email: undefined as any
      };

      const mockResponse = {
        data: {
          id: 'notification-123',
          status: 'sent' as const,
          type: 'email' as const,
          recipient: userWithoutEmail.email,
          createdAt: new Date().toISOString()
        }
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.sendWelcomeEmail(userWithoutEmail);

      expect(result).toEqual(mockResponse.data);
      expect(httpService.post).toHaveBeenCalledWith(
        '/api/v1/notifications/email',
        expect.objectContaining({
          to: userWithoutEmail.email
        }),
        expect.any(Object)
      );
    });

    it('should handle user without phone for SMS', async () => {
      const userWithoutPhone: User = {
        ...mockUser,
        phone: undefined as any
      };

      const mockResponse = {
        data: {
          id: 'notification-456',
          status: 'sent' as const,
          type: 'sms' as const,
          recipient: '', // Empty string when phone is undefined
          createdAt: new Date().toISOString()
        }
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.sendUserUpdateNotification(userWithoutPhone);

      expect(result).toEqual(mockResponse.data);
      expect(httpService.post).toHaveBeenCalledWith(
        '/api/v1/notifications/sms',
        expect.objectContaining({
          to: '' // Service converts undefined to empty string
        }),
        expect.any(Object)
      );
    });

    it('should handle malformed response from notification service', async () => {
      const malformedResponse = {
        data: {
          // Missing required fields
          id: 'notification-123'
        }
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(malformedResponse));

      const result = await service.sendWelcomeEmail(mockUser);

      expect(result).toEqual(malformedResponse.data);
      expect(advancedLogger.logBusinessEvent).toHaveBeenCalledWith(
        'welcome_email_sent',
        expect.objectContaining({
          userId: mockUser.id,
          notificationId: malformedResponse.data.id
        })
      );
    });

    it('should handle timeout error', async () => {
      const timeoutError = new AxiosError('timeout of 10000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      
      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => timeoutError));

      const promise = service.sendWelcomeEmail(mockUser);
      
      // Avançar todos os timers do retry
      jest.runAllTimers();
      
      await expect(promise).rejects.toThrow('timeout of 10000ms exceeded');

      expect(advancedLogger.error).toHaveBeenCalledWith(
        'Failed to send welcome email',
        expect.objectContaining({
          userId: mockUser.id,
          userEmail: mockUser.email,
          error: 'timeout of 10000ms exceeded'
        })
      );
    });

    it('should validate correlation-id is generated and used', async () => {
      const mockResponse = {
        data: {
          id: 'notification-123',
          status: 'sent' as const,
          type: 'email' as const,
          recipient: mockUser.email,
          createdAt: new Date().toISOString()
        }
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      await service.sendWelcomeEmail(mockUser);

      expect(httpService.post).toHaveBeenCalledWith(
        '/api/v1/notifications/email',
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-correlation-id': expect.stringMatching(/^bff-\d+-\w+$/)
          })
        })
      );
    });
  });
});
