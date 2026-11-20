import { describe, expect, test } from 'vitest';
import { isPublicAuthPage } from './publicAuthPage';

describe('isPublicAuthPage', () => {
  test.each(['/wholesalers/login', '/wholesalers/forgot-password', '/wholesalers/reset-password'])(
    'when the path is %s, then it is a public auth page',
    (pathname) => {
      expect(isPublicAuthPage(pathname)).toBe(true);
    },
  );

  test.each(['/wholesalers/partners', '/wholesalers/settings', '/wholesalers/reset-password/extra'])(
    'when the path is %s, then it is not a public auth page',
    (pathname) => {
      expect(isPublicAuthPage(pathname)).toBe(false);
    },
  );
});
