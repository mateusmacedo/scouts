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

		return user;
	}

	async findById(id: string): Promise<User | null> {
		return this.users.find((user) => user.id === id) || null;
	}

	async findAll(): Promise<User[]> {
		return [...this.users];
	}

	async update(id: string, data: UpdateUserData): Promise<User | null> {
		const userIndex = this.users.findIndex((user) => user.id === id);

		if (userIndex === -1) {
			return null;
		}

		const updatedUser = {
			...this.users[userIndex],
			...data,
			updatedAt: new Date(),
		};

		this.users[userIndex] = updatedUser;
		return updatedUser;
	}

	async delete(id: string): Promise<boolean> {
		const userIndex = this.users.findIndex((user) => user.id === id);

		if (userIndex === -1) {
			return false;
		}

		this.users.splice(userIndex, 1);
		return true;
	}

	// Método auxiliar para testes
	clear(): void {
		this.users = [];
		this.nextId = 1;
	}
}
