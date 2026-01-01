

import { createDefaultTemplatesForExistingTests } from '../app/actions/testActions';
import { prisma } from '../lib/prisma';

async function main() {
    console.log("Starting backfill of default templates...");
    try {
        const tests = await prisma.test.findMany();
        console.log(`Found ${tests.length} tests total.`);

        const result = await createDefaultTemplatesForExistingTests();
        console.log(`Backfill completed. Processed ${result.count} tests.`);

        const updatedTests = await prisma.test.findMany();
        console.log("Updated Tests:", JSON.stringify(updatedTests, null, 2));
    } catch (e) {
        console.error("Backfill failed detailed:", e);
    }
}

main();

