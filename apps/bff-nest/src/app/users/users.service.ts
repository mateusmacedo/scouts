import { Injectable, Inject } from '@nestjs/common';
import { NestLoggerService, LOGGER_TOKEN } from '@scouts/utils-nest';
import type { Logger } from '@scouts/logger-node';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface User {
	id: string;
	name: string;
	email: string;
	phone?: string;
	address?: string;
	createdAt: Date;
	updatedAt: Date;
}

@Injectable()
export class UsersService {
	private users: User[] = [];
	private nextId = 1;

	constructor(
		private readonly logger: NestLoggerService,
		@Inject(LOGGER_TOKEN) private readonly nodeLogger: Logger
	) {}

	create(createUserDto: CreateUserDto): Promise<User> {
		this.logger.log('Creating new user', 'UsersService');

		const user: User = {
			id: this.nextId.toString(),
			name: createUserDto.name,
			email: createUserDto.email,
			phone: createUserDto.phone,
			address: createUserDto.address,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.users.push(user);
		this.nextId++;

		// Log with sensitive data (will be redacted automatically)
		this.nodeLogger.info('User created successfully', {
			userId: user.id,
			userData: createUserDto,
		});

		return user;
	}

	findAll(): Promise<User[]> {
		this.logger.debug('Finding all users', 'UsersService');

		this.nodeLogger.debug('Users retrieved', {
			count: this.users.length,
		});

		return this.users;
	}

	findOne(id: string): Promise<User | null> {
		this.logger.debug(`Finding user with id: ${id}`, 'UsersService');

		const user = this.users.find((u) => u.id === id);

		if (!user) {
			this.logger.warn(`User not found with id: ${id}`, 'UsersService');
			this.nodeLogger.warn('User not found', { userId: id });
			return null;
		}

		this.nodeLogger.info('User found', { userId: id });
		return user;
	}

	update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
		this.logger.log(`Updating user with id: ${id}`, 'UsersService');

		const userIndex = this.users.findIndex((u) => u.id === id);

		if (userIndex === -1) {
			this.logger.warn(`User not found for update with id: ${id}`, 'UsersService');
			this.nodeLogger.warn('User not found for update', { userId: id });
			return null;
		}

		const updatedUser = {
			...this.users[userIndex],
			...updateUserDto,
			updatedAt: new Date(),
		};

		this.users[userIndex] = updatedUser;

		// Log with potentially sensitive data (will be redacted)
		this.nodeLogger.info('User updated successfully', {
			userId: id,
			updateData: updateUserDto,
		});

		return updatedUser;
	}

	remove(id: string): Promise<boolean> {
		this.logger.log(`Removing user with id: ${id}`, 'UsersService');

		const userIndex = this.users.findIndex((u) => u.id === id);

		if (userIndex === -1) {
			this.logger.warn(`User not found for removal with id: ${id}`, 'UsersService');
			this.nodeLogger.warn('User not found for removal', { userId: id });
			return false;
		}

		this.users.splice(userIndex, 1);

		this.nodeLogger.info('User removed successfully', { userId: id });
		return true;
	}
}
