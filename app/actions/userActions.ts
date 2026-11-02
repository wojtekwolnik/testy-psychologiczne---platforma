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
        const { checkAuth } = await import('./authActions');
        const currentUser = await checkAuth();

        if (currentUser && currentUser.id === userId) {
            throw new Error('Nie możesz usunąć własnego konta.');
        }

        const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
        if (!userToDelete) {
            throw new Error('Nie znaleziono użytkownika.');
        }

        if (userToDelete.role === 'admin') {
            const adminCount = await prisma.user.count({ where: { role: 'admin' } });
            if (adminCount <= 1) {
                throw new Error('Nie możesz usunąć jedynego konta administratora na platformie.');
            }
        }

        await prisma.user.delete({
            where: {
                id: userId,
            },
        });
        revalidatePath('/admin/users');
    } catch (error: any) {
        console.error('Failed to delete user:', error);
        throw new Error(error.message || 'Failed to delete user');
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

export async function updateUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { checkAuth } = await import('./authActions');
        const currentUser = await checkAuth();

        if (!currentUser) {
            return { success: false, error: 'Brak autoryzacji.' };
        }

        if (currentUser.role !== 'admin' && currentUser.id !== userId) {
            return { success: false, error: 'Brak uprawnień do zmiany hasła tego użytkownika.' };
        }

        if (!newPassword || newPassword.length < 6) {
            return { success: false, error: 'Hasło musi mieć co najmniej 6 znaków.' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update password:', error);
        return { success: false, error: 'Nie udało się zmienić hasła.' };
    }
}

export async function updateUserDetails(
    userId: string,
    data: { username: string; email: string; role?: 'admin' | 'therapist'; password?: string }
): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
        const { checkAuth } = await import('./authActions');
        const currentUser = await checkAuth();

        if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== userId)) {
            return { success: false, error: 'Brak uprawnień.' };
        }

        const updateData: any = {
            username: data.username,
            email: data.email,
        };

        if (data.role && currentUser.role === 'admin') {
            updateData.role = data.role;
        }

        if (data.password && data.password.trim().length > 0) {
            if (data.password.length < 6) {
                return { success: false, error: 'Hasło musi mieć co najmniej 6 znaków.' };
            }
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, email: true, username: true, role: true, createdAt: true, twoFactorSecret: true },
        });

        revalidatePath('/admin/users');

        return {
            success: true,
            user: {
                id: updated.id,
                email: updated.email,
                username: updated.username || '',
                fullName: updated.username || '',
                role: updated.role as UserRole,
                createdAt: updated.createdAt.toISOString(),
                twoFactorSecret: updated.twoFactorSecret || undefined,
            },
        };
    } catch (error: any) {
        console.error('Failed to update user:', error);
        return { success: false, error: 'Nie udało się zapisać zmian (sprawdź, czy e-mail nie jest już zajęty).' };
    }
}
