'use server';

import { prisma } from '@/lib/prisma';
import type { AccessCode } from '@/components/types';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { checkAuth, requireAuth } from './authActions';

export async function generateAccessCode(testId: string, expiresAt: Date, therapistId: string): Promise<AccessCode> {
    const user = await requireAuth();
    const effectiveTherapistId = user.role === 'admin' && therapistId ? therapistId : user.id;

    // Cryptographically secure 8-char alphanumeric code
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    const code = `AC-${randomPart}`;

    const accessCode = await prisma.accessCode.create({
        data: {
            code,
            testId,
            therapistId: effectiveTherapistId,
            expiresAt,
            isUsed: false
        }
    });

    revalidatePath('/therapist/dashboard');
    revalidatePath('/admin/codes');
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
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) {
        return { isValid: false, error: 'Proszę wprowadzić kod dostępu.' };
    }

    const accessCode = await prisma.accessCode.findUnique({
        where: { code: trimmed }
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
    const user = await requireAuth();

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
