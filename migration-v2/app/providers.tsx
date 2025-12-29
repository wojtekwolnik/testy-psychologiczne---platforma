'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { BrandingProvider } from '@/contexts/BrandingContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <BrandingProvider>
                {children}
            </BrandingProvider>
        </AuthProvider>
    );
}
