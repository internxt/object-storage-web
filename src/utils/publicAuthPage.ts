const PUBLIC_AUTH_PAGE_SUFFIXES = ['/login', '/forgot-password', '/reset-password'];

export function isPublicAuthPage(pathname: string): boolean {
  return PUBLIC_AUTH_PAGE_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
}
