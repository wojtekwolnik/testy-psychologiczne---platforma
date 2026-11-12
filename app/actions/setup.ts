'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getBigFiveSeedScales, getBigFiveSeedSections } from '@/lib/bigFiveSync';
import { getDass42TestCreateData, DASS_42_CANONICAL_ID } from '@/lib/dass42Sync';

async function seedDefaultTestsIfNeeded() {
    try {
        const existingDemo = await prisma.test.findFirst({ where: { canonicalId: 'demo-personality-test' } });
        if (!existingDemo) {
            await prisma.test.create({
                data: {
                    title: 'Test Osobowości (Demo)',
                    canonicalId: 'demo-personality-test',
                    description: 'To jest przykładowy test osobowości w celach demonstracyjnych.',
                    instructions: 'Proszę odpowiedzieć szczerze na wszystkie pytania.',
                    questionsPerPage: 2,
                    sections: {
                        create: [
                            {
                                title: 'Sekcja 1: Podstawy',
                                questions: {
                                    create: [
                                        {
                                            text: 'Czy lubisz spotkania towarzyskie?',
                                            type: 'single-select',
                                            options: JSON.stringify([
                                                { text: 'Tak', value: 1, id: 'opt1' },
                                                { text: 'Nie', value: 0, id: 'opt2' },
                                            ]),
                                            scoring: '{}'
                                        },
                                        {
                                            text: 'Jak często czujesz się zestresowany?',
                                            type: 'single-select',
                                            options: JSON.stringify([
                                                { text: 'Rzadko', value: 1, id: 'opt3' },
                                                { text: 'Często', value: 2, id: 'opt4' },
                                                { text: 'Bardzo często', value: 3, id: 'opt5' },
                                            ]),
                                            scoring: '{}'
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            });
        }

        const existingBigFive = await prisma.test.findFirst({ where: { canonicalId: 'big-five-johnson-120' } });
        if (!existingBigFive) {
            await prisma.test.create({
                data: {
                    title: 'Wielka Piątka (IPIP-NEO-PI-R 120)',
                    canonicalId: 'big-five-johnson-120',
                    description: 'Wielka Piątka (Big Five) to wszechstronny, zweryfikowany naukowo inwentarz osobowości mierzący pięć głównych wymiarów: Otwartość na doświadczenia, Sumienność, Ekstrawersję, Ugodowość oraz Neurotyczność, wraz z 30 szczegółowymi podskalami (aspektami). Wersja 120-pytaniowa.',
                    instructions: 'Oceń, na ile poniższe stwierdzenia trafnie opisują Twoje zachowania i odczucia. Zaznacz odpowiedź, która najbardziej odpowiada prawdzie.',
                    questionsPerPage: 24,
                    status: 'PUBLISHED',
                    scales: {
                        create: getBigFiveSeedScales(),
                    },
                    sections: {
                        create: getBigFiveSeedSections(),
                    },
                },
            });
        }
        const existingDass42 = await prisma.test.findFirst({ where: { canonicalId: DASS_42_CANONICAL_ID } });
        if (!existingDass42) {
            await prisma.test.create({
                data: getDass42TestCreateData(),
            });
        }
    } catch (e) {
        console.error('Non-fatal error seeding default tests:', e);
    }
}

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

        // 4. Seed default tests if database has none
        await seedDefaultTestsIfNeeded();

        return { success: true };
    } catch (error: any) {
        console.error('Setup error:', error);
        return {
            success: false,
            error: 'Wystąpił błąd podczas konfiguracji. Spróbuj ponownie lub sprawdź logi serwera.'
        };
    }
}
