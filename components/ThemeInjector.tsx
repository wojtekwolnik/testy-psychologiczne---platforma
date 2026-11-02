'use client';

import React, { useContext } from 'react';
import { BrandingContext } from '@/contexts/BrandingContext';
import { ThemePalette } from './types';
import { getContrastingTextColor } from '@/utils/colorUtils';

export const ThemeInjector: React.FC = () => {
    const { branding } = useContext(BrandingContext);

    // Filter out only ThemePalette keys
    const { fontFamily } = branding;
    
    // Safety check - generate fallbacks if somehow variables are missing
    const primaryColor = branding.primaryColor || '#2dd4bf';
    const primaryContrast = getContrastingTextColor(primaryColor);

    const styleContent = `
    :root {
        --font-family: ${fontFamily || "system-ui, sans-serif"};
        --primary-color: ${primaryColor};
        --primary-contrast: ${primaryContrast};
        --secondary-color: ${branding.secondaryColor || '#1e293b'};
        --accent-color: ${branding.accentColor || '#60a5fa'};
        --background-color: ${branding.backgroundColor || '#0f172a'};
        --surface-color: ${branding.secondaryColor || '#1e293b'};
        --text-color: ${branding.textColor || '#e2e8f0'};
        --text-muted: ${branding.textColor ? branding.textColor + '99' : '#94a3b8'};
        --border-color: ${branding.borderColor || '#334155'};
        --input-background-color: ${branding.inputBackgroundColor || '#1e293b'};
        --input-text-color: ${branding.inputTextColor || '#e2e8f0'};
        --error-color: ${branding.errorColor || '#f87171'};
        --warning-color: ${branding.warningColor || '#fbbf24'};
        --success-color: ${branding.successColor || '#4ade80'};
        --admin-color: ${branding.adminColor || '#c084fc'};
        --admin-background-color: ${branding.adminBackgroundColor || '#3b0764'};
        --therapist-color: ${branding.therapistColor || '#2dd4bf'};
        --therapist-background-color: ${branding.therapistBackgroundColor || '#115e59'};
        --sidebar-background: ${branding.sidebarBackground || '#020617'};
        --sidebar-text-color: ${branding.sidebarTextColor || '#e2e8f0'};
        --sidebar-active-background: ${branding.sidebarActiveBackground || '#1e293b'};
        --sidebar-active-text: ${branding.sidebarActiveText || '#ffffff'};
        --sidebar-hover-background: ${branding.sidebarHoverBackground || '#1e293b'};
        --sidebar-hover-text: ${branding.sidebarHoverText || '#ffffff'};
    }
    `;

    return (
        <style dangerouslySetInnerHTML={{ __html: styleContent }} />
    );
};
