import { BrandingSettings } from '@/components/types';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const DEFAULT_ID = 'default';
const ENC_PREFIX = 'enc:v1:';

function getEncryptionKey(): Buffer {
    const rawKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-encryption-key-change-in-prod';
    return crypto.createHash('sha256').update(rawKey).digest();
}

export function encryptSecret(plainText: string): string {
    if (!plainText || plainText.startsWith(ENC_PREFIX)) return plainText;
    try {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
        const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return `${ENC_PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (e) {
        console.error('Failed to encrypt secret:', e);
        return plainText;
    }
}

export function decryptSecret(cipherText: string): string {
    if (!cipherText || !cipherText.startsWith(ENC_PREFIX)) return cipherText;
    try {
        const payload = cipherText.slice(ENC_PREFIX.length);
        const [ivHex, tagHex, dataHex] = payload.split(':');
        if (!ivHex || !tagHex || !dataHex) return '';
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            getEncryptionKey(),
            Buffer.from(ivHex, 'hex')
        );
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(dataHex, 'hex')),
            decipher.final(),
        ]);
        return decrypted.toString('utf8');
    } catch (e) {
        console.error('Failed to decrypt secret:', e);
        return '';
    }
}

/**
 * Zwraca prawdziwe, pełne ustawienia aplikacji z bazy danych (z odszyfrowanymi hasłami).
 * TEJ FUNKCJI NIE WOLNO EKSPORTOWAĆ Z PLIKÓW "USE SERVER", aby nie trafiła do klienta.
 */
export async function getInternalBrandingSettings(): Promise<BrandingSettings | null> {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: DEFAULT_ID },
        });

        if (settings) {
            const parsed = JSON.parse(settings.branding) as BrandingSettings;
            if (parsed.emailSettings?.smtp?.password) {
                parsed.emailSettings.smtp.password = decryptSecret(parsed.emailSettings.smtp.password);
            }
            if (parsed.aiSettings?.apiKey) {
                parsed.aiSettings.apiKey = decryptSecret(parsed.aiSettings.apiKey);
            }
            return parsed;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch internal branding settings:', error);
        return null;
    }
}

/**
 * Szyfruje klucze API i hasła SMTP (AES-256-GCM) i zapisuje ustawienia do bazy.
 */
export async function saveInternalBrandingSettings(settings: BrandingSettings): Promise<void> {
    try {
        const cloned: BrandingSettings = JSON.parse(JSON.stringify(settings));
        if (cloned.emailSettings?.smtp?.password) {
            cloned.emailSettings.smtp.password = encryptSecret(cloned.emailSettings.smtp.password);
        }
        if (cloned.aiSettings?.apiKey) {
            cloned.aiSettings.apiKey = encryptSecret(cloned.aiSettings.apiKey);
        }

        const settingsString = JSON.stringify(cloned);
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
