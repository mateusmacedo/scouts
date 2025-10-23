import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../interfaces/user.interface';

@Injectable()
export class UserService {
        private users = new Map<string, User>();
        private nextId = 1;

        async create(createUserDto: CreateUserDto): Promise<User> {
                const { password: _password, ...userData } = createUserDto;
                const timestamp = new Date();
                const user: User = {
                        id: String(this.nextId++),
                        ...userData,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                };

                this.users.set(user.id, user);

                return user;
        }

        async findAll(): Promise<User[]> {
                return Array.from(this.users.values());
        }

        async findOne(id: string): Promise<User | null> {
                return this.users.get(id) ?? null;
        }

        async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
                const existingUser = this.users.get(id);

                if (!existingUser) {
                        return null;
                }

                const { password: _password, ...updateData } = updateUserDto;
                const updatedUser: User = {
                        ...existingUser,
                        ...updateData,
                        updatedAt: new Date(),
                };

                this.users.set(id, updatedUser);

                return updatedUser;
        }

        async remove(id: string): Promise<boolean> {
                if (!this.users.has(id)) {
                        return false;
                }

                this.users.delete(id);
                return true;
        }
}
