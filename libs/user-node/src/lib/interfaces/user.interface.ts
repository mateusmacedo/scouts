export interface User {
        id: string;
        name: string;
        email: string;
        phone?: string;
        address?: string;
        createdAt: Date;
        updatedAt: Date;
}
