/** A suggestion row: `value` fills the box, `hint` is shown in grey beside it. */
export interface Suggestion {
  value: string;
  hint?: string;
}

const norm = (s: string) => s.toLowerCase().normalize('NFKC');

/** Starts-with matches first, then rows containing every typed word (in value or hint). */
export const filterSuggestions = (items: readonly Suggestion[], query: string, limit = 8): Suggestion[] => {
  const q = norm(query.trim());
  if (!q) return [];
  const words = q.split(/\s+/);
  const starts = items.filter((i) => norm(i.value).startsWith(q));
  const rest = items.filter((i) => {
    if (starts.includes(i)) return false;
    const text = norm(`${i.value} ${i.hint ?? ''}`);
    return words.every((w) => text.includes(w));
  });
  return [...starts, ...rest].slice(0, limit);
};
