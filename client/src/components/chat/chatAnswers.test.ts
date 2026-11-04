import { describe, it, expect } from 'vitest';
import { PRESET_QUESTIONS, answerFor, FALLBACK_ANSWER } from './chatAnswers.js';

describe('chatAnswers', () => {
  it('offers between 5 and 10 preset questions, each with an answer', () => {
    expect(PRESET_QUESTIONS.length).toBeGreaterThanOrEqual(5);
    expect(PRESET_QUESTIONS.length).toBeLessThanOrEqual(10);
    for (const q of PRESET_QUESTIONS) expect(answerFor(q.question).text).toBe(q.answer);
  });

  it('matches free text by keywords, ignoring case', () => {
    expect(answerFor('HOW do I find a HOSPITAL nearby?').text).toMatch(/hospital/i);
    expect(answerFor('is it free').text).toMatch(/no cost/i);
  });

  it('points emergencies to the hotline first', () => {
    const reply = answerFor('emergency! chest pain');
    expect(reply.text).toMatch(/999/);
    expect(reply.link?.to).toBe('/hospitals');
  });

  it('falls back for unknown or empty input', () => {
    expect(answerFor('what is the weather').text).toBe(FALLBACK_ANSWER);
    expect(answerFor('   ').text).toBe(FALLBACK_ANSWER);
  });

  it('never uses long dashes', () => {
    for (const q of PRESET_QUESTIONS) expect(q.question + q.answer).not.toMatch(/[\u2013\u2014\u2015]/);
  });
});

describe('chatAnswers in Bangla', () => {
  it('matches Bangla keywords', () => {
    expect(answerFor('জরুরি সাহায্য দরকার').link?.to).toBe('/hospitals');
    expect(answerFor('পাসওয়ার্ড ভুলে গেছি').link?.to).toBe('/forgot-password');
  });

  it('matches a tapped preset in its translated form', () => {
    const toBn = (t: string) => (t === 'Is MedraLink free for patients?' ? 'রোগীদের জন্য মেড্রালিংক কি বিনামূল্যে?' : t);
    expect(answerFor('রোগীদের জন্য মেড্রালিংক কি বিনামূল্যে?', toBn).text).toMatch(/no cost/);
  });
});
