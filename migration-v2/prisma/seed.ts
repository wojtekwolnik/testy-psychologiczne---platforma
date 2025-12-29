import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            username: 'Admin User',
            password: 'admin-password',
            role: 'admin',
        },
    })

    // Create Therapist
    const therapist = await prisma.user.upsert({
        where: { email: 'therapist@example.com' },
        update: {},
        create: {
            email: 'therapist@example.com',
            username: 'Therapist User',
            password: 'therapist-password',
            role: 'therapist',
        },
    })

    console.log({ admin, therapist })
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
