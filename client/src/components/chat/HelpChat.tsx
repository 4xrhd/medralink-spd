import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { Icon } from '../../ui/primitives.js';
import { PRESET_QUESTIONS, answerFor, type ChatLink } from './chatAnswers.js';

interface Message {
  id: number;
  from: 'bot' | 'user';
  text: string;
  link?: ChatLink;
}

const GREETING = 'Hi! I can answer common questions about MedraLink. Pick a topic or type a question.';

/** Small help chat for signed-out visitors; answers come from a fixed list, nothing is sent anywhere. */
export const HelpChat: React.FC = () => {
  const { t: tr } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: 'bot', text: GREETING }]);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (user) return null;

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const ask = (question: string) => {
    if (!question.trim()) return;
    const reply = answerFor(question, tr);
    setMessages((prev) => [
      ...prev,
      { id: prev.length, from: 'user', text: question.trim() },
      { id: prev.length + 1, from: 'bot', text: reply.text, link: reply.link },
    ]);
    setDraft('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-label={tr('MedraLink help chat')}
          onKeyDown={(e) => e.key === 'Escape' && close()}
          className="flex h-[min(34rem,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-[24rem] origin-bottom-right animate-menu-in flex-col overflow-hidden rounded-2xl border border-hair bg-white shadow-elevated motion-reduce:animate-none"
        >
          <header className="flex items-center justify-between bg-primary-700 px-4 py-3 text-white">
            <div>
              <p className="font-display text-sm font-bold">{tr('MedraLink help')}</p>
              <p className="text-[0.8125rem] text-white/85">{tr('Automatic answers to common questions')}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={tr('Close chat')}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Icon.X size={16} />
            </button>
          </header>

          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-2.5 overflow-y-auto bg-canvas px-3 py-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[0.9375rem] leading-relaxed ${
                    m.from === 'user' ? 'rounded-br-sm bg-primary-700 text-white' : 'rounded-bl-sm border border-hair bg-white text-ink-900'
                  }`}
                >
                  <span className="sr-only">{m.from === 'user' ? tr('You') : tr('MedraLink help')}: </span>
                  {tr(m.text)}
                  {m.link && (
                    <Link
                      to={m.link.to}
                      onClick={() => setOpen(false)}
                      className="mt-1.5 flex items-center gap-1 font-semibold text-primary-700 underline-offset-2 hover:underline"
                    >
                      {tr(m.link.label)} <Icon.Arrow size={13} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-hair px-3 pt-2.5">
            <p className="mb-1.5 text-[0.8125rem] font-medium text-ink-600">{tr('Common questions')}</p>
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pb-2">
              {PRESET_QUESTIONS.map((q) => (
                <button
                  key={q.question}
                  type="button"
                  onClick={() => ask(tr(q.question))}
                  className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-[0.8125rem] font-medium text-primary-800 transition-colors hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  {tr(q.question)}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
            className="flex items-center gap-2 border-t border-hair p-2.5"
          >
            <label htmlFor="help-chat-input" className="sr-only">{tr('Type your question')}</label>
            <input
              id="help-chat-input"
              ref={inputRef}
              value={draft}
              maxLength={200}
              autoComplete="off"
              onChange={(e) => setDraft(e.target.value)}
              placeholder={tr('Type your question')}
              className="min-w-0 flex-1 rounded-lg border border-hair-strong px-3 py-2 text-[0.9375rem] text-ink-900 placeholder:text-ink-600 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/30"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label={tr('Send')}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-700 text-white transition-colors hover:bg-primary-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              <Icon.Arrow size={16} />
            </button>
          </form>
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={open ? tr('Close chat') : tr('Open help chat')}
        className={`group flex h-14 items-center gap-2 rounded-full bg-primary-700 text-white shadow-elevated ring-4 ring-white/90 transition-[background-color,transform] duration-150 hover:bg-primary-800 active:scale-95 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-primary-300 ${
          open ? 'w-14 justify-center' : 'pl-3.5 pr-3.5 sm:pr-5'
        }`}
      >
        {open ? (
          <Icon.X size={24} />
        ) : (
          <>
            <ChatIcon />
            <span className="hidden text-sm font-semibold sm:inline" aria-hidden="true">{tr('Need help?')}</span>
          </>
        )}
      </button>
    </div>
  );
};

/** Speech bubble with a medical cross: "ask about your health record". */
const ChatIcon: React.FC = () => (
  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5v-8Z"
      fill="currentColor"
    />
    <path d="M12 6.5v6M9 9.5h6" className="stroke-primary-700 transition-colors group-hover:stroke-primary-800" strokeWidth={2.2} strokeLinecap="round" />
  </svg>
);
