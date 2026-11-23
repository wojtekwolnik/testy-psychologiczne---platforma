import { prisma } from '@/lib/prisma';

export const RETENTION_DAYS = 60;

/**
 * Automatically purges test results older than 60 days (matching the 60-day countdown in the UI)
 * as well as expired unused access codes and old used access codes.
 */
export async function cleanupExpiredData(): Promise<void> {
    try {
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

        await Promise.all([
            prisma.testResult.deleteMany({
                where: { completedAt: { lt: cutoffDate } },
            }),
            prisma.accessCode.deleteMany({
                where: {
                    OR: [
                        { isUsed: false, expiresAt: { lt: now } },
                        { isUsed: true, createdAt: { lt: cutoffDate } },
                    ],
                },
            }),
        ]);
    } catch (error) {
        console.error('[Retention Cleanup] Failed to purge expired records:', error);
    }
}
