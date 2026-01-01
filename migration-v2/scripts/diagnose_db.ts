
import { prisma } from '../lib/prisma';

async function main() {
    console.log("Diagnosing DB...");
    try {
        const testCount = await prisma.test.count();
        const templateCount = await prisma.pdfTemplate.count();
        const usersCount = await prisma.user.count();

        console.log(`Tests: ${testCount}`);
        console.log(`Templates: ${templateCount}`);
        console.log(`Users: ${usersCount}`);

        const templates = await prisma.pdfTemplate.findMany();
        console.log("Templates ids:", templates.map(t => t.id));

        const tests = await prisma.test.findMany({ select: { id: true, defaultTemplateId: true, title: true } });
        console.log("Tests info:", JSON.stringify(tests, null, 2));

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
