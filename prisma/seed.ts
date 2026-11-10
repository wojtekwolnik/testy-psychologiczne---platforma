import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs';
import { getBigFiveSeedScales, getBigFiveSeedSections } from '../lib/bigFiveSync';

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
        // Create the test with all 5 main domains (O, C, E, A, N) + 30 facet subscales (O1..N6)
        bigFiveTest = await prisma.test.create({
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
