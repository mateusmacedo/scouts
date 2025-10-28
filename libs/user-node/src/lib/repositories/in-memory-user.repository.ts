import { Injectable } from '@nestjs/common';
import { CreateUserData, UpdateUserData, User, UserRepository } from '../domain/user.entity';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
	private users: User[] = [];
	private nextId = 1;

	async create(data: CreateUserData): Promise<User> {
		const user: User = {
			id: this.nextId.toString(),
			name: data.name,
			email: data.email,
			phone: data.phone,
			address: data.address,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.users.push(user);
		this.nextId++;

		return await Promise.resolve(user);
	}

	async findById(id: string): Promise<User | null> {
		return await Promise.resolve(this.users.find((user) => user.id === id) || null);
	}

	async findAll(): Promise<User[]> {
		return await Promise.resolve([...this.users]);
	}

	async update(id: string, data: UpdateUserData): Promise<User | null> {
		const userIndex = this.users.findIndex((user) => user.id === id);

		if (userIndex === -1) {
			return await Promise.resolve(null);
		}

		const updatedUser = {
			...this.users[userIndex],
			...data,
			updatedAt: new Date(),
		};

		this.users[userIndex] = updatedUser;
		return await Promise.resolve(updatedUser);
	}

	async delete(id: string): Promise<boolean> {
		const userIndex = this.users.findIndex((user) => user.id === id);

		if (userIndex === -1) {
			return await Promise.resolve(false);
		}

		this.users.splice(userIndex, 1);
		return await Promise.resolve(true);
	}

	// Método auxiliar para testes
	clear(): void {
		this.users = [];
		this.nextId = 1;
	}
}
