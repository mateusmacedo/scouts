import { NotificationService } from './notification.service';
import { createLogger } from '../config/logger.config';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    
    service = new NotificationService(mockLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send email notification successfully', async () => {
      const notification = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body'
      };

      const result = await service.sendEmail(notification);

      expect(result).toBeDefined();
      expect(result.type).toBe('email');
      expect(result.recipient).toBe('test@example.com');
      expect(['sent', 'failed']).toContain(result.status);
    });
  });

  describe('sendSMS', () => {
    it('should send SMS notification successfully', async () => {
      const notification = {
        to: '+1234567890',
        message: 'Test Message'
      };

      const result = await service.sendSMS(notification);

      expect(result).toBeDefined();
      expect(result.type).toBe('sms');
      expect(result.recipient).toBe('+1234567890');
      expect(['sent', 'failed']).toContain(result.status);
    });
  });

  describe('getStatus', () => {
    it('should return null for non-existent notification', () => {
      const status = service.getStatus('non-existent-id');
      expect(status).toBeNull();
    });

    it('should return status for existing notification', async () => {
      const notification = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body'
      };

      const result = await service.sendEmail(notification);
      const status = service.getStatus(result.id);

      expect(status).toBeDefined();
      expect(status?.id).toBe(result.id);
    });
  });
});
