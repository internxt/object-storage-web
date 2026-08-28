export function displayName(key: string): string {
  return key.replace(/\/$/, '').split('/').findLast(Boolean) ?? key;
}
