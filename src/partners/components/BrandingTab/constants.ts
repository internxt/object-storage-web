export const DEFAULT_PRIMARY_COLOUR = '#0066FF';
export const HEX_COLOUR_PATTERN = /^#(?:[\dA-Fa-f]{3}|[\dA-Fa-f]{6})$/;
export const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

// Our own shared consoles, claiming one of these as a custom domain would hijack branding for
// everyone using the unbranded, default Internxt console. Kept in sync with the backend's check.
export const RESERVED_CONSOLE_HOSTNAMES = new Set(['cloud.internxt.com', 'console.internxt.com']);

export type BrandingFormValues = {
  logoUrl: string;
  primaryColor: string;
  consoleHostname: string;
};

export const initialState: BrandingFormValues = {
  logoUrl: '',
  primaryColor: '',
  consoleHostname: '',
};
