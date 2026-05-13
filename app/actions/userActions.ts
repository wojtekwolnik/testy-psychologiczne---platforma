'use server';

import { prisma } from '@/lib/prisma';
import type { User } from '@/components/types';
import { UserRole } from '@/components/types';
import { revalidatePath } from 'next/cache';

export async function getAllUsers(): Promise<User[]> {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                createdAt: true,
                twoFactorSecret: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return users.map(user => ({
            id: user.id,
            email: user.email,
            username: user.username || '',
            fullName: user.username || '',
            role: user.role as UserRole,
            createdAt: user.createdAt.toISOString(),
            twoFactorSecret: user.twoFactorSecret || undefined,
        }));
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
        revalidatePath('/admin/users');
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw new Error('Failed to delete user');
    }
}

export async function saveUser(user: Partial<User>): Promise<User> {
    try {
        const dataToSave = {
            email: user.email!,
            username: user.fullName || user.username || '',
            role: user.role || 'therapist',
            // if new user, password can be set to something default or sent via email. 
            // For now, we'll leave password alone on update, or set a dummy on create
        };

        let savedUser;
        if (user.id) {
            // Update
            savedUser = await prisma.user.update({
                where: { id: user.id },
                data: dataToSave,
                select: { id: true, email: true, username: true, role: true, createdAt: true, twoFactorSecret: true },
            });
        } else {
            // Create
            savedUser = await prisma.user.create({
                data: {
                    ...dataToSave,
                    password: 'password123', // Dummy password for newly created users via admin panel
                },
                select: { id: true, email: true, username: true, role: true, createdAt: true, twoFactorSecret: true },
            });
        }
        
        revalidatePath('/admin/users');

        return {
            id: savedUser.id,
            email: savedUser.email,
            username: savedUser.username || '',
            fullName: savedUser.username || '',
            role: savedUser.role as UserRole,
            createdAt: savedUser.createdAt.toISOString(),
            twoFactorSecret: savedUser.twoFactorSecret || undefined,
        };
    } catch (error) {
        console.error('Failed to save user:', error);
        throw new Error('Failed to save user');
    }
}
