'use server';

import { BrandingSettings } from '@/components/types';
import { sendEmail } from '@/app/services/emailService';
import { getInternalBrandingSettings, saveInternalBrandingSettings } from '@/app/services/settingsService';

const MASK_STRING = '********';

export async function getBrandingSettings(): Promise<BrandingSettings | null> {
    try {
        const settings = await getInternalBrandingSettings();
        if (!settings) return null;

        // Mask sensitive data before sending to client
        if (settings.emailSettings?.smtp?.password) {
            settings.emailSettings.smtp.password = MASK_STRING;
        }
        if (settings.aiSettings?.apiKey) {
            settings.aiSettings.apiKey = MASK_STRING;
        }

        return settings;
    } catch (error) {
        console.error('Failed to fetch safe branding settings:', error);
        return null;
    }
}

export async function saveBrandingSettings(settings: BrandingSettings): Promise<void> {
    try {
        const existingSettings = await getInternalBrandingSettings();

        // Restore real passwords if they were masked
        if (existingSettings) {
            if (settings.emailSettings?.smtp?.password === MASK_STRING) {
                settings.emailSettings.smtp.password = existingSettings.emailSettings?.smtp?.password || '';
            }
            if (settings.aiSettings?.apiKey === MASK_STRING) {
                settings.aiSettings.apiKey = existingSettings.aiSettings?.apiKey || '';
            }
        }

        await saveInternalBrandingSettings(settings);
    } catch (error) {
        console.error('Failed to save branding settings:', error);
        throw new Error('Failed to save branding settings');
    }
}

export async function sendTestEmailAction(toEmail: string): Promise<{ success: boolean; message: string }> {
    try {
        const result = await sendEmail({
            to: toEmail,
            subject: 'Wiadomość testowa z Platformy',
            html: '<p>Witaj!</p><p>To jest automatyczna wiadomość testowa wysłana z panelu administratora.</p><p>Jeśli ją widzisz, oznacza to, że konfiguracja SMTP działa poprawnie!</p>',
        });

        if (result.success) {
            return { success: true, message: 'Wiadomość wysłana pomyślnie!' };
        } else {
            return { success: false, message: 'Błąd: ' + result.error };
        }
    } catch (error: any) {
        return { success: false, message: 'Błąd systemu: ' + error.message };
    }
}
