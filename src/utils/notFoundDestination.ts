export type ConsoleArea = 'management' | 'partners' | 'wholesalers' | 'subaccount';

const AREA_BY_PATH_PREFIX: [prefix: string, area: ConsoleArea][] = [
  ['/management', 'management'],
  ['/partners', 'partners'],
  ['/wholesalers', 'wholesalers'],
  ['/subaccount', 'subaccount'],
  ['/share', 'subaccount'],
];

const AREA_BY_HOSTNAME: Record<string, ConsoleArea> = {
  'os.management.internxt.com': 'management',
  'os.partners.internxt.com': 'partners',
  'os.wholesalers.internxt.com': 'wholesalers',
};

const HOME_PATH: Record<ConsoleArea, string> = {
  management: '/management/accounts',
  partners: '/partners/sub-accounts',
  wholesalers: '/wholesalers/partners',
  subaccount: '/subaccount/buckets',
};

const LOGIN_PATH: Record<ConsoleArea, string> = {
  management: '/management/login',
  partners: '/partners/login',
  wholesalers: '/wholesalers/login',
  subaccount: '/subaccount/login',
};

const matchesPrefix = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export function resolveConsoleArea(pathname: string, hostname: string): ConsoleArea {
  const normalizedPath = pathname.toLowerCase();
  const byPath = AREA_BY_PATH_PREFIX.find(([prefix]) => matchesPrefix(normalizedPath, prefix))?.[1];

  return byPath ?? AREA_BY_HOSTNAME[hostname.trim().toLowerCase()] ?? 'subaccount';
}

export function getConsoleLoginPath(area: ConsoleArea): string {
  return LOGIN_PATH[area];
}

export function getNotFoundDestination(area: ConsoleArea, isAuthenticated: boolean): string {
  return isAuthenticated ? HOME_PATH[area] : getConsoleLoginPath(area);
}
