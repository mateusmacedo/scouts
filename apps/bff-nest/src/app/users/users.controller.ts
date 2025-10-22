import { Controller, Get, Post, Body, Patch, Param, Delete, Inject } from '@nestjs/common';
import { Log, LogInfo, LogDebug, LogWarn } from '@scouts/logger-node';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NestLoggerService, LOGGER_TOKEN } from '@scouts/utils-nest';
import type { Logger } from '@scouts/logger-node';

@Controller('users')
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly logger: NestLoggerService,
		@Inject(LOGGER_TOKEN) private readonly nodeLogger: Logger
	) {}

	@Post()
	@Log({ level: 'info', includeArgs: true, includeResult: true })
	async create(@Body() createUserDto: CreateUserDto) {
		// password field will be automatically redacted in logs
		this.logger.log('Creating user via POST /users', 'UsersController');
		return this.usersService.create(createUserDto);
	}

	@Get()
	@LogInfo({ includeResult: true })
	async findAll() {
		this.logger.debug('Finding all users via GET /users', 'UsersController');
		return this.usersService.findAll();
	}

	@Get(':id')
	@LogDebug({ includeArgs: true, includeResult: true })
	async findOne(@Param('id') id: string) {
		this.logger.debug(`Finding user with id: ${id}`, 'UsersController');
		return this.usersService.findOne(id);
	}

	@Patch(':id')
	@Log({ level: 'info', includeArgs: true, includeResult: true })
	async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
		this.logger.log(`Updating user with id: ${id}`, 'UsersController');
		return this.usersService.update(id, updateUserDto);
	}

	@Delete(':id')
	@LogWarn({ includeArgs: true, includeResult: true })
	async remove(@Param('id') id: string) {
		this.logger.log(`Removing user with id: ${id}`, 'UsersController');
		return this.usersService.remove(id);
	}

	@Post(':id/activate')
	@LogInfo({ includeArgs: true, includeResult: true })
	async activate(@Param('id') id: string) {
		this.logger.log(`Activating user with id: ${id}`, 'UsersController');

		// Simulate activation logic
		const user = await this.usersService.findOne(id);
		if (!user) {
			this.nodeLogger.error('User not found for activation', { userId: id });
			return { success: false, message: 'User not found' };
		}

		this.nodeLogger.info('User activated successfully', { userId: id });
		return { success: true, message: 'User activated successfully' };
	}

	@Post(':id/deactivate')
	@LogWarn({ includeArgs: true, includeResult: true })
	async deactivate(@Param('id') id: string) {
		this.logger.log(`Deactivating user with id: ${id}`, 'UsersController');

		// Simulate deactivation logic
		const user = await this.usersService.findOne(id);
		if (!user) {
			this.nodeLogger.error('User not found for deactivation', { userId: id });
			return { success: false, message: 'User not found' };
		}

		this.nodeLogger.warn('User deactivated successfully', { userId: id });
		return { success: true, message: 'User deactivated successfully' };
	}
}
