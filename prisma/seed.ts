import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient()

async function main() {
    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            username: 'Admin User',
            password: await bcrypt.hash('admin-password', 10),
            role: 'admin',
        },
    })

    // Create Therapist
    const therapist = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            username: 'Therapist User',
            password: await bcrypt.hash('password123', 10),
            role: 'therapist',
        },
    })

    // Create Sample Test
    const sampleTest = await prisma.test.create({
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

    console.log({ admin, therapist, sampleTest })
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
