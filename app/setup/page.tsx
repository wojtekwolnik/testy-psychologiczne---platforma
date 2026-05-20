import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SetupWizard from '@/components/SetupWizard';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
    const adminCount = await prisma.user.count({
        where: { role: 'admin' }
    });

    // If an admin already exists, this system is configured
    if (adminCount > 0) {
        redirect('/login');
    }

    return <SetupWizard />;
}
