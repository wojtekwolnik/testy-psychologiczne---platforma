// --- Contrast Checker & Color Helpers ---

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const getLuminance = (r: number, g: number, b: number): number => {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return 1;
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

export const getWcagRating = (ratio: number): { rating: 'Słaby' | 'Dobry' | 'Doskonały', color: string } => {
  if (ratio >= 7) return { rating: 'Doskonały', color: 'text-emerald-400' };
  if (ratio >= 4.5) return { rating: 'Dobry', color: 'text-emerald-400' };
  return { rating: 'Słaby', color: 'text-amber-400' };
};

export const getContrastingTextColor = (hexColor: string) => {
  if (!hexColor) return '#FFFFFF';
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#FFFFFF';
  const lum = getLuminance(rgb.r, rgb.g, rgb.b);
  return lum > 0.28 ? '#14161D' : '#FFFFFF';
};
