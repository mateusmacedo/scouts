import { randomUUID } from 'node:crypto';

export interface UserProps {
        readonly id: string;
        readonly name: string;
        readonly email: string;
        readonly phone?: string | null;
        readonly createdAt: Date;
        readonly updatedAt: Date;
}

export type CreateUserData = {
        readonly name: string;
        readonly email: string;
        readonly phone?: string | null;
};

export type UpdateUserData = {
        readonly name?: string;
        readonly email?: string;
        readonly phone?: string | null;
};

function sanitizeName(name: string): string {
        return name.trim().replace(/\s+/g, ' ');
}

function normalizePhone(phone?: string | null): string | null | undefined {
        if (phone === undefined) {
                return undefined;
        }

        if (phone === null) {
                return null;
        }

        return phone.trim();
}

export class UserEntity {
        private constructor(private readonly props: UserProps) {}

        static create(data: CreateUserData, options?: { id?: string; now?: Date }): UserEntity {
                const now = options?.now ?? new Date();
                const id = options?.id ?? randomUUID();

                return new UserEntity({
                        id,
                        name: sanitizeName(data.name),
                        email: data.email.trim(),
                        phone: normalizePhone(data.phone) ?? null,
                        createdAt: now,
                        updatedAt: now,
                });
        }

        static restore(props: UserProps): UserEntity {
                return new UserEntity({
                        ...props,
                        name: sanitizeName(props.name),
                        email: props.email.trim(),
                        phone: normalizePhone(props.phone) ?? null,
                        createdAt: new Date(props.createdAt),
                        updatedAt: new Date(props.updatedAt),
                });
        }

        update(data: UpdateUserData, updatedAt: Date = new Date()): UserEntity {
                return new UserEntity({
                        id: this.props.id,
                        name: sanitizeName(data.name ?? this.props.name),
                        email: (data.email ?? this.props.email).trim(),
                        phone: normalizePhone(
                                data.phone !== undefined ? data.phone : this.props.phone ?? null
                        ) ?? null,
                        createdAt: this.props.createdAt,
                        updatedAt,
                });
        }

        toJSON(): UserProps {
                return {
                        id: this.props.id,
                        name: this.props.name,
                        email: this.props.email,
                        phone: this.props.phone ?? null,
                        createdAt: new Date(this.props.createdAt),
                        updatedAt: new Date(this.props.updatedAt),
                };
        }

        clone(): UserEntity {
                return UserEntity.restore(this.toJSON());
        }

        get id(): string {
                return this.props.id;
        }

        get name(): string {
                return this.props.name;
        }

        get email(): string {
                return this.props.email;
        }

        get phone(): string | null | undefined {
                return this.props.phone ?? null;
        }

        get createdAt(): Date {
                return new Date(this.props.createdAt);
        }

        get updatedAt(): Date {
                return new Date(this.props.updatedAt);
        }
}
