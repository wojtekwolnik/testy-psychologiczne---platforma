'use server';

import { prisma } from '@/lib/prisma';
import type { User } from '@/components/types';
import { UserRole } from '@/components/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

// Backwards-compatible type alias for consumers that still reference UserData
export type UserData = User;

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

export async function saveUser(user: Partial<User>, hashedPassword?: string): Promise<User> {
    try {
        const dataToSave = {
            email: user.email!,
            username: user.fullName || user.username || '',
            role: user.role || 'therapist',
        };

        let savedUser;
        if (user.id) {
            // Update — never touch the password unless explicitly provided
            savedUser = await prisma.user.update({
                where: { id: user.id },
                data: dataToSave,
                select: { id: true, email: true, username: true, role: true, createdAt: true, twoFactorSecret: true },
            });
        } else {
            // Create — require a hashed password
            if (!hashedPassword) throw new Error('Password is required when creating a new user');
            savedUser = await prisma.user.create({
                data: { ...dataToSave, password: hashedPassword },
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

// Backwards-compatible aliases
export const getUsers = getAllUsers;

export async function createUser(data: { email: string; username: string; password: string; role: 'admin' | 'therapist' }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return saveUser({
        email: data.email,
        fullName: data.username,
        username: data.username,
        role: data.role as UserRole,
    }, hashedPassword);
}
