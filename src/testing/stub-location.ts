/**
 * Replaces window.location with a plain stub so tests that exercise a 401 redirect
 * (e.g. `window.location.href = '/foo/login'`) don't trip jsdom's "navigation not
 * implemented" error, and so the current pathname can be controlled per test.
 */
export function stubLocation(pathname: string): void {
  const stub = { pathname, href: '', origin: 'http://localhost:3000' } as unknown as Location;
  Object.defineProperty(window, 'location', { value: stub, writable: true, configurable: true });
}
