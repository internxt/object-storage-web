import { describe, expect, test } from 'vitest';
import { DELETE_COPY, namesMatch, subAccountConfirmationName } from './deleteConfirmation';

describe('namesMatch', () => {
  test('when the typed value equals the name, then it matches', () => {
    expect(namesMatch('Acme Corp', 'Acme Corp')).toBe(true);
  });

  test('when either side has surrounding spaces, then they are ignored', () => {
    expect(namesMatch('  Acme Corp ', ' Acme Corp')).toBe(true);
  });

  test('when only the case differs, then it does not match', () => {
    expect(namesMatch('acme corp', 'Acme Corp')).toBe(false);
  });

  test('when the entity has no name, then nothing matches, not even an empty input', () => {
    expect(namesMatch('', '')).toBe(false);
    expect(namesMatch('   ', '  ')).toBe(false);
  });
});

describe('subAccountConfirmationName', () => {
  test('when the sub-account has a name, then the name is what gets typed', () => {
    expect(subAccountConfirmationName('Acme', 'acme@example.com')).toBe('Acme');
  });

  test('when the sub-account has no name, then it falls back to the email', () => {
    expect(subAccountConfirmationName(null, 'acme@example.com')).toBe('acme@example.com');
    expect(subAccountConfirmationName('   ', 'acme@example.com')).toBe('acme@example.com');
  });

  test('when it has neither, then there is nothing to confirm with', () => {
    expect(subAccountConfirmationName(null, '')).toBeNull();
  });
});

describe('DELETE_COPY', () => {
  test('when locked without an unlock time, then the message still reads correctly', () => {
    expect(DELETE_COPY.errors.locked()).toBe('Too many failed attempts. Try again later.');
  });
});
