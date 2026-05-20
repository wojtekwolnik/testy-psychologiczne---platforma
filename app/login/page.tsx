import { StaffLoginPage } from '@/components/StaffLoginPage';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'; // Ensure we always hit the DB on request

export default async function LoginPage() {
    const adminCount = await prisma.user.count({
        where: { role: 'admin' },
    });

    if (adminCount === 0) {
        redirect('/setup');
    }

    return <StaffLoginPage />;
}
