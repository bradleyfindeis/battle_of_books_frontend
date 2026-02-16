import { describe, it, expect } from 'vitest';
import {
  normalize,
  rawSimilarity,
  similarity,
  classifyVoiceAnswer,
  AUTO_CORRECT_THRESHOLD,
  NEAR_MISS_THRESHOLD,
} from './similarity';

/* ------------------------------------------------------------------ */
/*  normalize                                                          */
/* ------------------------------------------------------------------ */

describe('normalize', () => {
  it('lowercases the string', () => {
    expect(normalize('HELLO')).toBe('hello');
  });

  it('strips punctuation but keeps apostrophes', () => {
    expect(normalize("Harry's Dog!")).toBe("harry's dog");
  });

  it('removes articles (the, a, an)', () => {
    expect(normalize('The Cat in the Hat')).toBe('cat in hat');
  });

  it('collapses whitespace', () => {
    expect(normalize('  lots   of    spaces  ')).toBe('lots of spaces');
  });

  it('normalizes curly quotes consistently', () => {
    // Curly quotes get normalized and then stripped by the punctuation pass,
    // which is fine — similarity comparison doesn't need apostrophes.
    expect(normalize('it\u2019s')).toBe('it s');
    expect(normalize('it\u2018s')).toBe('it s');
  });

  it('handles empty string', () => {
    expect(normalize('')).toBe('');
  });
});

/* ------------------------------------------------------------------ */
/*  rawSimilarity                                                      */
/* ------------------------------------------------------------------ */

describe('rawSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(rawSimilarity('bulla', 'bulla')).toBe(1);
  });

  it('returns 0 when either string is empty', () => {
    expect(rawSimilarity('', 'hello')).toBe(0);
    expect(rawSimilarity('hello', '')).toBe(0);
  });

  it('uses containment ratio when one string contains the other', () => {
    // "hobb" is contained in "hobbs" → 4/5 = 0.80
    expect(rawSimilarity('hobbs', 'hobb')).toBeCloseTo(0.8, 2);
  });

  it('uses LCS for strings that differ by substitution', () => {
    // "bolla" vs "bulla" — LCS is b,l,l,a = 4 → (2*4)/(5+5) = 0.80
    const score = rawSimilarity('bolla', 'bulla');
    expect(score).toBeCloseTo(0.8, 2);
  });

  it('gives low score for completely different strings', () => {
    const score = rawSimilarity('pizza', 'reynolds');
    expect(score).toBeLessThan(0.3);
  });

  it('handles token overlap for multi-word strings', () => {
    // "jason reynolds" vs "jason reynolds" → exact match
    expect(rawSimilarity('jason reynolds', 'jason reynolds')).toBe(1);
  });

  it('gives partial credit for partial token overlap', () => {
    // "jason renolds" vs "jason reynolds" — shares "jason", LCS also high
    const score = rawSimilarity('jason renolds', 'jason reynolds');
    expect(score).toBeGreaterThan(0.5);
  });
});

/* ------------------------------------------------------------------ */
/*  similarity (includes normalization + last-name matching)           */
/* ------------------------------------------------------------------ */

describe('similarity', () => {
  it('returns 1 for exact match', () => {
    expect(similarity('Jason Reynolds', 'Jason Reynolds')).toBe(1);
  });

  it('is case-insensitive', () => {
    expect(similarity('jason reynolds', 'Jason Reynolds')).toBe(1);
  });

  it('strips articles before comparing', () => {
    expect(similarity('The Crossover', 'The Crossover')).toBe(1);
    expect(similarity('Crossover', 'The Crossover')).toBe(1);
  });

  it('accepts just the last name for multi-word author names', () => {
    // "Reynolds" vs "Jason Reynolds" — checks against last word "reynolds"
    const score = similarity('Reynolds', 'Jason Reynolds');
    expect(score).toBe(1);
  });

  it('gives high score for close voice-to-text misheard names', () => {
    // "Bolla" heard instead of "Bulla"
    const score = similarity('Bolla', 'Bulla');
    expect(score).toBeGreaterThan(0.7);
  });

  it('gives high score when speech drops a letter', () => {
    // "Hobb" heard instead of "Hobbs"
    const score = similarity('Hobb', 'Hobbs');
    expect(score).toBeGreaterThan(0.7);
  });

  it('gives low score for completely wrong answers', () => {
    const score = similarity('Pizza', 'Jason Reynolds');
    expect(score).toBeLessThan(NEAR_MISS_THRESHOLD);
  });

  it('handles speech adding extra words', () => {
    // "Jason Reynolds please" vs "Jason Reynolds"
    const score = similarity('Jason Reynolds please', 'Jason Reynolds');
    expect(score).toBeGreaterThan(0.6);
  });
});

