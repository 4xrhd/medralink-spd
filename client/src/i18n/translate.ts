import { bn } from './bn.js';

export type Lang = 'en' | 'bn';

const fill = (text: string, vars?: Record<string, string | number>) =>
  vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text;

/** Translate an English UI string. Missing Bangla entries fall back to English. */
export const translate = (lang: Lang, english: string, vars?: Record<string, string | number>): string =>
  fill(lang === 'bn' ? bn[english] ?? english : english, vars);
