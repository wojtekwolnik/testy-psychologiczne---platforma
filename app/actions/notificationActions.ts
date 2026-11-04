'use server';

import { prisma } from '@/lib/prisma';
import type { Notification } from '@/components/types';
import { requireAuth } from './authActions';

export async function markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    const currentUser = await requireAuth();
    const targetUserId = currentUser.role === 'admin' && userId ? userId : currentUser.id;
    if (notificationIds.length === 0) return;
    await prisma.notification.updateMany({
        where: {
            id: { in: notificationIds },
            userId: targetUserId,
        },
        data: { isRead: true },
    });
}

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    const currentUser = await requireAuth();
    const targetUserId = currentUser.role === 'admin' && userId ? userId : currentUser.id;
    const rows = await prisma.notification.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
        take: 50,
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
