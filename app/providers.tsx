'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ThemeInjector } from '@/components/ThemeInjector';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <BrandingProvider>
                <ThemeInjector />
                {children}
            </BrandingProvider>
        </AuthProvider>
    );
}
