'use client';

import React, { useContext, useEffect } from 'react';
import { BrandingContext, unifiedPalette } from '@/contexts/BrandingContext';
import { getContrastingTextColor, getContrastRatio } from '@/utils/colorUtils';

export const ThemeInjector: React.FC = () => {
    const { branding } = useContext(BrandingContext);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const faviconHref = branding.faviconUrl || '/favicon-realmoment.png';

        const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
        rels.forEach((rel) => {
            let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
            if (!link) {
                link = document.createElement('link');
                link.rel = rel;
                document.head.appendChild(link);
            }
            if (link.href !== faviconHref) {
                link.href = faviconHref;
            }
        });
    }, [branding.faviconUrl]);

    const { fontFamily } = branding;

    const primaryColor = branding.primaryColor || unifiedPalette.primaryColor;
    const accentColor = branding.accentColor || unifiedPalette.accentColor;
    const successColor = branding.successColor || unifiedPalette.successColor;
    const warningColor = branding.warningColor || unifiedPalette.warningColor;
    const errorColor = branding.errorColor || unifiedPalette.errorColor;

    const primaryContrast = getContrastingTextColor(primaryColor);
    const accentContrast = getContrastingTextColor(accentColor);
    const successContrast = getContrastingTextColor(successColor);
    const warningContrast = getContrastingTextColor(warningColor);
    const errorContrast = getContrastingTextColor(errorColor);

    // Ensure input background and input text always have readable contrast (>= 3.5:1)
    const rawInputBg = branding.inputBackgroundColor || unifiedPalette.inputBackgroundColor;
    const rawInputText = branding.inputTextColor || unifiedPalette.inputTextColor;
    const safeInputText =
        getContrastRatio(rawInputBg, rawInputText) >= 3.5
            ? rawInputText
            : getContrastingTextColor(rawInputBg);

    const styleContent = `
    :root {
        --font-family: ${fontFamily || "system-ui, sans-serif"};
        --primary-color: ${primaryColor};
        --primary-contrast: ${primaryContrast};
        --primary-contrast-text-color: ${primaryContrast};
        --secondary-color: ${branding.secondaryColor || unifiedPalette.secondaryColor};
        --accent-color: ${accentColor};
        --accent-contrast: ${accentContrast};
        --background-color: ${branding.backgroundColor || unifiedPalette.backgroundColor};
        --surface-color: ${branding.secondaryColor || unifiedPalette.secondaryColor};
        --text-color: ${branding.textColor || unifiedPalette.textColor};
        --text-muted: ${branding.textColor ? branding.textColor + 'b3' : '#94a3b8'};
        --border-color: ${branding.borderColor || unifiedPalette.borderColor};
        --input-background-color: ${rawInputBg};
        --input-text-color: ${safeInputText};
        --error-color: ${errorColor};
        --error-contrast: ${errorContrast};
        --warning-color: ${warningColor};
        --warning-contrast: ${warningContrast};
        --success-color: ${successColor};
        --success-contrast: ${successContrast};
        --admin-color: ${branding.adminColor || unifiedPalette.adminColor};
        --admin-background-color: ${branding.adminBackgroundColor || unifiedPalette.adminBackgroundColor};
        --therapist-color: ${branding.therapistColor || unifiedPalette.therapistColor};
        --therapist-background-color: ${branding.therapistBackgroundColor || unifiedPalette.therapistBackgroundColor};
        --sidebar-background: ${branding.sidebarBackground || unifiedPalette.sidebarBackground};
        --sidebar-text-color: ${branding.sidebarTextColor || unifiedPalette.sidebarTextColor};
        --sidebar-active-background: ${branding.sidebarActiveBackground || unifiedPalette.sidebarActiveBackground};
        --sidebar-active-text: ${branding.sidebarActiveText || unifiedPalette.sidebarActiveText};
        --sidebar-hover-background: ${branding.sidebarHoverBackground || unifiedPalette.sidebarHoverBackground};
        --sidebar-hover-text: ${branding.sidebarHoverText || unifiedPalette.sidebarHoverText};
    }
    `;

    return (
        <style dangerouslySetInnerHTML={{ __html: styleContent }} />
    );
};
