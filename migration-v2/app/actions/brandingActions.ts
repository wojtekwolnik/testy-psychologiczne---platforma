'use server';

import { PrismaClient } from '@prisma/client';
import { BrandingSettings } from '../components/types';

const prisma = new PrismaClient();

const DEFAULT_ID = 'default';

export async function getBrandingSettings(): Promise<BrandingSettings | null> {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: DEFAULT_ID },
        });

        if (settings) {
            return JSON.parse(settings.branding) as BrandingSettings;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch branding settings:', error);
        return null;
    }
}

export async function saveBrandingSettings(settings: BrandingSettings): Promise<void> {
    try {
        const settingsString = JSON.stringify(settings);

        await prisma.systemSettings.upsert({
            where: { id: DEFAULT_ID },
            update: { branding: settingsString },
            create: {
                id: DEFAULT_ID,
                branding: settingsString,
            },
        });
    } catch (error) {
        console.error('Failed to save branding settings:', error);
        throw new Error('Failed to save branding settings');
    }
}
