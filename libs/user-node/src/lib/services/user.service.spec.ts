import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserService } from './user.service';

describe('UserService', () => {
        let service: UserService;

        beforeEach(() => {
                service = new UserService();
        });

        it('should create users with incremental ids without exposing password', async () => {
                const createUserDto: CreateUserDto = {
                        name: 'John Doe',
                        email: 'john@example.com',
                        password: 'secret123',
                        phone: '123456789',
                        address: '123 Main St',
                };

                const createdUser = await service.create(createUserDto);

                expect(createdUser).toMatchObject({
                        id: '1',
                        name: 'John Doe',
                        email: 'john@example.com',
                        phone: '123456789',
                        address: '123 Main St',
                });
                expect(createdUser.createdAt).toBeInstanceOf(Date);
                expect(createdUser.updatedAt).toBeInstanceOf(Date);
                expect((createdUser as unknown as { password?: string }).password).toBeUndefined();

                const secondUser = await service.create({
                        name: 'Jane Doe',
                        email: 'jane@example.com',
                        password: 'secret123',
                });

                expect(secondUser.id).toBe('2');
        });

        it('should list all persisted users', async () => {
                const userOne = await service.create({
                        name: 'User One',
                        email: 'one@example.com',
                        password: 'secret123',
                });
                const userTwo = await service.create({
                        name: 'User Two',
                        email: 'two@example.com',
                        password: 'secret123',
                });

                const users = await service.findAll();

                expect(users).toEqual([userOne, userTwo]);
        });

        it('should return null when user is not found', async () => {
                const result = await service.findOne('999');

                expect(result).toBeNull();
        });

        it('should update an existing user and ignore password changes', async () => {
                const created = await service.create({
                        name: 'Update Test',
                        email: 'update@example.com',
                        password: 'secret123',
                });

                const updateUserDto: UpdateUserDto = {
                        name: 'Updated Name',
                        password: 'new-secret',
                };

                const updated = await service.update(created.id, updateUserDto);

                expect(updated).toMatchObject({
                        id: created.id,
                        name: 'Updated Name',
                        email: 'update@example.com',
                });
                expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
                expect((updated as unknown as { password?: string }).password).toBeUndefined();
        });

        it('should return null when updating a missing user', async () => {
                const updateUserDto: UpdateUserDto = {
                        name: 'Non existing',
                };

                const result = await service.update('999', updateUserDto);

                expect(result).toBeNull();
        });

        it('should remove existing users and report missing ones', async () => {
                const created = await service.create({
                        name: 'Remove Test',
                        email: 'remove@example.com',
                        password: 'secret123',
                });

                const removed = await service.remove(created.id);
                const missing = await service.remove('999');

                expect(removed).toBe(true);
                expect(missing).toBe(false);
                expect(await service.findOne(created.id)).toBeNull();
        });
});
