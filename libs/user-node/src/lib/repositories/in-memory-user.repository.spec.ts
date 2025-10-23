import { UserEntity } from '../domain/user.entity';
import { InMemoryUserRepository } from './in-memory-user.repository';

describe('InMemoryUserRepository', () => {
        const createUser = (id: string, email: string, name = 'Usuário'): UserEntity =>
                UserEntity.create(
                        {
                                name,
                                email,
                                phone: '+5511999999999',
                        },
                        {
                                id,
                                now: new Date(Date.UTC(2024, 0, 1)),
                        }
                );

        it('deve criar e recuperar usuário', async () => {
                const repository = new InMemoryUserRepository();
                const user = createUser('user-1', 'user@scouts.com');

                const created = await repository.create(user);
                const stored = await repository.findById('user-1');

                expect(created).not.toBe(user);
                expect(stored).not.toBeNull();
                expect(stored?.email).toBe('user@scouts.com');
        });

        it('deve lançar erro ao criar usuário duplicado', async () => {
                const repository = new InMemoryUserRepository();
                const user = createUser('user-1', 'user@scouts.com');

                await repository.create(user);
                await expect(repository.create(user)).rejects.toThrow("Usuário com ID 'user-1' já existe.");
        });

        it('deve encontrar usuário por e-mail', async () => {
                const repository = new InMemoryUserRepository();
                const user = createUser('user-1', 'user@scouts.com');
                await repository.create(user);

                const found = await repository.findByEmail('user@scouts.com');
                expect(found?.id).toBe('user-1');
        });

        it('deve atualizar usuário existente', async () => {
                const repository = new InMemoryUserRepository();
                const user = createUser('user-1', 'user@scouts.com');
                await repository.create(user);

                const updatedEntity = user.update(
                        {
                                name: 'Usuário Atualizado',
                                email: 'novo@scouts.com',
                        },
                        new Date(Date.UTC(2024, 1, 1))
                );

                const updated = await repository.update(updatedEntity);
                const stored = await repository.findById('user-1');

                expect(updated.email).toBe('novo@scouts.com');
                expect(stored?.email).toBe('novo@scouts.com');
        });

        it('deve lançar erro ao atualizar usuário inexistente', async () => {
                const repository = new InMemoryUserRepository();
                const user = createUser('user-1', 'user@scouts.com');

                await expect(repository.update(user)).rejects.toThrow("Usuário com ID 'user-1' não encontrado.");
        });

        it('deve remover usuário', async () => {
                const repository = new InMemoryUserRepository();
                const user = createUser('user-1', 'user@scouts.com');
                await repository.create(user);

                await repository.delete('user-1');

                const stored = await repository.findById('user-1');
                expect(stored).toBeNull();
        });

        it('deve lançar erro ao remover usuário inexistente', async () => {
                const repository = new InMemoryUserRepository();

                await expect(repository.delete('user-1')).rejects.toThrow("Usuário com ID 'user-1' não encontrado.");
        });

        it('deve listar usuários sem expor instâncias internas', async () => {
                const repository = new InMemoryUserRepository();
                const user = createUser('user-1', 'user@scouts.com');
                await repository.create(user);

                const [listed] = await repository.findAll();
                const stored = await repository.findById('user-1');

                expect(listed).not.toBeUndefined();
                expect(listed.id).toBe('user-1');
                expect(listed).not.toBe(stored);
        });
});