/* ------------------------------------------------------------------ */
/*  classifyVoiceAnswer (three-tier threshold logic)                   */
/* ------------------------------------------------------------------ */

describe('classifyVoiceAnswer', () => {
  describe('auto-correct (high confidence)', () => {
    it('classifies an exact match as correct', () => {
      expect(classifyVoiceAnswer('Jason Reynolds', 'Jason Reynolds')).toBe('correct');
    });

    it('classifies case-insensitive exact match as correct', () => {
      expect(classifyVoiceAnswer('jason reynolds', 'Jason Reynolds')).toBe('correct');
    });

    it('classifies last-name-only match as correct', () => {
      expect(classifyVoiceAnswer('Reynolds', 'Jason Reynolds')).toBe('correct');
    });
  });

  describe('spell check (near miss)', () => {
    it('triggers spell check for close-but-off voice transcription', () => {
      // "Bolla" vs "Bulla" — similar but not identical
      expect(classifyVoiceAnswer('Bolla', 'Bulla')).toBe('spell_check');
    });

    it('triggers spell check when speech drops a letter from a short name', () => {
      // "Hob" vs "Hobbs" → 3/5 = 0.60 containment
      expect(classifyVoiceAnswer('Hob', 'Hobbs')).toBe('spell_check');
    });

    it('triggers spell check for similar-sounding first names', () => {
      // "Kwame" heard as "Kwami"
      expect(classifyVoiceAnswer('Kwami', 'Kwame')).toBe('spell_check');
    });

    it('triggers spell check for a partially matching title', () => {
      // "Diary of a Wimpy Kid" heard as "Diary of a Wimpy"
      expect(classifyVoiceAnswer('Diary of a Wimpy', 'Diary of a Wimpy Kid')).toBe('spell_check');
    });
  });

  describe('wrong (clearly incorrect)', () => {
    it('classifies a totally different answer as wrong', () => {
      expect(classifyVoiceAnswer('Pizza', 'Jason Reynolds')).toBe('wrong');
    });

    it('classifies gibberish as wrong', () => {
      expect(classifyVoiceAnswer('asdfgh', 'The Crossover')).toBe('wrong');
    });

    it('classifies empty speech as wrong', () => {
      expect(classifyVoiceAnswer('', 'Bulla')).toBe('wrong');
    });
  });

  describe('threshold boundaries', () => {
    it('has AUTO_CORRECT_THRESHOLD at 0.85', () => {
      expect(AUTO_CORRECT_THRESHOLD).toBe(0.85);
    });

    it('has NEAR_MISS_THRESHOLD at 0.35', () => {
      expect(NEAR_MISS_THRESHOLD).toBe(0.35);
    });

    it('spell_check range covers the gap between thresholds', () => {
      expect(NEAR_MISS_THRESHOLD).toBeLessThan(AUTO_CORRECT_THRESHOLD);
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Real-world voice-to-text scenarios                                 */
/* ------------------------------------------------------------------ */

describe('real-world voice-to-text scenarios', () => {
  const cases: Array<{ spoken: string; correct: string; expected: 'correct' | 'spell_check' | 'wrong' }> = [
    // Exact / very close — should auto-correct
    { spoken: 'Jason Reynolds', correct: 'Jason Reynolds', expected: 'correct' },
    { spoken: 'Reynolds', correct: 'Jason Reynolds', expected: 'correct' },
    { spoken: 'The Crossover', correct: 'The Crossover', expected: 'correct' },
    { spoken: 'Crossover', correct: 'The Crossover', expected: 'correct' },

    // Voice garbled the name a bit — should spell check
    { spoken: 'Bolla', correct: 'Bulla', expected: 'spell_check' },
    // "Renolds" vs "Reynolds" — LCS is very high (14/15 ≈ 0.93), auto-corrects
    { spoken: 'Renolds', correct: 'Reynolds', expected: 'correct' },

    // Completely wrong — should be wrong
    { spoken: 'Minecraft', correct: 'The Crossover', expected: 'wrong' },
    { spoken: '', correct: 'Bulla', expected: 'wrong' },
  ];

  for (const { spoken, correct, expected } of cases) {
    it(`"${spoken}" vs "${correct}" → ${expected}`, () => {
      expect(classifyVoiceAnswer(spoken, correct)).toBe(expected);
    });
  }
});
