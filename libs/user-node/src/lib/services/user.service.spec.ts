import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { InMemoryUserRepository } from '../repositories/in-memory-user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRepository, UserEvents } from '../domain/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repository: InMemoryUserRepository;
  let userEvents: jest.Mocked<UserEvents>;

  beforeEach(async () => {
    userEvents = {
      onUserCreated: jest.fn(),
      onUserUpdated: jest.fn(),
      onUserDeleted: jest.fn(),
    };

    repository = new InMemoryUserRepository();
    service = new UserService(repository, userEvents);
    
    // Clear repository before each test
    repository.clear();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
      };

      const result = await service.create(createUserDto);

      expect(result).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(userEvents.onUserCreated).toHaveBeenCalledWith(result);
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      // Create first user
      await service.create(createUserDto);

      // Try to create second user with same email
      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const user1 = await service.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const user2 = await service.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(user1);
      expect(result).toContainEqual(user2);
    });

    it('should return empty array when no users exist', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const createdUser = await service.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const result = await service.findById(createdUser.id);

      expect(result).toEqual(createdUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const createdUser = await service.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const result = await service.findByEmail('john@example.com');

      expect(result).toEqual(createdUser);
    });

    it('should return null when user not found by email', async () => {
      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const createdUser = await service.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const updateUserDto: UpdateUserDto = {
        name: 'John Smith',
        phone: '+1234567890',
      };

      const result = await service.update(createdUser.id, updateUserDto);

      expect(result.name).toBe('John Smith');
      expect(result.phone).toBe('+1234567890');
      expect(result.email).toBe('john@example.com'); // unchanged
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(createdUser.updatedAt.getTime());
      expect(userEvents.onUserUpdated).toHaveBeenCalledWith(result);
    });

    it('should throw NotFoundException when user not found', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'John Smith',
      };

      await expect(service.update('999', updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists', async () => {
      const user1 = await service.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const user2 = await service.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      const updateUserDto: UpdateUserDto = {
        email: 'jane@example.com', // Try to use existing email
      };

      await expect(service.update(user1.id, updateUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const createdUser = await service.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      await service.delete(createdUser.id);

      await expect(service.findById(createdUser.id)).rejects.toThrow(NotFoundException);
      expect(userEvents.onUserDeleted).toHaveBeenCalledWith(createdUser.id);
    });

    it('should throw NotFoundException when user not found', async () => {
      await expect(service.delete('999')).rejects.toThrow(NotFoundException);
    });
  });
});
