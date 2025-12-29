'use server';

import { prisma } from '@/lib/prisma';
import type { AccessCode } from '@/components/types';
import { revalidatePath } from 'next/cache';
import { generateUniqueId } from '@/utils/idUtils';

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

export async function fetchActiveCodes(): Promise<AccessCode[]> {
    // TODO: Filter by therapist
    const codes = await prisma.accessCode.findMany({
        where: { isUsed: false }, // Only active? Or all? Mock fetched active.
        orderBy: { createdAt: 'desc' }
    });

    return codes.map(c => ({
        ...c,
        expiresAt: c.expiresAt.toISOString()
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
