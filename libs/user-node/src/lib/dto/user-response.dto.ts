import { IsEmail, IsISO8601, IsOptional, IsString } from 'class-validator';
import type { UserEntity } from '../domain/user.entity';

export class UserResponseDto {
        @IsString()
        readonly id: string;

        @IsString()
        readonly name: string;

        @IsEmail()
        readonly email: string;

        @IsOptional()
        @IsString()
        readonly phone?: string | null;

        @IsISO8601()
        readonly createdAt: string;

        @IsISO8601()
        readonly updatedAt: string;

        constructor(user: UserEntity) {
                this.id = user.id;
                this.name = user.name;
                this.email = user.email;
                this.phone = user.phone ?? null;
                this.createdAt = user.createdAt.toISOString();
                this.updatedAt = user.updatedAt.toISOString();
        }
}
