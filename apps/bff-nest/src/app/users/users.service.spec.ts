import { Test, TestingModule } from '@nestjs/testing';
import type { Logger } from '@scouts/logger-node';
import { CreateUserDto, UpdateUserDto, User, UserService } from '@scouts/user-node';
import { LOGGER_TOKEN, LoggerModule, NestLoggerService } from '@scouts/utils-nest';
import { UsersService } from './users.service';

describe('UsersService', () => {
        let service: UsersService;
        let userService: jest.Mocked<UserService>;
        let nodeLogger: jest.Mocked<Logger>;
        let nestLogger: NestLoggerService;

        beforeEach(async () => {
                userService = {
                        create: jest.fn(),
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                        remove: jest.fn(),
                } as unknown as jest.Mocked<UserService>;

                const module: TestingModule = await Test.createTestingModule({
                        imports: [LoggerModule.forRoot()],
                        providers: [
                                UsersService,
                                {
                                        provide: UserService,
                                        useValue: userService,
                                },
                        ],
                }).compile();

                service = module.get<UsersService>(UsersService);
                nodeLogger = module.get(LOGGER_TOKEN) as jest.Mocked<Logger>;
                nestLogger = module.get(NestLoggerService);

                jest.spyOn(nestLogger, 'log').mockImplementation(() => undefined);
                jest.spyOn(nestLogger, 'debug').mockImplementation(() => undefined);
                jest.spyOn(nestLogger, 'warn').mockImplementation(() => undefined);

                jest.spyOn(nodeLogger, 'info').mockImplementation(() => undefined);
                jest.spyOn(nodeLogger, 'warn').mockImplementation(() => undefined);
                jest.spyOn(nodeLogger, 'debug').mockImplementation(() => undefined);
        });

        afterEach(() => {
                jest.clearAllMocks();
        });

        it('should be defined', () => {
                expect(service).toBeDefined();
        });

        it('should create a user using the domain service and log the operation', async () => {
                const createUserDto: CreateUserDto = {
                        name: 'John Doe',
                        email: 'john@example.com',
                        password: 'password123',
                };
                const createdUser: User = {
                        id: '1',
                        name: 'John Doe',
                        email: 'john@example.com',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                };
                userService.create.mockResolvedValue(createdUser);

                const result = await service.create(createUserDto);

                expect(userService.create).toHaveBeenCalledWith(createUserDto);
                expect(result).toBe(createdUser);
                expect(nestLogger.log).toHaveBeenCalledWith('Creating new user', 'UsersService');
                expect(nodeLogger.info).toHaveBeenCalledWith('User created successfully', {
                        userId: createdUser.id,
                        userData: createUserDto,
                });
        });

        it('should list users using the domain service and log the count', async () => {
                const users: User[] = [
                        {
                                id: '1',
                                name: 'User 1',
                                email: 'user1@example.com',
                                createdAt: new Date(),
                                updatedAt: new Date(),
                        },
                        {
                                id: '2',
                                name: 'User 2',
                                email: 'user2@example.com',
                                createdAt: new Date(),
                                updatedAt: new Date(),
                        },
                ];
                userService.findAll.mockResolvedValue(users);

                const result = await service.findAll();

                expect(userService.findAll).toHaveBeenCalled();
                expect(result).toEqual(users);
                expect(nestLogger.debug).toHaveBeenCalledWith('Finding all users', 'UsersService');
                expect(nodeLogger.debug).toHaveBeenCalledWith('Users retrieved', { count: users.length });
        });

        it('should return a user when found and log success', async () => {
                const user: User = {
                        id: '1',
                        name: 'John Doe',
                        email: 'john@example.com',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                };
                userService.findOne.mockResolvedValue(user);

                const result = await service.findOne('1');

                expect(userService.findOne).toHaveBeenCalledWith('1');
                expect(result).toBe(user);
                expect(nodeLogger.info).toHaveBeenCalledWith('User found', { userId: '1' });
        });

        it('should log a warning when user is not found', async () => {
                userService.findOne.mockResolvedValue(null);

                const result = await service.findOne('999');

                expect(userService.findOne).toHaveBeenCalledWith('999');
                expect(result).toBeNull();
                expect(nestLogger.warn).toHaveBeenCalledWith('User not found with id: 999', 'UsersService');
                expect(nodeLogger.warn).toHaveBeenCalledWith('User not found', { userId: '999' });
        });

        it('should update user data when domain service succeeds', async () => {
                const updateDto: UpdateUserDto = {
                        name: 'Updated Name',
                };
                const updatedUser: User = {
                        id: '1',
                        name: 'Updated Name',
                        email: 'john@example.com',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                };
                userService.update.mockResolvedValue(updatedUser);

                const result = await service.update('1', updateDto);

                expect(userService.update).toHaveBeenCalledWith('1', updateDto);
                expect(result).toBe(updatedUser);
                expect(nodeLogger.info).toHaveBeenCalledWith('User updated successfully', {
                        userId: '1',
                        updateData: updateDto,
                });
        });

        it('should warn when trying to update a missing user', async () => {
                const updateDto: UpdateUserDto = {
                        name: 'Missing User',
                };
                userService.update.mockResolvedValue(null);

                const result = await service.update('999', updateDto);

                expect(userService.update).toHaveBeenCalledWith('999', updateDto);
                expect(result).toBeNull();
                expect(nodeLogger.warn).toHaveBeenCalledWith('User not found for update', { userId: '999' });
        });

        it('should remove a user and log success when domain service succeeds', async () => {
                userService.remove.mockResolvedValue(true);

                const result = await service.remove('1');

                expect(userService.remove).toHaveBeenCalledWith('1');
                expect(result).toBe(true);
                expect(nodeLogger.info).toHaveBeenCalledWith('User removed successfully', { userId: '1' });
        });

        it('should warn when trying to remove a missing user', async () => {
                userService.remove.mockResolvedValue(false);

                const result = await service.remove('999');

                expect(userService.remove).toHaveBeenCalledWith('999');
                expect(result).toBe(false);
                expect(nodeLogger.warn).toHaveBeenCalledWith('User not found for removal', { userId: '999' });
        });
});
