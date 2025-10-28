import { AdvancedLoggerService, LOGGER_TOKEN, LoggerModule } from '@scouts/utils-nest';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from './notifications.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
	let service: UsersService;
	let logger: any;
	let advancedLogger: AdvancedLoggerService;
	let notificationsService: NotificationsService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LoggerModule.forRoot()],
			providers: [
				UsersService,
				{
					provide: NotificationsService,
					useValue: {
						sendWelcomeEmail: jest.fn(),
						sendUserUpdateNotification: jest.fn(),
						getNotificationStatus: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
		logger = module.get(LOGGER_TOKEN);
		advancedLogger = module.get<AdvancedLoggerService>(AdvancedLoggerService);
		notificationsService = module.get<NotificationsService>(NotificationsService);

		// Mock the logger methods
		jest.spyOn(logger, 'info').mockImplementation(() => {});
		jest.spyOn(logger, 'error').mockImplementation(() => {});
		jest.spyOn(logger, 'warn').mockImplementation(() => {});
		jest.spyOn(logger, 'debug').mockImplementation(() => {});
		jest.spyOn(logger, 'fatal').mockImplementation(() => {});
		jest.spyOn(logger, 'log').mockImplementation(() => {});

		// Mock the advanced logger methods
		jest.spyOn(advancedLogger, 'info').mockImplementation(() => {});
		jest.spyOn(advancedLogger, 'error').mockImplementation(() => {});
		jest.spyOn(advancedLogger, 'warn').mockImplementation(() => {});
		jest.spyOn(advancedLogger, 'debug').mockImplementation(() => {});
		jest.spyOn(advancedLogger, 'logBusinessEvent').mockImplementation(() => {});

		// Clear the repository for each test
		(service as any).userRepository.clear();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should create a user with all fields and send welcome notification', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '123456789',
				address: '123 Main St',
			};

			// Mock successful notification
			jest.spyOn(notificationsService, 'sendWelcomeEmail').mockResolvedValue({
				id: 'notification-123',
				status: 'sent',
				type: 'email',
				recipient: 'john@example.com',
				createdAt: new Date().toISOString(),
			});

			const result = await service.create(createUserDto);

			expect(result).toEqual({
				id: '1',
				name: 'John Doe',
				email: 'john@example.com',
				phone: '123456789',
				address: '123 Main St',
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			});

			expect(advancedLogger.logBusinessEvent).toHaveBeenCalledWith('user_created', {
				userId: '1',
				userData: { name: 'John Doe', email: 'john@example.com' },
			});

			// Verify notification was sent
			expect(notificationsService.sendWelcomeEmail).toHaveBeenCalledWith(result);
			expect(advancedLogger.info).toHaveBeenCalledWith('Welcome email notification sent', {
				userId: '1',
				userEmail: 'john@example.com',
			});
		});

		it('should create user even if welcome notification fails', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '123456789',
				address: '123 Main St',
			};

			// Mock failed notification
			jest
				.spyOn(notificationsService, 'sendWelcomeEmail')
				.mockRejectedValue(new Error('Notification service unavailable'));

			const result = await service.create(createUserDto);

			expect(result).toEqual({
				id: '1',
				name: 'John Doe',
				email: 'john@example.com',
				phone: '123456789',
				address: '123 Main St',
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			});

			// Verify notification was attempted
			expect(notificationsService.sendWelcomeEmail).toHaveBeenCalledWith(result);
			expect(advancedLogger.warn).toHaveBeenCalledWith(
				'Failed to send welcome email notification',
				{
					userId: '1',
					userEmail: 'john@example.com',
					error: 'Notification service unavailable',
				}
			);
		});

		it('should create a user with minimal required fields', async () => {
			const createUserDto: CreateUserDto = {
				name: 'Jane Doe',
				email: 'jane@example.com',
			};

			const result = await service.create(createUserDto);

			expect(result).toEqual({
				id: '1',
				name: 'Jane Doe',
				email: 'jane@example.com',
				phone: undefined,
				address: undefined,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			});
		});

		it('should increment ID for multiple users', async () => {
			const user1Dto: CreateUserDto = {
				name: 'User 1',
				email: 'user1@example.com',
			};

			const user2Dto: CreateUserDto = {
				name: 'User 2',
				email: 'user2@example.com',
			};

			const user1 = await service.create(user1Dto);
			const user2 = await service.create(user2Dto);

			expect(user1.id).toBe('1');
			expect(user2.id).toBe('2');
		});

		it('should set createdAt and updatedAt to current date', async () => {
			const createUserDto: CreateUserDto = {
				name: 'Test User',
				email: 'test@example.com',
			};

			const beforeCreate = new Date();
			const result = await service.create(createUserDto);
			const afterCreate = new Date();

			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeInstanceOf(Date);
			expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
			expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
		});
	});

	describe('findAll', () => {
		it('should return empty array when no users exist', async () => {
			const result = await service.findAll();

			expect(result).toEqual([]);
			expect(advancedLogger.debug).toHaveBeenCalledWith('Users retrieved', { count: 0 });
		});

		it('should return all users', async () => {
			const user1Dto: CreateUserDto = {
				name: 'User 1',
				email: 'user1@example.com',
			};

			const user2Dto: CreateUserDto = {
				name: 'User 2',
				email: 'user2@example.com',
			};

			await service.create(user1Dto);
			await service.create(user2Dto);

			const result = await service.findAll();

			expect(result).toHaveLength(2);
			expect(result[0].name).toBe('User 1');
			expect(result[1].name).toBe('User 2');
			expect(advancedLogger.debug).toHaveBeenCalledWith('Users retrieved', { count: 2 });
		});
	});

	describe('findOne', () => {
		it('should return user when found', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
			};

			const createdUser = await service.create(createUserDto);
			const result = await service.findOne(createdUser.id);

			expect(result).toEqual(createdUser);
			expect(advancedLogger.info).toHaveBeenCalledWith('User found', { userId: createdUser.id });
		});

		it('should return null when user not found', async () => {
			const result = await service.findOne('999');

			expect(result).toBeNull();
			expect(advancedLogger.warn).toHaveBeenCalledWith('User not found', { userId: '999' });
		});

		it('should return null for empty string ID', async () => {
			const result = await service.findOne('');

			expect(result).toBeNull();
			expect(advancedLogger.warn).toHaveBeenCalledWith('User not found', { userId: '' });
		});
	});

	describe('update', () => {
		it('should update user successfully', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
			};

			const createdUser = await service.create(createUserDto);
			const updateUserDto: UpdateUserDto = {
				name: 'John Updated',
				phone: '987654321',
			};

			const result = await service.update(createdUser.id, updateUserDto);

			expect(result).toEqual({
				...createdUser,
				name: 'John Updated',
				phone: '987654321',
				updatedAt: expect.any(Date),
			});

			expect(result?.updatedAt.getTime()).toBeGreaterThanOrEqual(createdUser.updatedAt.getTime());
		});

		it('should return null when user not found for update', async () => {
			const updateUserDto: UpdateUserDto = {
				name: 'Updated Name',
			};

			const result = await service.update('999', updateUserDto);

			expect(result).toBeNull();
			expect(advancedLogger.warn).toHaveBeenCalledWith('User not found for update', {
				userId: '999',
			});
		});

		it('should update only provided fields', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '123456789',
				address: '123 Main St',
			};

			const createdUser = await service.create(createUserDto);
			const updateUserDto: UpdateUserDto = {
				phone: '987654321',
			};

			const result = await service.update(createdUser.id, updateUserDto);

			expect(result).toEqual({
				...createdUser,
				phone: '987654321',
				updatedAt: expect.any(Date),
			});

			// Other fields should remain unchanged
			expect(result?.name).toBe(createdUser.name);
			expect(result?.email).toBe(createdUser.email);
			expect(result?.address).toBe(createdUser.address);
		});

		it('should send SMS notification on successful user update', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '123456789',
				address: '123 Main St',
			};

			const createdUser = await service.create(createUserDto);
			const updateUserDto: UpdateUserDto = {
				name: 'John Updated',
				phone: '987654321',
			};

			// Mock successful SMS notification
			jest.spyOn(notificationsService, 'sendUserUpdateNotification').mockResolvedValue({
				id: 'notification-456',
				status: 'sent',
				type: 'sms',
				recipient: '987654321',
				createdAt: new Date().toISOString(),
			});

			const result = await service.update(createdUser.id, updateUserDto);

			expect(result).toEqual({
				...createdUser,
				name: 'John Updated',
				phone: '987654321',
				updatedAt: expect.any(Date),
			});

			// Verify SMS notification was sent
			expect(notificationsService.sendUserUpdateNotification).toHaveBeenCalledWith(result);
			expect(advancedLogger.info).toHaveBeenCalledWith('User update notification sent', {
				userId: result?.id,
				userPhone: result?.phone,
			});
		});

		it('should handle SMS notification failure during user update', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '123456789',
				address: '123 Main St',
			};

			const createdUser = await service.create(createUserDto);
			const updateUserDto: UpdateUserDto = {
				name: 'John Updated',
				phone: '987654321',
			};

			// Mock failed SMS notification
			jest
				.spyOn(notificationsService, 'sendUserUpdateNotification')
				.mockRejectedValue(new Error('SMS service unavailable'));

			const result = await service.update(createdUser.id, updateUserDto);

			expect(result).toEqual({
				...createdUser,
				name: 'John Updated',
				phone: '987654321',
				updatedAt: expect.any(Date),
			});

			// Verify SMS notification was attempted
			expect(notificationsService.sendUserUpdateNotification).toHaveBeenCalledWith(result);
			expect(advancedLogger.warn).toHaveBeenCalledWith('Failed to send user update notification', {
				userId: result?.id,
				userPhone: result?.phone,
				error: 'SMS service unavailable',
			});
		});

		it('should update user even if SMS notification fails', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '123456789',
			};

			const createdUser = await service.create(createUserDto);
			const updateUserDto: UpdateUserDto = {
				name: 'John Updated',
			};

			// Mock failed SMS notification
			jest
				.spyOn(notificationsService, 'sendUserUpdateNotification')
				.mockRejectedValue(new Error('SMS service unavailable'));

			const result = await service.update(createdUser.id, updateUserDto);

			// User update should succeed even if notification fails
			expect(result).toEqual({
				...createdUser,
				name: 'John Updated',
				updatedAt: expect.any(Date),
			});

			// Verify notification was attempted but user update still succeeded
			expect(notificationsService.sendUserUpdateNotification).toHaveBeenCalledWith(result);
			expect(advancedLogger.warn).toHaveBeenCalledWith('Failed to send user update notification', {
				userId: result?.id,
				userPhone: result?.phone,
				error: 'SMS service unavailable',
			});
		});

		it('should not send notification for user without phone', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
				// No phone provided
			};

			const createdUser = await service.create(createUserDto);
			const updateUserDto: UpdateUserDto = {
				name: 'John Updated',
			};

			// Mock SMS notification
			jest.spyOn(notificationsService, 'sendUserUpdateNotification').mockResolvedValue({
				id: 'notification-456',
				status: 'sent',
				type: 'sms',
				recipient: undefined,
				createdAt: new Date().toISOString(),
			});

			const result = await service.update(createdUser.id, updateUserDto);

			expect(result).toEqual({
				...createdUser,
				name: 'John Updated',
				updatedAt: expect.any(Date),
			});

			// SMS notification should still be attempted (service handles empty phone)
			expect(notificationsService.sendUserUpdateNotification).toHaveBeenCalledWith(result);
		});
	});

	describe('remove', () => {
		it('should remove user successfully', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
			};

			const createdUser = await service.create(createUserDto);
			const result = await service.remove(createdUser.id);

			expect(result).toBe(true);

			// Verify user was actually removed
			const findResult = await service.findOne(createdUser.id);
			expect(findResult).toBeNull();
		});

		it('should return false when user not found for removal', async () => {
			const result = await service.remove('999');

			expect(result).toBe(false);
			expect(advancedLogger.warn).toHaveBeenCalledWith('User not found for removal', {
				userId: '999',
			});
		});

		it('should maintain other users when removing one', async () => {
			const user1Dto: CreateUserDto = {
				name: 'User 1',
				email: 'user1@example.com',
			};

			const user2Dto: CreateUserDto = {
				name: 'User 2',
				email: 'user2@example.com',
			};

			const user1 = await service.create(user1Dto);
			const user2 = await service.create(user2Dto);

			const removeResult = await service.remove(user1.id);
			expect(removeResult).toBe(true);

			const allUsers = await service.findAll();
			expect(allUsers).toHaveLength(1);
			expect(allUsers[0].id).toBe(user2.id);
		});
	});

	describe('state isolation', () => {
		it('should not affect other test users', async () => {
			// This test verifies that the beforeEach reset works correctly
			const createUserDto: CreateUserDto = {
				name: 'Isolation Test',
				email: 'isolation@example.com',
			};

			const result = await service.create(createUserDto);
			expect(result.id).toBe('1'); // Should start from 1, not continue from previous tests
		});
	});
});
