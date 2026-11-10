'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import bigFiveQuestions from '@/prisma/bigFiveQuestions.json';
import { BIG_FIVE_SCALE_DEFINITIONS } from '@/lib/interpretationBuilder';

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
            const likertOptions = JSON.stringify([
                { text: 'Bardzo nietrafne', value: 1, id: '1' },
                { text: 'Raczej nietrafne', value: 2, id: '2' },
                { text: 'Ani trafne, ani nietrafne', value: 3, id: '3' },
                { text: 'Raczej trafne', value: 4, id: '4' },
                { text: 'Bardzo trafne', value: 5, id: '5' }
            ]);

            const scoringPlus = (domain: string) => JSON.stringify({
                '1': [{ scaleId: domain, points: 1 }],
                '2': [{ scaleId: domain, points: 2 }],
                '3': [{ scaleId: domain, points: 3 }],
                '4': [{ scaleId: domain, points: 4 }],
                '5': [{ scaleId: domain, points: 5 }]
            });

            const scoringMinus = (domain: string) => JSON.stringify({
                '1': [{ scaleId: domain, points: 5 }],
                '2': [{ scaleId: domain, points: 4 }],
                '3': [{ scaleId: domain, points: 3 }],
                '4': [{ scaleId: domain, points: 2 }],
                '5': [{ scaleId: domain, points: 1 }]
            });

            await prisma.test.create({
                data: {
                    title: 'Wielka Piątka (IPIP-NEO-PI-R 120)',
                    canonicalId: 'big-five-johnson-120',
                    description: 'Wielka Piątka (Big Five) to wszechstronny, zweryfikowany naukowo inwentarz osobowości mierzący pięć głównych wymiarów: Otwartość na doświadczenia, Sumienność, Ekstrawersję, Ugodowość oraz Neurotyczność. Wersja 120-pytaniowa.',
                    instructions: 'Oceń, na ile poniższe stwierdzenia trafnie opisują Twoje zachowania i odczucia. Zaznacz odpowiedź, która najbardziej odpowiada prawdzie.',
                    questionsPerPage: 24,
                    status: 'PUBLISHED',
                    scales: {
                        create: [
                            {
                                id: 'O',
                                name: 'Otwartość na doświadczenia',
                                type: 'standard',
                                maxScore: 120,
                                levels: JSON.stringify(BIG_FIVE_SCALE_DEFINITIONS.O.levels),
                                description: BIG_FIVE_SCALE_DEFINITIONS.O.description
                            },
                            {
                                id: 'C',
                                name: 'Sumienność',
                                type: 'standard',
                                maxScore: 120,
                                levels: JSON.stringify(BIG_FIVE_SCALE_DEFINITIONS.C.levels),
                                description: BIG_FIVE_SCALE_DEFINITIONS.C.description
                            },
                            {
                                id: 'E',
                                name: 'Ekstrawersja',
                                type: 'standard',
                                maxScore: 120,
                                levels: JSON.stringify(BIG_FIVE_SCALE_DEFINITIONS.E.levels),
                                description: BIG_FIVE_SCALE_DEFINITIONS.E.description
                            },
                            {
                                id: 'A',
                                name: 'Ugodowość',
                                type: 'standard',
                                maxScore: 120,
                                levels: JSON.stringify(BIG_FIVE_SCALE_DEFINITIONS.A.levels),
                                description: BIG_FIVE_SCALE_DEFINITIONS.A.description
                            },
                            {
                                id: 'N',
                                name: 'Neurotyczność',
                                type: 'standard',
                                maxScore: 120,
                                levels: JSON.stringify(BIG_FIVE_SCALE_DEFINITIONS.N.levels),
                                description: BIG_FIVE_SCALE_DEFINITIONS.N.description
                            }
                        ]
                    },
                    sections: {
                        create: [0, 1, 2, 3, 4].map((idx) => ({
                            title: `Część ${idx + 1} (Pytania ${idx * 24 + 1} - ${(idx + 1) * 24})`,
                            questions: {
                                create: bigFiveQuestions.slice(idx * 24, (idx + 1) * 24).map((q: any) => ({
                                    text: q.text,
                                    type: 'likert-5',
                                    options: likertOptions,
                                    scoring: q.keyed === 'plus' ? scoringPlus(q.domain) : scoringMinus(q.domain)
                                }))
                            }
                        }))
                    }
                }
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
