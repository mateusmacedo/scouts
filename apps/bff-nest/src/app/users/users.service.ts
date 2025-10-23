import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '@scouts/logger-node';
import { LOGGER_TOKEN, NestLoggerService } from '@scouts/utils-nest';
import { 
	UserService, 
	InMemoryUserRepository, 
	User, 
	CreateUserDto, 
	UpdateUserDto,
	UserEvents 
} from '@scouts/user-node';
import { CreateUserDto as AppCreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto as AppUpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
	private userService: UserService;
	private userRepository: InMemoryUserRepository;

	constructor(
		private readonly logger: NestLoggerService,
		@Inject(LOGGER_TOKEN) private readonly nodeLogger: Logger
	) {
		// Initialize repository and service
		this.userRepository = new InMemoryUserRepository();
		
		// Create user events handler for logging
		const userEvents: UserEvents = {
			onUserCreated: (user: User) => {
				this.nodeLogger.info('User created successfully', {
					userId: user.id,
					userData: { name: user.name, email: user.email }
				});
			},
			onUserUpdated: (user: User) => {
				this.nodeLogger.info('User updated successfully', {
					userId: user.id,
					userData: { name: user.name, email: user.email }
				});
			},
			onUserDeleted: (userId: string) => {
				this.nodeLogger.info('User deleted successfully', { userId });
			}
		};

		this.userService = new UserService(this.userRepository, userEvents);
	}

	async create(createUserDto: AppCreateUserDto): Promise<User> {
		this.logger.log('Creating new user', 'UsersService');

		const userDto: CreateUserDto = {
			name: createUserDto.name,
			email: createUserDto.email,
			phone: createUserDto.phone,
			address: createUserDto.address,
		};

		return this.userService.create(userDto);
	}

	async findAll(): Promise<User[]> {
		this.logger.debug('Finding all users', 'UsersService');

		const users = await this.userService.findAll();

		this.nodeLogger.debug('Users retrieved', {
			count: users.length,
		});

		return users;
	}

	async findOne(id: string): Promise<User | null> {
		this.logger.debug(`Finding user with id: ${id}`, 'UsersService');

		try {
			const user = await this.userService.findById(id);
			this.nodeLogger.info('User found', { userId: id });
			return user;
		} catch (error) {
			this.logger.warn(`User not found with id: ${id}`, 'UsersService');
			this.nodeLogger.warn('User not found', { userId: id });
			return null;
		}
	}

	async update(id: string, updateUserDto: AppUpdateUserDto): Promise<User | null> {
		this.logger.log(`Updating user with id: ${id}`, 'UsersService');

		try {
			const userDto: UpdateUserDto = {
				name: updateUserDto.name,
				email: updateUserDto.email,
				phone: updateUserDto.phone,
				address: updateUserDto.address,
			};

			return await this.userService.update(id, userDto);
		} catch (error) {
			this.logger.warn(`User not found for update with id: ${id}`, 'UsersService');
			this.nodeLogger.warn('User not found for update', { userId: id });
			return null;
		}
	}

	async remove(id: string): Promise<boolean> {
		this.logger.log(`Removing user with id: ${id}`, 'UsersService');

		try {
			await this.userService.delete(id);
			return true;
		} catch (error) {
			this.logger.warn(`User not found for removal with id: ${id}`, 'UsersService');
			this.nodeLogger.warn('User not found for removal', { userId: id });
			return false;
		}
	}
}
