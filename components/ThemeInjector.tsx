'use client';

import React, { useContext } from 'react';
import { BrandingContext } from '@/contexts/BrandingContext';
import { ThemePalette } from './types';

export const ThemeInjector: React.FC = () => {
    const { branding } = useContext(BrandingContext);
    const { mode, lightTheme, darkTheme } = branding;

    const generateCssVariables = (palette: ThemePalette): string => {
        if (!palette) return '';
        return `
    --primary-color: ${palette.primaryColor};
    --secondary-color: ${palette.secondaryColor};
    --accent-color: ${palette.accentColor};
    --background-color: ${palette.backgroundColor};
    --text-color: ${palette.textColor};
    --border-color: ${palette.borderColor};
    --input-background-color: ${palette.inputBackgroundColor};
    --input-text-color: ${palette.inputTextColor};
    --error-color: ${palette.errorColor};
    --warning-color: ${palette.warningColor};
    --success-color: ${palette.successColor};
    --admin-color: ${palette.adminColor};
    --admin-background-color: ${palette.adminBackgroundColor};
    --therapist-color: ${palette.therapistColor};
    --therapist-background-color: ${palette.therapistBackgroundColor};
    --sidebar-background: ${palette.sidebarBackground};
    --sidebar-text-color: ${palette.sidebarTextColor};
    --sidebar-active-background: ${palette.sidebarActiveBackground};
    --sidebar-active-text: ${palette.sidebarActiveText};
    --sidebar-hover-background: ${palette.sidebarHoverBackground};
    --sidebar-hover-text: ${palette.sidebarHoverText};
    `;
    };

    // Construct the CSS string
    const lightVars = generateCssVariables(lightTheme);
    const darkVars = generateCssVariables(darkTheme);

    let styleContent = '';

    if (mode === 'system') {
        styleContent = `
        :root {
            ${lightVars}
        }
        @media (prefers-color-scheme: dark) {
            :root {
                ${darkVars}
            }
        }
        `;
    } else if (mode === 'dark') {
        styleContent = `
        :root {
            ${darkVars}
        }
        `;
    } else {
        // mode === 'light' or legacy default
        styleContent = `
        :root {
            ${lightVars}
        }
        `;
    }

    return (
        <style dangerouslySetInnerHTML={{ __html: styleContent }} />
    );
};
