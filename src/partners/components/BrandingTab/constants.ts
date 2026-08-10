export const DEFAULT_PRIMARY_COLOUR = '#0066FF';
export const HEX_COLOUR_PATTERN = /^#(?:[\dA-Fa-f]{3}|[\dA-Fa-f]{6})$/;

export type BrandingFormValues = {
  logoUrl: string;
  primaryColor: string;
};

export const initialState: BrandingFormValues = {
  logoUrl: '',
  primaryColor: '',
};
