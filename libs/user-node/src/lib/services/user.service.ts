import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
	CreateUserData,
	UpdateUserData,
	User,
	UserEvents,
	UserRepository,
} from '../domain/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly userEvents?: UserEvents
	) {}

	async create(createUserDto: CreateUserDto): Promise<User> {
		// Verificar se email já existe
		const existingUser = await this.findByEmail(createUserDto.email);
		if (existingUser) {
			throw new ConflictException('User with this email already exists');
		}

		const userData: CreateUserData = {
			name: createUserDto.name,
			email: createUserDto.email,
			phone: createUserDto.phone,
			address: createUserDto.address,
		};

		const user = await this.userRepository.create(userData);

		// Emitir evento de usuário criado
		this.userEvents?.onUserCreated(user);

		return user;
	}

	findAll(): Promise<User[]> {
		return this.userRepository.findAll();
	}

	async findById(id: string): Promise<User> {
		const user = await this.userRepository.findById(id);

		if (!user) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}

		return user;
	}

	async findByEmail(email: string): Promise<User | null> {
		const users = await this.userRepository.findAll();
		return users.find((user) => user.email === email) || null;
	}

	async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
		// Verificar se usuário existe
		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}

		// Se email está sendo atualizado, verificar se não conflita
		if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
			const emailExists = await this.findByEmail(updateUserDto.email);
			if (emailExists) {
				throw new ConflictException('User with this email already exists');
			}
		}

		const updateData: UpdateUserData = {};

		if (updateUserDto.name !== undefined) {
			updateData.name = updateUserDto.name;
		}
		if (updateUserDto.email !== undefined) {
			updateData.email = updateUserDto.email;
		}
		if (updateUserDto.phone !== undefined) {
			updateData.phone = updateUserDto.phone;
		}
		if (updateUserDto.address !== undefined) {
			updateData.address = updateUserDto.address;
		}

		const updatedUser = await this.userRepository.update(id, updateData);

		if (!updatedUser) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}

		// Emitir evento de usuário atualizado
		this.userEvents?.onUserUpdated(updatedUser);

		return updatedUser;
	}

	async delete(id: string): Promise<void> {
		const user = await this.userRepository.findById(id);
		if (!user) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}

		const deleted = await this.userRepository.delete(id);
		if (!deleted) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}

		// Emitir evento de usuário deletado
		this.userEvents?.onUserDeleted(id);
	}
}
