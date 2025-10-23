import { EventEmitter } from 'node:events';
import { isEmail, isMobilePhone } from 'class-validator';
import type { Logger } from '@scouts/logger-node';
import { UserEntity, type CreateUserData, type UpdateUserData } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository.interface';

export type UserServiceEventMap = {
        'user.created': { user: UserEntity };
        'user.updated': { user: UserEntity };
        'user.deleted': { user: UserEntity };
};

export type UserServiceEvent = keyof UserServiceEventMap;

export type UserServiceErrorCode =
        | 'INVALID_EMAIL'
        | 'INVALID_PHONE'
        | 'EMAIL_ALREADY_EXISTS'
        | 'USER_NOT_FOUND'
        | 'INVALID_UPDATE_PAYLOAD';

const ERROR_MESSAGES: Record<UserServiceErrorCode, string> = {
        INVALID_EMAIL: 'E-mail inválido fornecido.',
        INVALID_PHONE: 'Telefone inválido fornecido.',
        EMAIL_ALREADY_EXISTS: 'E-mail já cadastrado para outro usuário.',
        USER_NOT_FOUND: 'Usuário não encontrado.',
        INVALID_UPDATE_PAYLOAD: 'Dados para atualização são obrigatórios.',
};

export class UserServiceError extends Error {
        constructor(readonly code: UserServiceErrorCode, message?: string) {
                super(message ?? ERROR_MESSAGES[code]);
                Object.setPrototypeOf(this, new.target.prototype);
                this.name = 'UserServiceError';
        }
}

export interface UserServiceOptions {
        readonly eventEmitter?: EventEmitter;
        readonly clock?: () => Date;
        readonly idFactory?: () => string | undefined;
}

export class UserService {
        private readonly emitter: EventEmitter;
        private readonly clock: () => Date;
        private readonly idFactory?: () => string | undefined;

        constructor(
                private readonly repository: UserRepository,
                private readonly logger: Logger,
                options: UserServiceOptions = {}
        ) {
                this.emitter = options.eventEmitter ?? new EventEmitter();
                this.clock = options.clock ?? (() => new Date());
                this.idFactory = options.idFactory;
        }

        on<E extends UserServiceEvent>(event: E, listener: (payload: UserServiceEventMap[E]) => void): this {
                this.emitter.on(event, listener as (...args: unknown[]) => void);
                return this;
        }

        off<E extends UserServiceEvent>(event: E, listener: (payload: UserServiceEventMap[E]) => void): this {
                this.emitter.off(event, listener as (...args: unknown[]) => void);
                return this;
        }

        once<E extends UserServiceEvent>(event: E, listener: (payload: UserServiceEventMap[E]) => void): this {
                this.emitter.once(event, listener as (...args: unknown[]) => void);
                return this;
        }

        async createUser(data: CreateUserData): Promise<UserEntity> {
                this.validateEmail(data.email);
                this.validatePhone(data.phone);

                const existingByEmail = await this.repository.findByEmail(data.email.trim());
                if (existingByEmail) {
                        this.logger.warn('Tentativa de criação com e-mail duplicado.', {
                                email: data.email,
                        });
                        throw new UserServiceError('EMAIL_ALREADY_EXISTS');
                }

                const createdAt = this.clock();
                const user = UserEntity.create(data, {
                        id: this.idFactory?.(),
                        now: createdAt,
                });

                const persisted = await this.repository.create(user);

                this.logger.info('Usuário criado com sucesso.', {
                        userId: persisted.id,
                        email: persisted.email,
                });

                this.emit('user.created', { user: persisted });

                return persisted.clone();
        }

        async updateUser(userId: string, data: UpdateUserData): Promise<UserEntity> {
                if (!data || Object.keys(data).length === 0) {
                        this.logger.warn('Payload de atualização vazio recebido.', { userId });
                        throw new UserServiceError('INVALID_UPDATE_PAYLOAD');
                }

                if (data.email !== undefined) {
                        this.validateEmail(data.email);
                }

                if (data.phone !== undefined) {
                        this.validatePhone(data.phone);
                }

                const existing = await this.repository.findById(userId);
                if (!existing) {
                        this.logger.warn('Usuário não encontrado para atualização.', { userId });
                        throw new UserServiceError('USER_NOT_FOUND');
                }

                if (data.email && data.email.trim() !== existing.email) {
                        const userWithEmail = await this.repository.findByEmail(data.email.trim());
                        if (userWithEmail && userWithEmail.id !== userId) {
                                this.logger.warn('Tentativa de atualização com e-mail duplicado.', {
                                        userId,
                                        email: data.email,
                                });
                                throw new UserServiceError('EMAIL_ALREADY_EXISTS');
                        }
                }

                const updated = existing.update(data, this.clock());
                const persisted = await this.repository.update(updated);

                this.logger.info('Usuário atualizado com sucesso.', {
                        userId: persisted.id,
                });

                this.emit('user.updated', { user: persisted });

                return persisted.clone();
        }

        async deleteUser(userId: string): Promise<void> {
                const existing = await this.repository.findById(userId);
                if (!existing) {
                        this.logger.warn('Usuário não encontrado para exclusão.', { userId });
                        throw new UserServiceError('USER_NOT_FOUND');
                }

                await this.repository.delete(userId);

                this.logger.info('Usuário removido com sucesso.', { userId });

                this.emit('user.deleted', { user: existing });
        }

        async getUserById(userId: string): Promise<UserEntity> {
                const user = await this.repository.findById(userId);

                if (!user) {
                        this.logger.warn('Usuário não encontrado na consulta por ID.', { userId });
                        throw new UserServiceError('USER_NOT_FOUND');
                }

                this.logger.debug('Usuário recuperado por ID.', { userId });

                return user.clone();
        }

        async findByEmail(email: string): Promise<UserEntity | null> {
                const user = await this.repository.findByEmail(email.trim());

                if (!user) {
                        this.logger.debug('Nenhum usuário encontrado na busca por e-mail.', { email });
                        return null;
                }

                this.logger.debug('Usuário recuperado por e-mail.', { email });

                return user.clone();
        }

        async listUsers(): Promise<UserEntity[]> {
                const users = await this.repository.findAll();
                this.logger.debug('Listagem de usuários recuperada.', { total: users.length });
                return users.map((user) => user.clone());
        }

        private emit<E extends UserServiceEvent>(event: E, payload: UserServiceEventMap[E]): void {
                this.emitter.emit(event, payload);
        }

        private validateEmail(email: string): void {
                const trimmed = email.trim();
                if (!isEmail(trimmed)) {
                        this.logger.warn('E-mail inválido recebido.', { email });
                        throw new UserServiceError('INVALID_EMAIL');
                }
        }

        private validatePhone(phone?: string | null): void {
                if (phone === undefined || phone === null) {
                        return;
                }

                const normalized = phone.trim();
                if (!isMobilePhone(normalized, 'any')) {
                        this.logger.warn('Telefone inválido recebido.', { phone });
                        throw new UserServiceError('INVALID_PHONE');
                }
        }
}
