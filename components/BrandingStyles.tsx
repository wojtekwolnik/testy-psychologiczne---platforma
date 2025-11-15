
import React, { useContext, useEffect } from 'react';
import { BrandingContext } from '../contexts/BrandingContext';
import { getContrastingTextColor } from '../utils/colorUtils';

const GlobalStyles = ({ branding }: { branding: any }) => (
  <style>
    {`
      body {
        font-family: ${branding.fontFamily};
      }

      /* Components override to use new variables */
      .btn, .card, .input, .modal, .alert {
         border-radius: ${branding.borderRadius}rem;
         box-shadow: ${branding.boxShadow};
      }

       .card, .modal {
         box-shadow: ${branding.boxShadow};
      } 

      /* Remove shadow from simple elements */
      .btn, .input, .alert {
        box-shadow: none;
      }
      .btn-primary {
         box-shadow: ${branding.boxShadow};
      }

    `}
  </style>
);

const BrandingStyles = () => {
  const { branding } = useContext(BrandingContext);

  useEffect(() => {
    const root = document.documentElement;

    // --- Set CSS Variables ---
    // New visual properties
    root.style.setProperty('--font-family', branding.fontFamily);
    root.style.setProperty('--border-radius-base', `${branding.borderRadius}rem`);
    root.style.setProperty('--box-shadow-base', branding.boxShadow);

    // Colors
    root.style.setProperty('--primary-color', branding.primaryColor);
    root.style.setProperty('--secondary-color', branding.secondaryColor);
    root.style.setProperty('--accent-color', branding.accentColor);
    root.style.setProperty('--background-color', branding.backgroundColor);
    root.style.setProperty('--text-color', branding.textColor);
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

    // Generated contrasting colors
    root.style.setProperty('--primary-contrast-text-color', getContrastingTextColor(branding.primaryColor));

    // --- Update DOM directly ---
    document.title = branding.appName;

    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon && branding.logoUrl) {
       favicon.href = branding.logoUrl;
    }

  }, [branding]);

  // Inject global styles that depend on branding variables
  return <GlobalStyles branding={branding} />;
};

export default BrandingStyles;
