import { InMemoryUserRepository } from './in-memory-user.repository';
import { CreateUserData, UpdateUserData } from '../domain/user.entity';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const userData: CreateUserData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
      };

      const result = await repository.create(userData);

      expect(result).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
      });
      expect(result.id).toBe('1');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should assign sequential IDs', async () => {
      const user1 = await repository.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const user2 = await repository.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      expect(user1.id).toBe('1');
      expect(user2.id).toBe('2');
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const createdUser = await repository.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const result = await repository.findById(createdUser.id);

      expect(result).toEqual(createdUser);
    });

    it('should return null when user not found', async () => {
      const result = await repository.findById('999');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const user1 = await repository.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const user2 = await repository.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(user1);
      expect(result).toContainEqual(user2);
    });

    it('should return empty array when no users exist', async () => {
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });

    it('should return a copy of the array', async () => {
      const user = await repository.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const result1 = await repository.findAll();
      const result2 = await repository.findAll();

      expect(result1).not.toBe(result2); // Different array instances
      expect(result1).toEqual(result2); // Same content
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const createdUser = await repository.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const updateData: UpdateUserData = {
        name: 'John Smith',
        phone: '+1234567890',
      };

      const result = await repository.update(createdUser.id, updateData);

      expect(result).toMatchObject({
        id: createdUser.id,
        name: 'John Smith',
        email: 'john@example.com', // unchanged
        phone: '+1234567890',
        address: undefined, // unchanged
      });
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(createdUser.updatedAt.getTime());
    });

    it('should return null when user not found', async () => {
      const updateData: UpdateUserData = {
        name: 'John Smith',
      };

      const result = await repository.update('999', updateData);
      expect(result).toBeNull();
    });

    it('should update only provided fields', async () => {
      const createdUser = await repository.create({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1111111111',
        address: '123 Main St',
      });

      const updateData: UpdateUserData = {
        name: 'John Smith',
        // phone and address not provided
      };

      const result = await repository.update(createdUser.id, updateData);

      expect(result.name).toBe('John Smith');
      expect(result.phone).toBe('+1111111111'); // unchanged
      expect(result.address).toBe('123 Main St'); // unchanged
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const createdUser = await repository.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const result = await repository.delete(createdUser.id);

      expect(result).toBe(true);
      expect(await repository.findById(createdUser.id)).toBeNull();
    });

    it('should return false when user not found', async () => {
      const result = await repository.delete('999');
      expect(result).toBe(false);
    });

    it('should remove user from findAll results', async () => {
      const user1 = await repository.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const user2 = await repository.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      await repository.delete(user1.id);

      const result = await repository.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(user2);
    });
  });

  describe('clear', () => {
    it('should clear all users and reset ID counter', async () => {
      await repository.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      repository.clear();

      expect(await repository.findAll()).toEqual([]);

      // Next user should have ID 1 again
      const newUser = await repository.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      expect(newUser.id).toBe('1');
    });
  });
});
