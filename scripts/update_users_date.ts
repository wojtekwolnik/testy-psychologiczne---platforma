import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Fetch all users ordered by creation date
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
        take: 2 // We only want to update the first two
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    for (const user of users) {
        await prisma.user.update({
            where: { id: user.id },
            data: { createdAt: yesterday }
        });
        console.log(`Updated user ${user.email} createdAt to ${yesterday.toISOString()}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
