import { describe, it, expect } from 'vitest';
import { ICD10_CODES, QUICK_ICD10, searchIcd10 } from './icd10.js';

describe('icd10', () => {
  it('has unique codes and a title for each', () => {
    const codes = ICD10_CODES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(ICD10_CODES.length).toBeGreaterThanOrEqual(60);
    for (const c of ICD10_CODES) {
      expect(c.code).toMatch(/^[A-Z]\d{2}(\.\d{1,2})?$/);
      expect(c.title.length).toBeGreaterThan(2);
    }
  });

  it('keeps the quick chips inside the full list', () => {
    for (const q of QUICK_ICD10) expect(ICD10_CODES).toContainEqual(q);
  });

  it('finds by code prefix, ignoring case and the dot', () => {
    expect(searchIcd10('a90')[0].code).toBe('A90');
    expect(searchIcd10('N390')[0].code).toBe('N39.0');
  });

  it('finds by any word of the title', () => {
    expect(searchIcd10('dengue').map((c) => c.code)).toContain('A90');
    expect(searchIcd10('back pain').map((c) => c.code)).toContain('M54.5');
  });

  it('returns nothing for blank input and caps the result count', () => {
    expect(searchIcd10('  ')).toEqual([]);
    expect(searchIcd10('a', 5).length).toBeLessThanOrEqual(5);
  });
});
