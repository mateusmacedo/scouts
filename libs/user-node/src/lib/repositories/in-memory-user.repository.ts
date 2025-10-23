import { UserEntity } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository.interface';

export class InMemoryUserRepository implements UserRepository {
        private readonly users = new Map<string, UserEntity>();

        async create(user: UserEntity): Promise<UserEntity> {
                if (this.users.has(user.id)) {
                        throw new Error(`Usuário com ID '${user.id}' já existe.`);
                }

                const clone = user.clone();
                this.users.set(clone.id, clone);

                return clone.clone();
        }

        async update(user: UserEntity): Promise<UserEntity> {
                if (!this.users.has(user.id)) {
                        throw new Error(`Usuário com ID '${user.id}' não encontrado.`);
                }

                const clone = user.clone();
                this.users.set(clone.id, clone);

                return clone.clone();
        }

        async delete(userId: string): Promise<void> {
                if (!this.users.delete(userId)) {
                        throw new Error(`Usuário com ID '${userId}' não encontrado.`);
                }
        }

        async findById(userId: string): Promise<UserEntity | null> {
                const user = this.users.get(userId);
                return user ? user.clone() : null;
        }

        async findByEmail(email: string): Promise<UserEntity | null> {
                for (const user of this.users.values()) {
                        if (user.email === email) {
                                return user.clone();
                        }
                }

                return null;
        }

        async findAll(): Promise<UserEntity[]> {
                return Array.from(this.users.values()).map((user) => user.clone());
        }
}
