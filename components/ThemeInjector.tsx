'use client';

import React, { useContext, useEffect } from 'react';
import { BrandingContext, unifiedPalette } from '@/contexts/BrandingContext';
import { getContrastingTextColor, getContrastRatio } from '@/utils/colorUtils';
import { sanitizeCssToken } from '@/lib/testUtils';

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
        --font-family: ${sanitizeCssToken(fontFamily, 'system-ui, sans-serif')};
        --primary-color: ${sanitizeCssToken(primaryColor, unifiedPalette.primaryColor)};
        --primary-contrast: ${sanitizeCssToken(primaryContrast, '#ffffff')};
        --primary-contrast-text-color: ${sanitizeCssToken(primaryContrast, '#ffffff')};
        --secondary-color: ${sanitizeCssToken(branding.secondaryColor, unifiedPalette.secondaryColor)};
        --accent-color: ${sanitizeCssToken(accentColor, unifiedPalette.accentColor)};
        --accent-contrast: ${sanitizeCssToken(accentContrast, '#ffffff')};
        --background-color: ${sanitizeCssToken(branding.backgroundColor, unifiedPalette.backgroundColor)};
        --surface-color: ${sanitizeCssToken(branding.secondaryColor, unifiedPalette.secondaryColor)};
        --text-color: ${sanitizeCssToken(branding.textColor, unifiedPalette.textColor)};
        --text-muted: ${sanitizeCssToken(branding.textColor ? branding.textColor + 'b3' : '#94a3b8', '#94a3b8')};
        --border-color: ${sanitizeCssToken(branding.borderColor, unifiedPalette.borderColor)};
        --input-background-color: ${sanitizeCssToken(rawInputBg, unifiedPalette.inputBackgroundColor)};
        --input-text-color: ${sanitizeCssToken(safeInputText, unifiedPalette.inputTextColor)};
        --error-color: ${sanitizeCssToken(errorColor, unifiedPalette.errorColor)};
        --error-contrast: ${sanitizeCssToken(errorContrast, '#ffffff')};
        --warning-color: ${sanitizeCssToken(warningColor, unifiedPalette.warningColor)};
        --warning-contrast: ${sanitizeCssToken(warningContrast, '#0f172a')};
        --success-color: ${sanitizeCssToken(successColor, unifiedPalette.successColor)};
        --success-contrast: ${sanitizeCssToken(successContrast, '#ffffff')};
        --admin-color: ${sanitizeCssToken(branding.adminColor, unifiedPalette.adminColor)};
        --admin-background-color: ${sanitizeCssToken(branding.adminBackgroundColor, unifiedPalette.adminBackgroundColor)};
        --therapist-color: ${sanitizeCssToken(branding.therapistColor, unifiedPalette.therapistColor)};
        --therapist-background-color: ${sanitizeCssToken(branding.therapistBackgroundColor, unifiedPalette.therapistBackgroundColor)};
        --sidebar-background: ${sanitizeCssToken(branding.sidebarBackground, unifiedPalette.sidebarBackground)};
        --sidebar-text-color: ${sanitizeCssToken(branding.sidebarTextColor, unifiedPalette.sidebarTextColor)};
        --sidebar-active-background: ${sanitizeCssToken(branding.sidebarActiveBackground, unifiedPalette.sidebarActiveBackground)};
        --sidebar-active-text: ${sanitizeCssToken(branding.sidebarActiveText, unifiedPalette.sidebarActiveText)};
        --sidebar-hover-background: ${sanitizeCssToken(branding.sidebarHoverBackground, unifiedPalette.sidebarHoverBackground)};
        --sidebar-hover-text: ${sanitizeCssToken(branding.sidebarHoverText, unifiedPalette.sidebarHoverText)};
    }
    `;

    return (
        <style dangerouslySetInnerHTML={{ __html: styleContent }} />
    );
};
