'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type UserData = {
    id: string;
    email: string;
    username: string | null;
    role: string;
    createdAt: Date;
};

export async function getUsers(): Promise<UserData[]> {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return users;
    } catch (error) {
        console.error('Failed to fetch users:', error);
        throw new Error('Failed to fetch users');
    }
}

export async function deleteUser(userId: string): Promise<void> {
    try {
        await prisma.user.delete({
            where: {
                id: userId,
            },
        });
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw new Error('Failed to delete user');
    }
}
