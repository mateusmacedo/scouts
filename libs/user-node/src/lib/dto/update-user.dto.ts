import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const PHONE_E164_REGEX = /^\+?[1-9]\d{1,14}$/;

export class UpdateUserDto {
        @IsOptional()
        @IsString()
        @MinLength(2)
        @MaxLength(120)
        name?: string;

        @IsOptional()
        @IsEmail()
        email?: string;

        @IsOptional()
        @IsString()
        @Matches(PHONE_E164_REGEX, {
                message: 'phone must be a valid E.164 number',
        })
        phone?: string | null;
}
