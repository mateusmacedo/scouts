import { Injectable } from '@nestjs/common';
import {
	CreateUserDto,
	InMemoryUserRepository,
	UpdateUserDto,
	User,
	UserEvents,
	UserService,
} from '@scouts/user-node';
import { AdvancedLoggerService, NestLoggerService } from '@scouts/utils-nest';
import { CreateUserDto as AppCreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto as AppUpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from './notifications.service';

@Injectable()
export class UsersService {
	private userService: UserService;
	private userRepository: InMemoryUserRepository;

	constructor(
		private readonly logger: NestLoggerService,
		private readonly advancedLogger: AdvancedLoggerService,
		private readonly notificationsService: NotificationsService
	) {
		// Initialize repository and service
		this.userRepository = new InMemoryUserRepository();

		// Create user events handler for logging
		const userEvents: UserEvents = {
			onUserCreated: (user: User) => {
				this.advancedLogger.logBusinessEvent('user_created', {
					userId: user.id,
					userData: { name: user.name, email: user.email },
				});
			},
			onUserUpdated: (user: User) => {
				this.advancedLogger.logBusinessEvent('user_updated', {
					userId: user.id,
					userData: { name: user.name, email: user.email },
				});
			},
			onUserDeleted: (userId: string) => {
				this.advancedLogger.logBusinessEvent('user_deleted', { userId });
			},
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

		const user = await this.userService.create(userDto);

		// Orquestração: Enviar notificação de boas-vindas
		try {
			await this.notificationsService.sendWelcomeEmail(user);
			this.advancedLogger.info('Welcome email notification sent', {
				userId: user.id,
				userEmail: user.email,
			});
		} catch (error) {
			// Log do erro mas não falha a criação do usuário
			this.advancedLogger.warn('Failed to send welcome email notification', {
				userId: user.id,
				userEmail: user.email,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}

		return user;
	}

	async findAll(): Promise<User[]> {
		this.logger.debug('Finding all users', 'UsersService');

		const users = await this.userService.findAll();

		this.advancedLogger.debug('Users retrieved', {
			count: users.length,
		});

		return users;
	}

	async findOne(id: string): Promise<User | null> {
		this.logger.debug(`Finding user with id: ${id}`, 'UsersService');

		try {
			const user = await this.userService.findById(id);
			this.advancedLogger.info('User found', { userId: id });
			return user;
		} catch (_error) {
			this.logger.warn(`User not found with id: ${id}`, 'UsersService');
			this.advancedLogger.warn('User not found', { userId: id });
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

			const updatedUser = await this.userService.update(id, userDto);

			// Orquestração: Enviar notificação de atualização
			if (updatedUser) {
				try {
					await this.notificationsService.sendUserUpdateNotification(updatedUser);
					this.advancedLogger.info('User update notification sent', {
						userId: updatedUser.id,
						userPhone: updatedUser.phone,
					});
				} catch (error) {
					// Log do erro mas não falha a atualização do usuário
					this.advancedLogger.warn('Failed to send user update notification', {
						userId: updatedUser.id,
						userPhone: updatedUser.phone,
						error: error instanceof Error ? error.message : 'Unknown error',
					});
				}
			}

			return updatedUser;
		} catch (_error) {
			this.logger.warn(`User not found for update with id: ${id}`, 'UsersService');
			this.advancedLogger.warn('User not found for update', { userId: id });
			return null;
		}
	}

	async remove(id: string): Promise<boolean> {
		this.logger.log(`Removing user with id: ${id}`, 'UsersService');

		try {
			await this.userService.delete(id);
			return true;
		} catch (_error) {
			this.logger.warn(`User not found for removal with id: ${id}`, 'UsersService');
			this.advancedLogger.warn('User not found for removal', { userId: id });
			return false;
		}
	}
}
