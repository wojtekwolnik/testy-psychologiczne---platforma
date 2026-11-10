'use server';

import { prisma } from '@/lib/prisma';
import type { User } from '@/components/types';
import { UserRole } from '@/components/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { checkAuth, requireAuth } from './authActions';

// Backwards-compatible type alias for consumers that still reference UserData
export type UserData = User & {
    activeCodesCount?: number;
    resultsCount?: number;
};

export async function getAllUsers(): Promise<UserData[]> {
    await requireAuth('admin');
    try {
        const now = new Date();
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                createdAt: true,
                twoFactorSecret: true,
                _count: {
                    select: {
                        accessCodes: {
                            where: { isUsed: false, expiresAt: { gt: now } }
                        },
                        results: true,
                    }
                }
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
            // Never expose raw TOTP secret to client
            twoFactorSecret: user.twoFactorSecret ? 'enabled' : undefined,
            activeCodesCount: user._count.accessCodes,
            resultsCount: user._count.results,
        }));
    } catch (error) {
        console.error('Failed to fetch users:', error);
        throw new Error('Failed to fetch users');
    }
}

export async function deleteUser(userId: string, transferToUserId?: string): Promise<void> {
    const currentUser = await requireAuth('admin');
    try {
        if (currentUser.id === userId) {
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

        if (transferToUserId) {
            if (transferToUserId === userId) {
                throw new Error('Nie można przekazać kodów usuwanemu użytkownikowi.');
            }
            const targetUser = await prisma.user.findUnique({ where: { id: transferToUserId } });
            if (!targetUser) {
                throw new Error('Wybrany użytkownik docelowy nie istnieje.');
            }
        }

        await prisma.$transaction(async (tx) => {
            if (transferToUserId) {
                await tx.accessCode.updateMany({
                    where: { therapistId: userId },
                    data: { therapistId: transferToUserId }
                });
                await tx.testResult.updateMany({
                    where: { therapistId: userId },
                    data: { therapistId: transferToUserId }
                });
            } else {
                await tx.accessCode.deleteMany({ where: { therapistId: userId } });
                await tx.testResult.deleteMany({ where: { therapistId: userId } });
            }

            await tx.notification.deleteMany({ where: { userId } });
            await tx.user.delete({ where: { id: userId } });
        });

        revalidatePath('/admin/users');
        revalidatePath('/admin/codes');
        revalidatePath('/therapist/dashboard');
    } catch (error: any) {
        console.error('Failed to delete user:', error);
        throw new Error(error.message || 'Failed to delete user');
    }
}

export async function saveUser(user: Partial<User>, hashedPassword?: string): Promise<User> {
    await requireAuth('admin');
    try {
        const dataToSave = {
            email: user.email!,
            username: user.fullName || user.username || '',
            role: user.role || 'therapist',
        };

        let savedUser;
        if (user.id) {
            savedUser = await prisma.user.update({
                where: { id: user.id },
                data: dataToSave,
                select: { id: true, email: true, username: true, role: true, createdAt: true, twoFactorSecret: true },
            });
        } else {
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
            twoFactorSecret: savedUser.twoFactorSecret ? 'enabled' : undefined,
        };
    } catch (error) {
        console.error('Failed to save user:', error);
        throw new Error('Failed to save user');
    }
}

export const getUsers = getAllUsers;

export async function createUser(data: { email: string; username: string; password: string; role: 'admin' | 'therapist' }): Promise<User> {
    await requireAuth('admin');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return saveUser({
        email: data.email,
        fullName: data.username,
        username: data.username,
        role: data.role as UserRole,
    }, hashedPassword);
}

export async function changeOwnPassword(
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const currentUser = await checkAuth();
        if (!currentUser) {
            return { success: false, error: 'Brak autoryzacji. Zaloguj się ponownie.' };
        }

        if (!currentPassword) {
            return { success: false, error: 'Podaj aktualne hasło.' };
        }

        if (!newPassword || newPassword.length < 6) {
            return { success: false, error: 'Nowe hasło musi mieć co najmniej 6 znaków.' };
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: { id: true, password: true }
        });

        if (!dbUser || !dbUser.password) {
            return { success: false, error: 'Nie znaleziono konta użytkownika.' };
        }

        const isCurrentValid = await bcrypt.compare(currentPassword, dbUser.password);
        if (!isCurrentValid) {
            return { success: false, error: 'Aktualne hasło jest nieprawidłowe.' };
        }

        const isSamePassword = await bcrypt.compare(newPassword, dbUser.password);
        if (isSamePassword) {
            return { success: false, error: 'Nowe hasło musi różnić się od dotychczasowego.' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: currentUser.id },
            data: { password: hashedPassword },
        });

        return { success: true };
    } catch (error: any) {
        console.error('Failed to change own password:', error);
        return { success: false, error: 'Wystąpił błąd podczas zmiany hasła.' };
    }
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
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
            select: { id: true, email: true, username: true, createdAt: true, role: true, twoFactorSecret: true },
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
                twoFactorSecret: updated.twoFactorSecret ? 'enabled' : undefined,
            },
        };
    } catch (error: any) {
        console.error('Failed to update user:', error);
        return { success: false, error: 'Nie udało się zapisać zmian (sprawdź, czy e-mail nie jest już zajęty).' };
    }
}
