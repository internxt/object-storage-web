import axios from 'axios';
import { HEX_COLOUR_PATTERN } from './constants';

const LIGHT_COLOUR_LUMINANCE_THRESHOLD = 160;

/**
 * Chooses black or white text so it remains readable on the selected brand colour.
 *
 * The brightness calculation gives red, green, and blue different weights.
 * Those weights come from the ITU-R (Organism that publishes technical standards for communication systems) BT.601 standard,
 * a reliable way to estimate how bright a colour appears to people.
 *
 * For more details, see:
 * https://www.itu.int/rec/R-REC-BT.601-7-201103-I/en
 *
 * The branding API accepts both CSS hex forms (`#RGB` and `#RRGGBB`), so
 * shorthand values are expanded before the calculation.
 */
export function contrastColour(hexColour: string): '#FFFFFF' | '#18181B' {
  const hex = hexColour.slice(1);
  const fullHex = hex.length === 3
    ? hex.replace(/./g, (part) => part.repeat(2))
    : hex;
  const [red, green, blue] = [0, 2, 4].map((offset) =>
    Number.parseInt(fullHex.slice(offset, offset + 2), 16),
  );
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance >= LIGHT_COLOUR_LUMINANCE_THRESHOLD ? '#18181B' : '#FFFFFF';
}
export function validateLogoUrl(value: string): { isValid: true; error?: undefined } | { isValid: false; error: string } {
  if (!value) return { isValid: true };

  try {
    const url = new URL(value);
    if (url.protocol === 'https:') {
      return { isValid: true }
    }
    return { isValid: false, error: 'Logo URL must use HTTPS' }
  } catch {
     return { isValid: false, error: 'Logo URL must be a valid HTTPS URL' }
  }
}

export function validatePrimaryColour(value: string): { isValid: true; error?: undefined } | { isValid: false; error: string }{
  if (!value) return { isValid: true };

  if (HEX_COLOUR_PATTERN.test(value)) return { isValid: true };
  return { isValid: false, error: 'Use a valid hex colour, for example #0066FF' }
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }

  return 'Could not save branding. Please try again.';
}
