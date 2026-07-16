export const LEGACY_CONSOLE_URL = 'https://console.internxt.com';
export const NEW_CONSOLE_URL = 'https://cloud.internxt.com/management/login';


export function resolveConsoleUrl(date: Date | string | null): string {
  if (!date) {
    return LEGACY_CONSOLE_URL;
  }

  const releaseDateRaw = import.meta.env.VITE_NEW_CONSOLE_RELEASE_DATE;
  if (!releaseDateRaw) {
    return LEGACY_CONSOLE_URL;
  }

  const releaseDate = new Date(releaseDateRaw).getTime();
  const target = new Date(date).getTime();

  if (Number.isNaN(releaseDate) || Number.isNaN(target)) {
    return LEGACY_CONSOLE_URL;
  }

  return target >= releaseDate ? NEW_CONSOLE_URL : LEGACY_CONSOLE_URL;
}
