const LIGHT_COLOUR_LUMINANCE_THRESHOLD = 160;

export const DEFAULT_PRIMARY_COLOUR = '#0066FF';
export const HEX_COLOUR_PATTERN = /^#(?:[\dA-Fa-f]{3}|[\dA-Fa-f]{6})$/;

type RgbColour = {
  red: number;
  green: number;
  blue: number;
};

/**
 * Converts either supported CSS hex form (`#RGB` or `#RRGGBB`) to RGB values.
 * Branding values are validated by the API before they reach this utility.
 */
export function hexToRgb(hexColour: string): RgbColour {
  const hex = hexColour.slice(1);
  const fullHex = hex.length === 3 ? hex.replace(/./g, (part) => part.repeat(2)) : hex;

  return {
    red: Number.parseInt(fullHex.slice(0, 2), 16),
    green: Number.parseInt(fullHex.slice(2, 4), 16),
    blue: Number.parseInt(fullHex.slice(4, 6), 16),
  };
}

/**
 * Chooses black or white text so it remains readable on the selected brand colour.
 *
 * The brightness calculation gives red, green, and blue different weights.
 * Those weights come from the ITU-R BT.601 standard, a reliable way to estimate
 * how bright a colour appears to people.
 *
 * ITU-R is the International Telecommunication Union's radiocommunication
 * sector, which publishes technical standards for communication systems.
 * More details: https://www.itu.int/rec/R-REC-BT.601-7-201103-I/en
 */
export function contrastColour(hexColour: string): '#FFFFFF' | '#18181B' {
  const { red, green, blue } = hexToRgb(hexColour);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance >= LIGHT_COLOUR_LUMINANCE_THRESHOLD ? '#18181B' : '#FFFFFF';
}

/**
 * Creates a light version of the brand colour for subtle backgrounds.
 * It keeps those elements connected to the partner's branding without competing with the main content.
 *
 * It does this by moving the red, green, and blue values closer to white by the
 * same amount. That keeps the colour recognisable, just lighter.
 */
export function mixWithWhite(hexColour: string, whiteAmount: number): string {
  const { red, green, blue } = hexToRgb(hexColour);
  const mix = (component: number) => Math.round(component + (255 - component) * whiteAmount);

  return `rgb(${mix(red)} ${mix(green)} ${mix(blue)})`;
}

/**
 * Creates a darker primary-colour variant for hover and active states. This
 * keeps interaction feedback within the configured brand colour instead of
 * falling back to Internxt blue.
 *
 * It reduces the red, green, and blue values by the same amount. That keeps
 * the colour recognisable, just darker.
 */
export function darkenColour(hexColour: string, amount: number): string {
  const { red, green, blue } = hexToRgb(hexColour);
  const darken = (component: number) => Math.round(component * (1 - amount));

  return `${darken(red)} ${darken(green)} ${darken(blue)}`;
}
