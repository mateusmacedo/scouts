import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '@scouts/logger-node';
import { LOGGER_TOKEN, NestLoggerService } from '@scouts/utils-nest';
import { CreateUserDto, UpdateUserDto, User, UserService } from '@scouts/user-node';

@Injectable()
export class UsersService {
        constructor(
                private readonly logger: NestLoggerService,
                @Inject(LOGGER_TOKEN) private readonly nodeLogger: Logger,
                private readonly userService: UserService
        ) {}

        async create(createUserDto: CreateUserDto): Promise<User> {
                this.logger.log('Creating new user', 'UsersService');

                const user = await this.userService.create(createUserDto);

                // Log with sensitive data (will be redacted automatically)
                this.nodeLogger.info('User created successfully', {
                        userId: user.id,
                        userData: createUserDto,
                });

                return user;
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

                const user = await this.userService.findOne(id);

                if (!user) {
                        this.logger.warn(`User not found with id: ${id}`, 'UsersService');
                        this.nodeLogger.warn('User not found', { userId: id });
                        return null;
                }

                this.nodeLogger.info('User found', { userId: id });
                return user;
        }

        async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
                this.logger.log(`Updating user with id: ${id}`, 'UsersService');

                const updatedUser = await this.userService.update(id, updateUserDto);

                if (!updatedUser) {
                        this.logger.warn(`User not found for update with id: ${id}`, 'UsersService');
                        this.nodeLogger.warn('User not found for update', { userId: id });
                        return null;
                }

                // Log with potentially sensitive data (will be redacted)
                this.nodeLogger.info('User updated successfully', {
                        userId: id,
                        updateData: updateUserDto,
                });

                return updatedUser;
        }

        async remove(id: string): Promise<boolean> {
                this.logger.log(`Removing user with id: ${id}`, 'UsersService');

                const removed = await this.userService.remove(id);

                if (!removed) {
                        this.logger.warn(`User not found for removal with id: ${id}`, 'UsersService');
                        this.nodeLogger.warn('User not found for removal', { userId: id });
                        return false;
                }

                this.nodeLogger.info('User removed successfully', { userId: id });
                return true;
        }
}
