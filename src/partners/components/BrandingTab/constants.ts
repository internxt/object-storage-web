export const DEFAULT_PRIMARY_COLOUR = '#0066FF';
export const HEX_COLOUR_PATTERN = /^#(?:[\dA-Fa-f]{3}|[\dA-Fa-f]{6})$/;
export const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

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
