import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs';
import { getBigFiveSeedScales, getBigFiveSeedSections } from '../lib/bigFiveSync'
import { getDass42TestCreateData, DASS_42_CANONICAL_ID } from '../lib/dass42Sync';

const prisma = new PrismaClient()

async function main() {
    // Users are created via Setup Wizard or admin panel.

    // Check if Big Five Test already exists
    let bigFiveTest = await prisma.test.findFirst({ where: { canonicalId: 'big-five-johnson-120' } });
    if (!bigFiveTest) {
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

    // Check if DASS-42 Test already exists
    let dass42Test = await prisma.test.findFirst({ where: { canonicalId: DASS_42_CANONICAL_ID } });
    if (!dass42Test) {
        dass42Test = await prisma.test.create({
            data: getDass42TestCreateData(),
        });
    }

    console.log({ bigFiveTest: bigFiveTest.id, dass42Test: dass42Test.id });
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
