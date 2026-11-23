import { describe, expect, test } from 'vitest';
import managementAxios from '../management/core/management-axios';
import { managementAuthService } from '../management/services/management-auth.service';
import { mockAdapter } from '../testing/mock-axios-adapter';
import { stubLocation } from '../testing/stub-location';
import { CaptchaUnavailableError, captchaService } from './captcha.service';

describe('console logins', () => {
  stubLocation('/login');

  describe.each([['management', managementAxios, managementAuthService]])(
    'when the %s backend rejects the captcha',
    (_, axiosInstance, authService) => {
      test('then logIn fails with a CaptchaUnavailableError', async () => {
        axiosInstance.defaults.adapter = mockAdapter(() => ({ status: 403, data: { code: 'CAPTCHA_FAILED' } }));

        const error = await authService.logIn('user@internxt.com', 'secret').catch((e: unknown) => e);

        expect(error).toBeInstanceOf(CaptchaUnavailableError);
      });
    },
  );
});

describe('captchaService.withCaptcha', () => {
  test('when the widget is not available, then the request still runs without the captcha header', async () => {
    const result = await captchaService.withCaptcha('Login', async (headers) => headers);

    expect(result).toEqual({});
  });

  test('when the request fails for another reason, then the error is rethrown untouched', async () => {
    const failure = new Error('boom');

    await expect(
      captchaService.withCaptcha('Login', async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
  });
});
