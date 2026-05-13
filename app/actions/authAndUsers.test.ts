/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createUser, getAllUsers, deleteUser, saveUser } from './userActions';
import { login, generate2FASecret, verifyAndEnable2FA } from './authActions';
import { UserRole } from '@/components/types';
import speakeasy from 'speakeasy';

// Mock Next.js Cache & Headers
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('next/headers', () => ({
    cookies: () => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    })
}));

describe('Auth & User Management Integration', () => {
    let createdUserId: string;
    let twoFactorSecret: string;
    const testEmail = `test-user-${Date.now()}@example.com`;
    const testPassword = 'securePassword123!';

    beforeAll(async () => {
        // Clean up if it exists
        await prisma.user.deleteMany({ where: { email: testEmail } });
    });

    afterAll(async () => {
        // Clean up after suite
        await prisma.user.deleteMany({ where: { email: testEmail } });
    });

    it('creates a new user via admin workflow', async () => {
        const newUser = await createUser({
            email: testEmail,
            username: 'Integration Test User',
            password: testPassword,
            role: 'therapist'
        });

        expect(newUser).toBeDefined();
        expect(newUser.email).toBe(testEmail);
        expect(newUser.role).toBe('therapist');
        createdUserId = newUser.id;
    });

    it('retrieves the user list', async () => {
        const users = await getAllUsers();
        const found = users.find(u => u.id === createdUserId);
        expect(found).toBeDefined();
        expect(found?.email).toBe(testEmail);
    });

    it('authenticates the user with correct credentials', async () => {
        const result = await login(testEmail, testPassword);
        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user?.id).toBe(createdUserId);
    });

    it('fails to authenticate with wrong password', async () => {
        const result = await login(testEmail, 'wrongPassword');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Nieprawidłowy email lub hasło.');
    });

    it('generates a 2FA secret for the user', async () => {
        const result = await generate2FASecret(createdUserId);
        expect('error' in result).toBe(false);
        if (!('error' in result)) {
            expect(result.secret).toBeDefined();
            expect(result.qrCodeDataUrl).toContain('data:image/png;base64,');
            twoFactorSecret = result.secret;
        }
    });

    it('fails to verify 2FA with an invalid code', async () => {
        const result = await verifyAndEnable2FA(createdUserId, twoFactorSecret, '000000');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Nieprawidłowy kod weryfikacyjny');
    });

    it('verifies 2FA with the correct code and enables it', async () => {
        // Generate valid token using speakeasy
        const validToken = speakeasy.totp({
            secret: twoFactorSecret,
            encoding: 'base32'
        });

        const result = await verifyAndEnable2FA(createdUserId, twoFactorSecret, validToken);
        expect(result.success).toBe(true);

        // Verify in DB that it is saved
        const dbUser = await prisma.user.findUnique({ where: { id: createdUserId } });
        expect(dbUser?.twoFactorSecret).toBe(twoFactorSecret);
    });

    it('updates user role', async () => {
        const updatedUser = await saveUser({ id: createdUserId, role: UserRole.Admin });
        expect(updatedUser).toBeDefined();
        expect(updatedUser.role).toBe(UserRole.Admin);
    });

    it('deletes the user', async () => {
        await deleteUser(createdUserId);
        
        const dbUser = await prisma.user.findUnique({ where: { id: createdUserId } });
        expect(dbUser).toBeNull();
    });
});
