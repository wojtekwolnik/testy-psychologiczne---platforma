'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import type { User, UserRole } from '@/components/types';

const COOKIE_NAME = 'auth_token'; // Simple cookie for now

export async function login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string; needs2FA?: boolean }> {
    // 1. Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        return { success: false, error: 'Nieprawidłowy email lub hasło.' };
    }

    // 2. Check password (Simple text check for migration prototype, use bcrypt later)
    if (user.password !== password) {
        return { success: false, error: 'Nieprawidłowy email lub hasło.' };
    }

    // 3. Check for 2FA
    if (user.twoFactorSecret) {
        return {
            success: true,
            needs2FA: true,
            user: {
                id: user.id,
                username: user.username || '',
                email: user.email,
                role: user.role as UserRole,
                createdAt: user.createdAt.toISOString(),
                fullName: user.username || '',
                twoFactorSecret: undefined // Hide secret
            }
        };
    }

    // 4. Set Cookie (Mock Session) if no 2FA
    cookies().set(COOKIE_NAME, user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    return {
        success: true,
        user: {
            id: user.id,
            username: user.username || '',
            email: user.email,
            role: user.role as UserRole,
            createdAt: user.createdAt.toISOString(),
            fullName: user.username || '',
            twoFactorSecret: undefined
        }
    };
}

export async function logout() {
    cookies().delete(COOKIE_NAME);
}

export async function verify2FA(userId: string, code: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: 'User not found' };

    // Stub Verification Logic (Prototype)
    // Accept '123456' as valid code
    if (code !== '123456') {
        return { success: false, error: 'Nieprawidłowy kod weryfikacyjny (Prototyp: użyj 123456)' };
    }

    // Set Cookie on success
    cookies().set(COOKIE_NAME, user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    return {
        success: true,
        user: {
            id: user.id,
            username: user.username || '',
            email: user.email,
            role: user.role as UserRole,
            createdAt: user.createdAt.toISOString(),
            fullName: user.username || '',
            twoFactorSecret: undefined
        }
    };
}

export async function checkAuth(): Promise<User | null> {
    const cookieStore = cookies();
    const userId = cookieStore.get(COOKIE_NAME)?.value;

    if (!userId) return null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    return {
        id: user.id,
        username: user.username || '',
        email: user.email,
        role: user.role as UserRole,
        createdAt: user.createdAt.toISOString(),
        fullName: user.username || '',
        twoFactorSecret: undefined
    };
}
