import type { UserEntity } from './user.entity';

export interface UserRepository {
        create(user: UserEntity): Promise<UserEntity>;
        update(user: UserEntity): Promise<UserEntity>;
        delete(userId: string): Promise<void>;
        findById(userId: string): Promise<UserEntity | null>;
        findByEmail(email: string): Promise<UserEntity | null>;
        findAll(): Promise<UserEntity[]>;
}
