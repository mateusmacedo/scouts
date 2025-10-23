import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@scouts/utils-nest';
import { CreateUserDto, UpdateUserDto } from '@scouts/user-node';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
	let controller: UsersController;
	let service: UsersService;

	const mockUsersService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LoggerModule.forRoot()],
			controllers: [UsersController],
			providers: [
				{
					provide: UsersService,
					useValue: mockUsersService,
				},
			],
		}).compile();

		controller = module.get<UsersController>(UsersController);
		service = module.get<UsersService>(UsersService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should create a user successfully', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john@example.com',
				password: 'password123',
				phone: '123456789',
				address: '123 Main St',
			};

			const expectedUser = {
				id: '1',
				name: 'John Doe',
				email: 'john@example.com',
				phone: '123456789',
				address: '123 Main St',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockUsersService.create.mockResolvedValue(expectedUser);

			const result = await controller.create(createUserDto);

			expect(service.create).toHaveBeenCalledWith(createUserDto);
			expect(result).toEqual(expectedUser);
		});

		it('should create a user with minimal data', async () => {
			const createUserDto: CreateUserDto = {
				name: 'Jane Doe',
				email: 'jane@example.com',
				password: 'password123',
			};

			const expectedUser = {
				id: '1',
				name: 'Jane Doe',
				email: 'jane@example.com',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockUsersService.create.mockResolvedValue(expectedUser);

			const result = await controller.create(createUserDto);

			expect(service.create).toHaveBeenCalledWith(createUserDto);
			expect(result).toEqual(expectedUser);
		});
	});

	describe('findAll', () => {
		it('should return an array of users', async () => {
			const expectedUsers = [
				{
					id: '1',
					name: 'John Doe',
					email: 'john@example.com',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: '2',
					name: 'Jane Doe',
					email: 'jane@example.com',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockUsersService.findAll.mockResolvedValue(expectedUsers);

			const result = await controller.findAll();

			expect(service.findAll).toHaveBeenCalled();
			expect(result).toEqual(expectedUsers);
		});

		it('should return empty array when no users exist', async () => {
			mockUsersService.findAll.mockResolvedValue([]);

			const result = await controller.findAll();

			expect(service.findAll).toHaveBeenCalled();
			expect(result).toEqual([]);
		});
	});

	describe('findOne', () => {
		it('should return a user when found', async () => {
			const userId = '1';
			const expectedUser = {
				id: '1',
				name: 'John Doe',
				email: 'john@example.com',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockUsersService.findOne.mockResolvedValue(expectedUser);

			const result = await controller.findOne(userId);

			expect(service.findOne).toHaveBeenCalledWith(userId);
			expect(result).toEqual(expectedUser);
		});

		it('should return null when user not found', async () => {
			const userId = '999';
			mockUsersService.findOne.mockResolvedValue(null);

			const result = await controller.findOne(userId);

			expect(service.findOne).toHaveBeenCalledWith(userId);
			expect(result).toBeNull();
		});
	});

	describe('update', () => {
		it('should update a user successfully', async () => {
			const userId = '1';
			const updateUserDto: UpdateUserDto = {
				name: 'John Updated',
				phone: '987654321',
			};

			const expectedUser = {
				id: '1',
				name: 'John Updated',
				email: 'john@example.com',
				phone: '987654321',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockUsersService.update.mockResolvedValue(expectedUser);

			const result = await controller.update(userId, updateUserDto);

			expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
			expect(result).toEqual(expectedUser);
		});

		it('should return null when user not found for update', async () => {
			const userId = '999';
			const updateUserDto: UpdateUserDto = {
				name: 'Updated Name',
			};

			mockUsersService.update.mockResolvedValue(null);

			const result = await controller.update(userId, updateUserDto);

			expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
			expect(result).toBeNull();
		});
	});

	describe('remove', () => {
		it('should remove a user successfully', async () => {
			const userId = '1';
			mockUsersService.remove.mockResolvedValue(true);

			const result = await controller.remove(userId);

			expect(service.remove).toHaveBeenCalledWith(userId);
			expect(result).toBe(true);
		});

		it('should return false when user not found for removal', async () => {
			const userId = '999';
			mockUsersService.remove.mockResolvedValue(false);

			const result = await controller.remove(userId);

			expect(service.remove).toHaveBeenCalledWith(userId);
			expect(result).toBe(false);
		});
	});

	describe('activate', () => {
		it('should activate a user successfully', async () => {
			const userId = '1';
			const user = {
				id: '1',
				name: 'John Doe',
				email: 'john@example.com',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockUsersService.findOne.mockResolvedValue(user);

			const result = await controller.activate(userId);

			expect(service.findOne).toHaveBeenCalledWith(userId);
			expect(result).toEqual({
				success: true,
				message: 'User activated successfully',
			});
		});

                it('should return error when user not found for activation', async () => {
                        const userId = '999';
                        mockUsersService.findOne.mockResolvedValue(null);

                        const result = await controller.activate(userId);

                        expect(service.findOne).toHaveBeenCalledWith(userId);
                        expect(result).toEqual({
                                success: false,
                                message: 'User not found',
                        });
                });
	});

	describe('deactivate', () => {
		it('should deactivate a user successfully', async () => {
			const userId = '1';
			const user = {
				id: '1',
				name: 'John Doe',
				email: 'john@example.com',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockUsersService.findOne.mockResolvedValue(user);

			const result = await controller.deactivate(userId);

			expect(service.findOne).toHaveBeenCalledWith(userId);
			expect(result).toEqual({
				success: true,
				message: 'User deactivated successfully',
			});
		});

                it('should return error when user not found for deactivation', async () => {
                        const userId = '999';
                        mockUsersService.findOne.mockResolvedValue(null);

                        const result = await controller.deactivate(userId);

                        expect(service.findOne).toHaveBeenCalledWith(userId);
                        expect(result).toEqual({
                                success: false,
				message: 'User not found',
			});
		});
	});
});
