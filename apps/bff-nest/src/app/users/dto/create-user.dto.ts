import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
	@IsString()
	@MinLength(2)
	name: string;

	@IsEmail()
	email: string;

	@IsString()
	@MinLength(6)
	password: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsString()
	address?: string;
}
