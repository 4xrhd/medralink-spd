import { describe, it, expect } from 'vitest';
import { filterSuggestions } from './suggest.js';
import { PLACES } from './places.js';
import { MEDICINES } from './medicines.js';
import { AUDIT_ACTIONS } from './auditActions.js';

const items = [{ value: 'Napa', hint: 'Paracetamol 500mg' }, { value: 'Ace', hint: 'Paracetamol' }, { value: 'Seclo', hint: 'Omeprazole 20mg' }];

describe('filterSuggestions', () => {
  it('puts starts-with matches first', () => {
    expect(filterSuggestions(items, 'a').map((s) => s.value)).toEqual(['Ace', 'Napa', 'Seclo']);
  });
  it('matches words in the hint', () => {
    expect(filterSuggestions(items, 'omepra').map((s) => s.value)).toEqual(['Seclo']);
  });
  it('is empty for blank input and respects the limit', () => {
    expect(filterSuggestions(items, ' ')).toEqual([]);
    expect(filterSuggestions(items, 'a', 1)).toHaveLength(1);
  });
});

describe('suggestion data', () => {
  it.each([['places', PLACES], ['medicines', MEDICINES], ['audit actions', AUDIT_ACTIONS]])('%s has unique values', (_n, list) => {
    const values = list.map((s) => s.value.toLowerCase());
    expect(new Set(values).size).toBe(values.length);
    expect(values.length).toBeGreaterThan(15);
  });
  it('finds Dhaka areas and Bangla names', () => {
    expect(filterSuggestions(PLACES, 'dhan')[0].value).toMatch(/^Dhanmondi/);
    expect(filterSuggestions(PLACES, 'সিলেট')[0].value).toMatch(/Sylhet/);
  });
  it('finds a medicine by generic name', () => {
    expect(filterSuggestions(MEDICINES, 'amlodipine').length).toBeGreaterThan(0);
  });
});
