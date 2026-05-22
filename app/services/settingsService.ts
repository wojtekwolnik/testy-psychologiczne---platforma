import { BrandingSettings } from '@/components/types';
import { prisma } from '@/lib/prisma';
const DEFAULT_ID = 'default';

/**
 * Zwraca prawdziwe, pełne ustawienia aplikacji z bazy danych (z jawnymi hasłami).
 * TEJ FUNKCJI NIE WOLNO EKSPORTOWAĆ Z PLIKÓW "USE SERVER", aby nie trafiła do klienta.
 */
export async function getInternalBrandingSettings(): Promise<BrandingSettings | null> {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: DEFAULT_ID },
        });

        if (settings) {
            return JSON.parse(settings.branding) as BrandingSettings;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch internal branding settings:', error);
        return null;
    }
}

/**
 * Zapisuje ustawienia bezpośrednio do bazy.
 */
export async function saveInternalBrandingSettings(settings: BrandingSettings): Promise<void> {
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
        console.error('Failed to save internal branding settings:', error);
        throw new Error('Failed to save branding settings');
    }
}
