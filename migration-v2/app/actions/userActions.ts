'use server';

import { prisma } from '@/lib/prisma';
import type { User, UserRole } from '@/components/types';
import { revalidatePath } from 'next/cache';

export async function getAllUsers(): Promise<User[]> {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return users.map(u => ({
        id: u.id,
        username: u.username || '',
        email: u.email,
        role: u.role as UserRole,
        fullName: u.username || '', // Coalesce null to string
        createdAt: u.createdAt.toISOString()
    }));
}

export async function saveUser(user: Partial<User>): Promise<User> {
    if (user.id) {
        // Update
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
        revalidatePath('/admin/dashboard');
        return {
            id: updated.id,
            username: updated.username || '',
            email: updated.email,
            role: updated.role as UserRole,
            fullName: updated.username || '',
            createdAt: updated.createdAt.toISOString()
        };
    } else {
        // Create
        const created = await prisma.user.create({
            data: {
                username: user.username || 'New User',
                email: user.email!,
                role: user.role || 'therapist',
                password: 'password123'
            }
        });
        revalidatePath('/admin/dashboard');
        return {
            id: created.id,
            username: created.username || '',
            email: created.email,
            role: created.role as UserRole,
            fullName: created.username || '',
            createdAt: created.createdAt.toISOString()
        };
    }
}

export async function deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
        where: { id: userId }
    });
    revalidatePath('/admin/dashboard');
}
