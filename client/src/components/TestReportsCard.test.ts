import { describe, expect, it } from 'vitest';
import { fileProblem } from './TestReportsCard.js';

const fileOf = (name: string, bytes = 10) => new File([new Uint8Array(bytes)], name);

describe('fileProblem', () => {
  it('needs a file', () => expect(fileProblem(null)).toMatch(/choose/i));
  it('accepts PDF and images', () => {
    for (const name of ['a.pdf', 'b.JPG', 'c.jpeg', 'd.png', 'e.webp']) expect(fileProblem(fileOf(name))).toBeNull();
  });
  it('rejects other types', () => expect(fileProblem(fileOf('x.docx'))).toMatch(/only pdf/i));
  it('rejects files over 10 MB', () => expect(fileProblem(fileOf('big.pdf', 10 * 1024 * 1024 + 1))).toMatch(/10 MB/));
});
