import { Test, TestingModule } from '@nestjs/testing';
import { LOGGER_TOKEN, LoggerModule } from '@scouts/utils-nest';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { InMemoryUserRepository } from '@scouts/user-node';

describe('UsersService', () => {
	let service: UsersService;
	let logger: any;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LoggerModule.forRoot()],
			providers: [UsersService],
		}).compile();

		service = module.get<UsersService>(UsersService);
		logger = module.get(LOGGER_TOKEN);

		// Mock the logger methods
		jest.spyOn(logger, 'info').mockImplementation(() => {});
		jest.spyOn(logger, 'error').mockImplementation(() => {});
		jest.spyOn(logger, 'warn').mockImplementation(() => {});
		jest.spyOn(logger, 'debug').mockImplementation(() => {});
		jest.spyOn(logger, 'fatal').mockImplementation(() => {});
		jest.spyOn(logger, 'log').mockImplementation(() => {});

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
		it('should create a user with all fields', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '123456789',
				address: '123 Main St',
			};

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

			expect(logger.info).toHaveBeenCalledWith('User created successfully', {
				userId: '1',
				userData: { name: 'John Doe', email: 'john@example.com' },
			});
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
			expect(logger.debug).toHaveBeenCalledWith('Users retrieved', { count: 0 });
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
			expect(logger.debug).toHaveBeenCalledWith('Users retrieved', { count: 2 });
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
			expect(logger.info).toHaveBeenCalledWith('User found', { userId: createdUser.id });
		});

		it('should return null when user not found', async () => {
			const result = await service.findOne('999');

			expect(result).toBeNull();
			expect(logger.warn).toHaveBeenCalledWith('User not found', { userId: '999' });
		});

		it('should return null for empty string ID', async () => {
			const result = await service.findOne('');

			expect(result).toBeNull();
			expect(logger.warn).toHaveBeenCalledWith('User not found', { userId: '' });
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
			expect(logger.warn).toHaveBeenCalledWith('User not found for update', { userId: '999' });
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
			expect(logger.warn).toHaveBeenCalledWith('User not found for removal', { userId: '999' });
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
