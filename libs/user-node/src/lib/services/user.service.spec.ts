import { EventEmitter } from 'node:events';
import type { Logger } from '@scouts/logger-node';
import { InMemoryUserRepository } from '../repositories/in-memory-user.repository';
import { UserEntity } from '../domain/user.entity';
import { UserService, UserServiceError } from './user.service';

const createLoggerMock = (): jest.Mocked<Logger> => {
        const logger: Partial<jest.Mocked<Logger>> = {
                trace: jest.fn(),
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                fatal: jest.fn(),
                flush: jest.fn(),
                close: jest.fn(),
        };

        logger.withFields = jest.fn().mockReturnValue(logger as unknown as Logger);
        logger.withCorrelationId = jest.fn().mockReturnValue(logger as unknown as Logger);

        return logger as jest.Mocked<Logger>;
};

const createSequentialClock = () => {
        let counter = 0;
        return () => new Date(Date.UTC(2024, counter++, 1));
};

describe('UserService', () => {
        const setup = () => {
                const repository = new InMemoryUserRepository();
                const logger = createLoggerMock();
                let idCounter = 0;
                const service = new UserService(repository, logger, {
                        eventEmitter: new EventEmitter(),
                        clock: createSequentialClock(),
                        idFactory: () => `user-${++idCounter}`,
                });

                return { repository, logger, service };
        };

        beforeEach(() => {
                jest.clearAllMocks();
        });

        it('deve criar um usuário válido e emitir evento', async () => {
                const { service, logger, repository } = setup();
                const emitted: UserEntity[] = [];
                service.on('user.created', ({ user }) => emitted.push(user));

                const user = await service.createUser({
                        name: 'Usuário Teste',
                        email: 'teste@scouts.com',
                        phone: '+5511999999999',
                });

                expect(user.id).toBe('user-1');
                expect(user.email).toBe('teste@scouts.com');
                expect(emitted).toHaveLength(1);
                expect(emitted[0].id).toBe('user-1');

                const stored = await repository.findById(user.id);
                expect(stored?.email).toBe('teste@scouts.com');
                expect(logger.info).toHaveBeenCalledWith('Usuário criado com sucesso.', {
                        email: 'teste@scouts.com',
                        userId: 'user-1',
                });
        });

        it('deve rejeitar criação com e-mail inválido', async () => {
                const { service, logger } = setup();

                await expect(
                        service.createUser({ name: 'Usuário', email: 'invalido', phone: '+5511999999999' })
                ).rejects.toMatchObject<UserServiceError>({ code: 'INVALID_EMAIL' });

                expect(logger.warn).toHaveBeenCalledWith('E-mail inválido recebido.', {
                        email: 'invalido',
                });
        });

        it('deve rejeitar criação com telefone inválido', async () => {
                const { service, logger } = setup();

                await expect(
                        service.createUser({ name: 'Usuário', email: 'teste@scouts.com', phone: '123' })
                ).rejects.toMatchObject<UserServiceError>({ code: 'INVALID_PHONE' });

                expect(logger.warn).toHaveBeenCalledWith('Telefone inválido recebido.', {
                        phone: '123',
                });
        });

        it('deve rejeitar criação com e-mail duplicado', async () => {
                const { service } = setup();

                await service.createUser({
                        name: 'Usuário 1',
                        email: 'duplicado@scouts.com',
                        phone: '+5511999999999',
                });

                await expect(
                        service.createUser({
                                name: 'Usuário 2',
                                email: 'duplicado@scouts.com',
                        })
                ).rejects.toMatchObject<UserServiceError>({ code: 'EMAIL_ALREADY_EXISTS' });
        });

        it('deve atualizar usuário existente e emitir evento', async () => {
                const { service, logger } = setup();

                const created = await service.createUser({
                        name: 'Usuário 1',
                        email: 'usuario@scouts.com',
                        phone: '+5511999999999',
                });

                const emitted: UserEntity[] = [];
                service.on('user.updated', ({ user }) => emitted.push(user));

                const updated = await service.updateUser(created.id, {
                        name: 'Usuário Atualizado',
                        email: 'novo@scouts.com',
                });

                expect(updated.id).toBe(created.id);
                expect(updated.email).toBe('novo@scouts.com');
                expect(emitted).toHaveLength(1);
                expect(emitted[0].email).toBe('novo@scouts.com');
                expect(logger.info).toHaveBeenCalledWith('Usuário atualizado com sucesso.', {
                        userId: created.id,
                });
        });

        it('deve manter o e-mail original quando não há alteração', async () => {
                const { service } = setup();

                const created = await service.createUser({
                        name: 'Usuário',
                        email: 'mesmo@scouts.com',
                        phone: '+5511999999999',
                });

                const updated = await service.updateUser(created.id, {
                        name: 'Usuário Renomeado',
                        email: 'mesmo@scouts.com',
                });

                expect(updated.email).toBe('mesmo@scouts.com');
        });

        it('não deve permitir atualização com e-mail duplicado', async () => {
                const { service } = setup();

                const userA = await service.createUser({
                        name: 'Usuário A',
                        email: 'a@scouts.com',
                });
                await service.createUser({
                        name: 'Usuário B',
                        email: 'b@scouts.com',
                });

                await expect(
                        service.updateUser(userA.id, { email: 'b@scouts.com' })
                ).rejects.toMatchObject<UserServiceError>({ code: 'EMAIL_ALREADY_EXISTS' });
        });

        it('deve permitir remover o telefone durante atualização', async () => {
                const { service } = setup();

                const created = await service.createUser({
                        name: 'Usuário Telefone',
                        email: 'telefone@scouts.com',
                        phone: '+5511988887777',
                });

                const updated = await service.updateUser(created.id, { phone: null });

                expect(updated.phone).toBeNull();
        });

        it('deve rejeitar atualização sem payload', async () => {
                const { service } = setup();

                const created = await service.createUser({
                        name: 'Usuário Teste',
                        email: 'teste@scouts.com',
                });

                await expect(service.updateUser(created.id, {})).rejects.toMatchObject<UserServiceError>({
                        code: 'INVALID_UPDATE_PAYLOAD',
                });
        });

        it('deve rejeitar atualização de usuário inexistente', async () => {
                const { service } = setup();

                await expect(
                        service.updateUser('inexistente', { name: 'Novo Nome' })
                ).rejects.toMatchObject<UserServiceError>({ code: 'USER_NOT_FOUND' });
        });

        it('deve remover usuário e emitir evento', async () => {
                const { service, repository } = setup();

                const created = await service.createUser({
                        name: 'Usuário Removido',
                        email: 'remover@scouts.com',
                });

                const emitted: UserEntity[] = [];
                service.on('user.deleted', ({ user }) => emitted.push(user));

                await service.deleteUser(created.id);

                expect(emitted).toHaveLength(1);
                expect(emitted[0].id).toBe(created.id);
                await expect(repository.findById(created.id)).resolves.toBeNull();
        });

        it('deve rejeitar remoção de usuário inexistente', async () => {
                const { service } = setup();

                await expect(service.deleteUser('inexistente')).rejects.toMatchObject<UserServiceError>({
                        code: 'USER_NOT_FOUND',
                });
        });

        it('deve recuperar usuário por ID', async () => {
                const { service } = setup();

                const created = await service.createUser({
                        name: 'Usuário Consulta',
                        email: 'consulta@scouts.com',
                });

                const fetched = await service.getUserById(created.id);

                expect(fetched.id).toBe(created.id);
                expect(fetched).not.toBe(created);
        });

        it('deve lançar erro ao buscar usuário inexistente por ID', async () => {
                const { service } = setup();

                await expect(service.getUserById('inexistente')).rejects.toMatchObject<UserServiceError>({
                        code: 'USER_NOT_FOUND',
                });
        });

        it('deve buscar usuário por e-mail', async () => {
                const { service } = setup();

                const created = await service.createUser({
                        name: 'Usuário E-mail',
                        email: 'email@scouts.com',
                });

                const fetched = await service.findByEmail('email@scouts.com');

                expect(fetched?.id).toBe(created.id);
                expect(fetched).not.toBeNull();
        });

        it('deve retornar null quando e-mail não existe', async () => {
                const { service, logger } = setup();

                const result = await service.findByEmail('nao-existe@scouts.com');

                expect(result).toBeNull();
                expect(logger.debug).toHaveBeenCalledWith('Nenhum usuário encontrado na busca por e-mail.', {
                        email: 'nao-existe@scouts.com',
                });
        });

        it('deve listar usuários', async () => {
                const { service } = setup();

                await service.createUser({ name: 'Um', email: 'um@scouts.com' });
                await service.createUser({ name: 'Dois', email: 'dois@scouts.com' });

                const users = await service.listUsers();

                expect(users).toHaveLength(2);
                expect(users[0].id).toBe('user-1');
                expect(users[1].id).toBe('user-2');
        });

        it('deve gerenciar listeners com once e off', async () => {
                const repository = new InMemoryUserRepository();
                const logger = createLoggerMock();
                const service = new UserService(repository, logger);

                const onceListener = jest.fn();
                const persistentListener = jest.fn();

                service.once('user.created', onceListener);
                service.on('user.created', persistentListener);
                service.off('user.created', persistentListener);

                await service.createUser({ name: 'Listener', email: 'listener@scouts.com' });

                expect(onceListener).toHaveBeenCalledTimes(1);
                expect(persistentListener).not.toHaveBeenCalled();
        });
});
