import { describe, expect, test } from 'vitest';
import { DELETE_COPY, emailsMatch } from './deleteConfirmation';

describe('emailsMatch', () => {
  test('when the typed value equals the email, then it matches', () => {
    expect(emailsMatch('owner@acme.com', 'owner@acme.com')).toBe(true);
  });

  test('when either side has surrounding spaces, then they are ignored', () => {
    expect(emailsMatch('  owner@acme.com ', ' owner@acme.com')).toBe(true);
  });

  test('when only the case differs, then it still matches', () => {
    expect(emailsMatch('Owner@Acme.com', 'owner@acme.com')).toBe(true);
  });

  test('when the email differs, then it does not match', () => {
    expect(emailsMatch('owner@acme.co', 'owner@acme.com')).toBe(false);
  });

  test('when the entity has no email, then nothing matches, not even an empty input', () => {
    expect(emailsMatch('', '')).toBe(false);
    expect(emailsMatch('   ', '  ')).toBe(false);
  });
});

describe('DELETE_COPY', () => {
  test('when locked without an unlock time, then the message still reads correctly', () => {
    expect(DELETE_COPY.errors.locked()).toBe('Too many failed attempts. Try again later.');
  });
});
