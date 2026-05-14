'use server';

import { prisma } from '@/lib/prisma';
import type { AccessCode } from '@/components/types';
import { revalidatePath } from 'next/cache';
import { generateUniqueId } from '@/utils/idUtils';

import { checkAuth } from './authActions';

export async function generateAccessCode(testId: string, expiresAt: Date, therapistId: string): Promise<AccessCode> {
    const code = `AC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`; // Simple code gen

    const accessCode = await prisma.accessCode.create({
        data: {
            code,
            testId,
            therapistId,
            expiresAt,
            isUsed: false
        }
    });

    revalidatePath('/therapist/dashboard');
    return {
        ...accessCode,
        expiresAt: accessCode.expiresAt.toISOString()
    };
}

export async function fetchActiveCodes(): Promise<(AccessCode & { therapistName?: string, therapistEmail?: string })[]> {
    const user = await checkAuth();
    if (!user) return [];

    const where: any = { isUsed: false };
    if (user.role !== 'admin') {
        where.therapistId = user.id;
    }

    const codes = await prisma.accessCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            therapist: {
                select: { username: true, email: true }
            }
        }
    });

    return codes.map(c => ({
        ...c,
        expiresAt: c.expiresAt.toISOString(),
        therapistName: c.therapist?.username || undefined,
        therapistEmail: c.therapist?.email || undefined,
    }));
}

export async function validateAccessCode(code: string): Promise<{ isValid: boolean, testId?: string, error?: string }> {
    const accessCode = await prisma.accessCode.findUnique({
        where: { code }
    });

    if (!accessCode) {
        return { isValid: false, error: 'Nieprawidłowy kod dostępu.' };
    }

    if (accessCode.isUsed) {
        return { isValid: false, error: 'Ten kod został już wykorzystany.' };
    }

    if (new Date() > accessCode.expiresAt) {
        return { isValid: false, error: 'Ten kod wygasł.' };
    }

    return { isValid: true, testId: accessCode.testId };
}

export async function markAccessCodeAsUsed(code: string): Promise<void> {
    await prisma.accessCode.update({
        where: { code },
        data: { isUsed: true }
    });
}

export async function deleteAccessCode(code: string): Promise<void> {
    const user = await checkAuth();
    if (!user) throw new Error("Unauthorized");

    const accessCode = await prisma.accessCode.findUnique({ where: { code } });
    if (!accessCode) throw new Error("Code not found");

    if (user.role !== 'admin' && accessCode.therapistId !== user.id) {
        throw new Error("Forbidden");
    }

    await prisma.accessCode.delete({
        where: { code }
    });
    
    revalidatePath('/therapist/dashboard');
    revalidatePath('/admin/codes');
}
