import { describe, it, expect } from 'vitest';
import { translate } from './translate.js';
import { bn } from './bn.js';

describe('translate', () => {
  it('returns English unchanged', () => {
    expect(translate('en', 'Sign in')).toBe('Sign in');
  });

  it('returns the Bangla entry', () => {
    expect(translate('bn', 'Sign in')).toBe('সাইন ইন');
  });

  it('falls back to English when a Bangla entry is missing', () => {
    expect(translate('bn', 'Untranslated text')).toBe('Untranslated text');
  });

  it('fills variables in both languages and leaves unknown ones alone', () => {
    expect(translate('en', '{n} new', { n: 3 })).toBe('3 new');
    expect(translate('bn', '{n} new', { n: 3 })).toBe('3টি নতুন');
    expect(translate('en', '{x} left', { n: 1 })).toBe('{x} left');
  });

  it('keeps every {placeholder} from the English key in the Bangla text', () => {
    for (const [en, text] of Object.entries(bn)) {
      for (const v of en.match(/\{\w+\}/g) ?? []) expect(text).toContain(v);
    }
  });
});
