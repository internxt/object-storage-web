import * as isoCountries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';

isoCountries.registerLocale(enCountries);

export interface Country {
  value: string;
  label: string;
}

export const getFlagEmoji = (countryCode: string) =>
  String.fromCodePoint(...[...countryCode.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

export const COUNTRIES: Country[] = Object.entries(isoCountries.getNames('en', { select: 'official' }))
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));
