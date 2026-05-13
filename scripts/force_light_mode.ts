
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_ID = 'default';

async function forceLightMode() {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: DEFAULT_ID },
        });

        let branding: any = {};
        if (settings) {
            branding = JSON.parse(settings.branding);
        }

        // Force mode to 'light'
        branding.mode = 'light';

        // Ensure defaults exist if missing
        if (!branding.lightTheme) branding.lightTheme = {}; // Will be filled by app logic if empty

        console.log("Saving new branding settings:", JSON.stringify(branding, null, 2));

        await prisma.systemSettings.upsert({
            where: { id: DEFAULT_ID },
            update: { branding: JSON.stringify(branding) },
            create: {
                id: DEFAULT_ID,
                branding: JSON.stringify(branding),
            },
        });

        console.log("Successfully forced Light Mode.");
    } catch (e) {
        console.error("Error forcing light mode:", e);
    } finally {
        await prisma.$disconnect();
    }
}

forceLightMode();
