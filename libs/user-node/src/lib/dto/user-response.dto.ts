export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.phone = user.phone;
    this.address = user.address;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
