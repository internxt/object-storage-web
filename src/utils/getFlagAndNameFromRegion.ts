import { Bucket } from '../services/buckets.service'

const getFlagEmoji = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397))

export function getFlagAndNameFromRegion(region: Bucket['region']) {
  switch (region) {
    case 'eu-ie':
      return {
        name: 'Ireland (UE)',
        flag: getFlagEmoji('ie'),
      }
    case 'us-va':
      return {
        name: 'Virginia (US)',
        flag: getFlagEmoji('us'),
      }
    default:
      return {
        name: region,
        flag: '',
      }
  }
}
