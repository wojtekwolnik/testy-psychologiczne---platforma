'use server';

import { prisma } from '@/lib/prisma';
import type { Notification } from '@/components/types';

export async function markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;
    await prisma.notification.updateMany({
        where: {
            id: { in: notificationIds },
            userId, // Scoped to the user for security
        },
        data: { isRead: true },
    });
}

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    const rows = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50, // Last 50 notifications
    });
    return rows.map(n => ({
        id: n.id,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        context: n.context ? JSON.parse(n.context) : undefined,
    }));
}

export async function createNotification(userId: string, message: string, context?: { view: string; params: any }): Promise<void> {
    await prisma.notification.create({
        data: {
            userId,
            message,
            context: context ? JSON.stringify(context) : undefined,
        },
    });
}
