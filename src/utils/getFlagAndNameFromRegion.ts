import { Bucket } from '../services/buckets.service';

const getFlagEmoji = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));

export function getFlagAndNameFromRegion(region: Bucket['region']) {
  switch (region) {
    // North America
    case 'us-west-1':
      return {
        name: `Oregon (${region})`,
        flag: getFlagEmoji('us'),
      };
    case 'us-east-1':
    case 'us-east-2':
      return {
        name: `Virginia (${region})`,
        flag: getFlagEmoji('us'),
      };
    case 'us-central-1':
      return {
        name: `Texas (${region})`,
        flag: getFlagEmoji('us'),
      };
    case 'ca-central-1':
      return {
        name: `Toronto (${region})`,
        flag: getFlagEmoji('ca'),
      };

    // Europe
    case 'eu-west-1':
    case 'eu-west-3':
      return {
        name: `United Kingdom (${region})`,
        flag: getFlagEmoji('gb'),
      };
    case 'eu-west-2':
      return {
        name: `Paris (${region})`,
        flag: getFlagEmoji('fr'),
      };
    case 'eu-central-1':
      return {
        name: `Amsterdam (${region})`,
        flag: getFlagEmoji('nl'),
      };
    case 'eu-central-2':
      return {
        name: `Frankfurt (${region})`,
        flag: getFlagEmoji('de'),
      };
    case 'eu-south-1':
      return {
        name: `Milan (${region})`,
        flag: getFlagEmoji('it'),
      };

    // Asia Pacific
    case 'ap-northeast-1':
      return {
        name: `Tokyo (${region})`,
        flag: getFlagEmoji('jp'),
      };
    case 'ap-northeast-2':
      return {
        name: `Osaka (${region})`,
        flag: getFlagEmoji('jp'),
      };
    case 'ap-southeast-2':
      return {
        name: `Sydney (${region})`,
        flag: getFlagEmoji('au'),
      };
    case 'ap-southeast-1':
      return {
        name: `Singapore (${region})`,
        flag: getFlagEmoji('sg'),
      };

    default:
      return {
        name: region,
        flag: '',
      };
  }
}
