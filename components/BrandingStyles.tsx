import React, { useContext, useEffect } from 'react';
import { BrandingContext } from '../contexts/BrandingContext';
import { getContrastingTextColor } from '../utils/colorUtils';


const BrandingStyles = () => {
  const { branding } = useContext(BrandingContext);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', branding.primaryColor);
    root.style.setProperty('--secondary-color', branding.secondaryColor);
    root.style.setProperty('--accent-color', branding.accentColor);
    root.style.setProperty('--background-color', branding.backgroundColor);
    root.style.setProperty('--text-color', branding.textColor);

    // New detailed colors
    root.style.setProperty('--border-color', branding.borderColor);
    root.style.setProperty('--input-background-color', branding.inputBackgroundColor);
    root.style.setProperty('--input-text-color', branding.inputTextColor);
    root.style.setProperty('--error-color', branding.errorColor);
    root.style.setProperty('--warning-color', branding.warningColor);
    root.style.setProperty('--success-color', branding.successColor);
    root.style.setProperty('--admin-color', branding.adminColor);
    root.style.setProperty('--admin-background-color', branding.adminBackgroundColor);
    root.style.setProperty('--therapist-color', branding.therapistColor);
    root.style.setProperty('--therapist-background-color', branding.therapistBackgroundColor);

    // Set contrasting text color for primary buttons
    root.style.setProperty('--primary-contrast-text-color', getContrastingTextColor(branding.primaryColor));

    document.title = branding.appName;

    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon && branding.logoUrl) {
       // A simple way to update favicon, though conversion to .ico would be better in a real app
       favicon.href = branding.logoUrl;
    }

  }, [branding]);

  return null; // This component doesn't render anything
};

export default BrandingStyles;