import { EmailNotification, NotificationService, SMSNotification } from './notification.service';

describe('NotificationService', () => {
	let service: NotificationService;
	let mockLogger: any;

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			debug: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
		};

		service = new NotificationService(mockLogger);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('sendEmail', () => {
		it('should send email successfully', async () => {
			const notification: EmailNotification = {
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
				template: 'test-template',
				variables: { name: 'John' },
			};

			// Mock Math.random to avoid flaky tests
			const originalRandom = Math.random;
			Math.random = jest.fn(() => 0.5); // Always return 0.5 to avoid random failures

			const result = await service.sendEmail(notification);

			expect(result).toEqual({
				id: expect.any(String),
				status: 'sent',
				type: 'email',
				recipient: notification.to,
				createdAt: expect.any(String),
				sentAt: expect.any(String),
			});

			expect(mockLogger.info).toHaveBeenCalledWith('Starting email notification', {
				id: result.id,
				to: notification.to,
				subject: notification.subject,
				template: notification.template,
			});

			expect(mockLogger.info).toHaveBeenCalledWith('Email notification sent successfully', {
				id: result.id,
				to: notification.to,
				subject: notification.subject,
				duration: expect.any(String),
			});

			// Restore Math.random
			Math.random = originalRandom;
		});

		it('should handle email sending failure with retry', async () => {
			const notification: EmailNotification = {
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
			};

			// Mock Math.random to simulate failures
			const originalRandom = Math.random;
			let callCount = 0;
			Math.random = jest.fn(() => {
				callCount++;
				return callCount <= 2 ? 0.1 : 0.5; // Fail first 2 attempts, succeed on 3rd
			});

			const result = await service.sendEmail(notification);

			expect(result.status).toBe('sent');
			expect(mockLogger.warn).toHaveBeenCalledWith('Email send attempt failed', {
				attempt: 1,
				to: notification.to,
				subject: notification.subject,
				error: expect.stringContaining('Email service temporarily unavailable'),
			});

			expect(mockLogger.debug).toHaveBeenCalledWith('Retrying email send', {
				attempt: 1,
				delay: '1000ms',
				to: notification.to,
			});

			// Restore Math.random
			Math.random = originalRandom;
		});

		it('should fail after all retries exhausted', async () => {
			const notification: EmailNotification = {
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
			};

			// Mock Math.random to always fail
			const originalRandom = Math.random;
			Math.random = jest.fn(() => 0.1); // Always fail

			const result = await service.sendEmail(notification);

			expect(result.status).toBe('failed');
			expect(result.error).toContain('Email service temporarily unavailable');

			expect(mockLogger.error).toHaveBeenCalledWith('Email notification failed', {
				id: result.id,
				to: notification.to,
				subject: notification.subject,
				error: expect.any(String),
			});

			// Should have tried 3 times
			expect(mockLogger.warn).toHaveBeenCalledTimes(3);

			// Restore Math.random
			Math.random = originalRandom;
		});

		it('should log debug information during retry attempts', async () => {
			const notification: EmailNotification = {
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
			};

			// Mock Math.random to fail first attempt, succeed second
			const originalRandom = Math.random;
			let callCount = 0;
			Math.random = jest.fn(() => {
				callCount++;
				return callCount === 1 ? 0.1 : 0.5; // Fail first, succeed second
			});

			await service.sendEmail(notification);

			expect(mockLogger.debug).toHaveBeenCalledWith('Email send attempt', {
				attempt: 1,
				to: notification.to,
				subject: notification.subject,
			});

			expect(mockLogger.debug).toHaveBeenCalledWith('Retrying email send', {
				attempt: 1,
				delay: '1000ms',
				to: notification.to,
			});

			// Restore Math.random
			Math.random = originalRandom;
		});
	});

	describe('sendSMS', () => {
		it('should send SMS successfully', async () => {
			const notification: SMSNotification = {
				to: '+1234567890',
				message: 'Test SMS',
				template: 'sms-template',
				variables: { name: 'John' },
			};

			// Mock Math.random to avoid flaky tests
			const originalRandom = Math.random;
			Math.random = jest.fn(() => 0.5); // Always return 0.5 to avoid random failures

			const result = await service.sendSMS(notification);

			expect(result).toEqual({
				id: expect.any(String),
				status: 'sent',
				type: 'sms',
				recipient: notification.to,
				createdAt: expect.any(String),
				sentAt: expect.any(String),
			});

			expect(mockLogger.info).toHaveBeenCalledWith('Starting SMS notification', {
				id: result.id,
				to: notification.to,
				template: notification.template,
			});

			expect(mockLogger.info).toHaveBeenCalledWith('SMS notification sent successfully', {
				id: result.id,
				to: notification.to,
				duration: expect.any(String),
			});

			// Restore Math.random
			Math.random = originalRandom;
		});

		it('should handle SMS sending failure with retry', async () => {
			const notification: SMSNotification = {
				to: '+1234567890',
				message: 'Test SMS',
			};

			// Mock Math.random to simulate failures
			const originalRandom = Math.random;
			let callCount = 0;
			Math.random = jest.fn(() => {
				callCount++;
				return callCount <= 1 ? 0.1 : 0.5; // Fail first attempt, succeed second
			});

			const result = await service.sendSMS(notification);

			expect(result.status).toBe('sent');
			expect(mockLogger.warn).toHaveBeenCalledWith('SMS send attempt failed', {
				attempt: 1,
				to: notification.to,
				error: expect.stringContaining('SMS service temporarily unavailable'),
			});

			// Restore Math.random
			Math.random = originalRandom;
		});

		it('should fail after all retries exhausted for SMS', async () => {
			const notification: SMSNotification = {
				to: '+1234567890',
				message: 'Test SMS',
			};

			// Mock Math.random to always fail
			const originalRandom = Math.random;
			Math.random = jest.fn(() => 0.1); // Always fail

			const result = await service.sendSMS(notification);

			expect(result.status).toBe('failed');
			expect(result.error).toContain('SMS service temporarily unavailable');

			expect(mockLogger.error).toHaveBeenCalledWith('SMS notification failed', {
				id: result.id,
				to: notification.to,
				error: expect.any(String),
			});

			// Restore Math.random
			Math.random = originalRandom;
		});
	});

	describe('getStatus', () => {
		it('should return notification status when found', async () => {
			const notification: EmailNotification = {
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
			};

			// Mock Math.random to avoid flaky tests
			const originalRandom = Math.random;
			Math.random = jest.fn(() => 0.5);

			const result = await service.sendEmail(notification);
			const status = service.getStatus(result.id);

			expect(status).toEqual(result);

			// Restore Math.random
			Math.random = originalRandom;
		});

		it('should return null when notification not found', () => {
			const status = service.getStatus('non-existent-id');
			expect(status).toBeNull();
		});
	});

	describe('getAllNotifications', () => {
		it('should return all notifications', async () => {
			const emailNotification: EmailNotification = {
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
			};

			const smsNotification: SMSNotification = {
				to: '+1234567890',
				message: 'Test SMS',
			};

			// Mock Math.random to avoid flaky tests
			const originalRandom = Math.random;
			Math.random = jest.fn(() => 0.5);

			await service.sendEmail(emailNotification);
			await service.sendSMS(smsNotification);

			const allNotifications = service.getAllNotifications();

			expect(allNotifications).toHaveLength(2);
			expect(allNotifications[0].type).toBe('email');
			expect(allNotifications[1].type).toBe('sms');

			// Restore Math.random
			Math.random = originalRandom;
		});

		it('should return empty array when no notifications', () => {
			const allNotifications = service.getAllNotifications();
			expect(allNotifications).toEqual([]);
		});
	});

	describe('exponential backoff', () => {
		it('should use exponential backoff for retries', async () => {
			const notification: EmailNotification = {
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
			};

			// Mock Math.random to always fail
			const originalRandom = Math.random;
			Math.random = jest.fn(() => 0.1);

			const startTime = Date.now();
			await service.sendEmail(notification);
			const endTime = Date.now();

			// Should have taken at least 1s + 2s = 3s for retries
			expect(endTime - startTime).toBeGreaterThanOrEqual(3000);

			// Restore Math.random
			Math.random = originalRandom;
		});
	});

	describe('notification persistence', () => {
		it('should persist notifications in memory', async () => {
			const notification: EmailNotification = {
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
			};

			// Mock Math.random to avoid flaky tests
			const originalRandom = Math.random;
			Math.random = jest.fn(() => 0.5);

			const result = await service.sendEmail(notification);

			// Check that notification is persisted
			const status = service.getStatus(result.id);
			expect(status).toBeDefined();
			expect(status?.id).toBe(result.id);

			// Restore Math.random
			Math.random = originalRandom;
		});
	});
});
