import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking User ID uniqueness...");

    // Fetch all users
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });

    const ids = users.map(u => u.id);
    const uniqueIds = new Set(ids);

    console.log(`Total Users: ${users.length}`);
    console.log(`Unique IDs: ${uniqueIds.size}`);

    if (users.length === uniqueIds.size) {
        console.log("SUCCESS: All User IDs are unique.");

        // Detailed Verification
        console.log("\nSample IDs:");
        users.forEach(u => {
            console.log(`[${u.role.toUpperCase()}] ${u.email}: ${u.id}`);
        });
    } else {
        console.error("FAILURE: Duplicate IDs found!");
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
