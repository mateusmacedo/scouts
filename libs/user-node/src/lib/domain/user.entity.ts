export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, data: UpdateUserData): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

export interface UserEvents {
  onUserCreated(user: User): void;
  onUserUpdated(user: User): void;
  onUserDeleted(userId: string): void;
}
