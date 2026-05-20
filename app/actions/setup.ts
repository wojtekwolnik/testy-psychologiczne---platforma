'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function setupApplication(formData: FormData) {
    try {
        // 1. Double check that no admin exists
        const adminCount = await prisma.user.count({
            where: { role: 'admin' }
        });

        if (adminCount > 0) {
            return {
                success: false,
                error: 'Aplikacja została już skonfigurowana. Konto administratora istnieje.'
            };
        }

        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password || password.length < 8) {
            return {
                success: false,
                error: 'Wymagany jest prawidłowy adres e-mail i hasło (min. 8 znaków).'
            };
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create Admin
        await prisma.user.create({
            data: {
                email,
                username: 'Główny Administrator',
                password: hashedPassword,
                role: 'admin',
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error('Setup error:', error);
        return {
            success: false,
            error: 'Wystąpił błąd podczas konfiguracji. Spróbuj ponownie lub sprawdź logi serwera.'
        };
    }
}
