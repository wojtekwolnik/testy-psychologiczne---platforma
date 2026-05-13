'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import type { User, UserRole } from '@/components/types';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'auth_token';
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development-only');

async function signToken(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(SECRET_KEY);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string; needs2FA?: boolean }> {
    // 1. Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        return { success: false, error: 'Nieprawidłowy email lub hasło.' };
    }

    // 2. Verify password with bcrypt
    if (!user.password) {
        return { success: false, error: 'Nieprawidłowy email lub hasło.' };
    }
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
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

    // 4. Set Cookie (JWT Session) if no 2FA
    const token = await signToken({ userId: user.id, role: user.role });
    cookies().set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });

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
    const token = await signToken({ userId: user.id, role: user.role });
    cookies().set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });

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
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return null;

    const userId = payload.userId as string;

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
