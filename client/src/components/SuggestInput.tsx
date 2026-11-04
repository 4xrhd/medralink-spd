import React, { useId, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { Input, type InputProps } from '../ui/primitives.js';
import { filterSuggestions, type Suggestion } from '../data/suggest.js';

interface SuggestInputProps extends Omit<InputProps, 'value' | 'onChange' | 'onSelect'> {
  value: string;
  onChange: (value: string) => void;
  /** Called when a suggestion is chosen; defaults to filling the box with its value. */
  onSelect?: (item: Suggestion) => void;
  suggestions: readonly Suggestion[];
  limit?: number;
}

/**
 * Text box with a suggestion list (ARIA combobox): arrow keys move, Enter picks,
 * Escape closes. Typing anything not in the list still works as normal input.
 */
export const SuggestInput: React.FC<SuggestInputProps> = ({
  value, onChange, onSelect, suggestions, limit = 8, onKeyDown, onFocus, onBlur, ...inputProps
}) => {
  const { t: tr } = useLanguage();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = filterSuggestions(suggestions, value, limit)
    .filter((m) => m.value.toLowerCase() !== value.trim().toLowerCase());
  const shown = open && matches.length > 0;

  const choose = (item: Suggestion) => {
    if (onSelect) onSelect(item);
    else onChange(item.value);
    setOpen(false);
    setActive(-1);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (shown && e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
      return;
    }
    if (shown && e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? matches.length - 1 : i - 1));
      return;
    }
    if (shown && e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(matches[active]);
      return;
    }
    if (shown && e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative w-full">
      <Input
        {...inputProps}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={(e) => {
          setOpen(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setOpen(false);
          onBlur?.(e);
        }}
        onKeyDown={handleKey}
      />
      {shown && (
        <ul
          id={listId}
          role="listbox"
          aria-label={tr('Suggestions')}
          className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-hair bg-white py-1 shadow-elevated"
        >
          {matches.map((m, i) => (
            <li
              key={m.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: picking must happen before the input's blur closes the list
              onMouseDown={(e) => {
                e.preventDefault();
                choose(m);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 text-sm ${
                i === active ? 'bg-primary-50 text-primary-900' : 'text-ink-900'
              }`}
            >
              <span className="min-w-0 truncate font-medium">{m.value}</span>
              {m.hint && <span className="shrink-0 truncate text-[0.8125rem] text-ink-600">{m.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
