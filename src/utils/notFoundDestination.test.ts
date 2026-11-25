import { describe, expect, it } from 'vitest';
import { getConsoleLoginPath, getNotFoundDestination, resolveConsoleArea } from './notFoundDestination';

const SHARED_HOST = 'cloud.internxt.com';

describe('resolveConsoleArea', () => {
  it('uses the console named in the path', () => {
    expect(resolveConsoleArea('/management/nope', SHARED_HOST)).toBe('management');
    expect(resolveConsoleArea('/partners/sub-accounts/1/extra', SHARED_HOST)).toBe('partners');
    expect(resolveConsoleArea('/wholesalers/x', SHARED_HOST)).toBe('wholesalers');
    expect(resolveConsoleArea('/subaccount/missing', SHARED_HOST)).toBe('subaccount');
    expect(resolveConsoleArea('/share/abc/def', SHARED_HOST)).toBe('subaccount');
  });

  it('does not treat a path that only starts with a console name as that console', () => {
    expect(resolveConsoleArea('/partnersfoo', SHARED_HOST)).toBe('subaccount');
  });

  it('falls back to the console that owns the hostname', () => {
    expect(resolveConsoleArea('/nope', 'os.management.internxt.com')).toBe('management');
    expect(resolveConsoleArea('/nope', 'os.partners.internxt.com')).toBe('partners');
    expect(resolveConsoleArea('/nope', 'os.wholesalers.internxt.com')).toBe('wholesalers');
  });

  it('defaults to the sub-account console on shared and custom domains', () => {
    expect(resolveConsoleArea('/nope', SHARED_HOST)).toBe('subaccount');
    expect(resolveConsoleArea('/nope', 'storage.acme.com')).toBe('subaccount');
  });
});

describe('getNotFoundDestination', () => {
  it('sends signed-in users to their console home', () => {
    expect(getNotFoundDestination('management', true)).toBe('/management/accounts');
    expect(getNotFoundDestination('partners', true)).toBe('/partners/sub-accounts');
    expect(getNotFoundDestination('wholesalers', true)).toBe('/wholesalers/partners');
    expect(getNotFoundDestination('subaccount', true)).toBe('/subaccount/buckets');
  });

  it('sends users without a session to that console login', () => {
    expect(getNotFoundDestination('management', false)).toBe('/management/login');
    expect(getNotFoundDestination('partners', false)).toBe('/partners/login');
    expect(getNotFoundDestination('wholesalers', false)).toBe('/wholesalers/login');
    expect(getNotFoundDestination('subaccount', false)).toBe('/subaccount/login');
  });
});

describe('getConsoleLoginPath', () => {
  it('sends the root of each console domain to that console login', () => {
    expect(getConsoleLoginPath(resolveConsoleArea('/', 'os.management.internxt.com'))).toBe('/management/login');
    expect(getConsoleLoginPath(resolveConsoleArea('/', 'os.partners.internxt.com'))).toBe('/partners/login');
    expect(getConsoleLoginPath(resolveConsoleArea('/', 'os.wholesalers.internxt.com'))).toBe('/wholesalers/login');
    expect(getConsoleLoginPath(resolveConsoleArea('/', SHARED_HOST))).toBe('/subaccount/login');
  });
});
