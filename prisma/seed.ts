import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs';
import { BIG_FIVE_SCALE_DEFINITIONS } from '../lib/interpretationBuilder';

const prisma = new PrismaClient()

async function main() {
    // Users are now created via Setup Wizard or admin panel.

    // Create Sample Test
    const sampleTest = await prisma.test.findFirst({ where: { canonicalId: 'demo-personality-test' } }) || await prisma.test.create({
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
    })

    // Check if Big Five Test already exists
    let bigFiveTest = await prisma.test.findFirst({ where: { canonicalId: 'big-five-johnson-120' } });
    if (!bigFiveTest) {
        const bigFiveQuestions = require('./bigFiveQuestions.json');
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

        // Create the test
        bigFiveTest = await prisma.test.create({
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
                    create: [
                        {
                            title: 'Część 1 (Pytania 1 - 24)',
                            questions: {
                                create: bigFiveQuestions.slice(0, 24).map((q: any) => ({
                                    text: q.text,
                                    type: 'likert-5',
                                    options: likertOptions,
                                    scoring: q.keyed === 'plus' ? scoringPlus(q.domain) : scoringMinus(q.domain)
                                }))
                            }
                        },
                        {
                            title: 'Część 2 (Pytania 25 - 48)',
                            questions: {
                                create: bigFiveQuestions.slice(24, 48).map((q: any) => ({
                                    text: q.text,
                                    type: 'likert-5',
                                    options: likertOptions,
                                    scoring: q.keyed === 'plus' ? scoringPlus(q.domain) : scoringMinus(q.domain)
                                }))
                            }
                        },
                        {
                            title: 'Część 3 (Pytania 49 - 72)',
                            questions: {
                                create: bigFiveQuestions.slice(48, 72).map((q: any) => ({
                                    text: q.text,
                                    type: 'likert-5',
                                    options: likertOptions,
                                    scoring: q.keyed === 'plus' ? scoringPlus(q.domain) : scoringMinus(q.domain)
                                }))
                            }
                        },
                        {
                            title: 'Część 4 (Pytania 73 - 96)',
                            questions: {
                                create: bigFiveQuestions.slice(72, 96).map((q: any) => ({
                                    text: q.text,
                                    type: 'likert-5',
                                    options: likertOptions,
                                    scoring: q.keyed === 'plus' ? scoringPlus(q.domain) : scoringMinus(q.domain)
                                }))
                            }
                        },
                        {
                            title: 'Część 5 (Pytania 97 - 120)',
                            questions: {
                                create: bigFiveQuestions.slice(96, 120).map((q: any) => ({
                                    text: q.text,
                                    type: 'likert-5',
                                    options: likertOptions,
                                    scoring: q.keyed === 'plus' ? scoringPlus(q.domain) : scoringMinus(q.domain)
                                }))
                            }
                        }
                    ]
                }
            }
        });
    }

    console.log({ sampleTest, bigFiveTest })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
