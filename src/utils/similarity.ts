/** Normalize a string for comparison: lowercase, strip punctuation, collapse whitespace, remove articles. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Compute raw similarity between two normalized strings (0-1). */
export function rawSimilarity(na: string, nb: string): number {
  if (na === nb) return 1;
  if (!na || !nb) return 0;

  // Containment check -- if one string fully contains the other, it's a strong match.
  // Helps with short names where speech recognition adds/drops a letter.
  if (na.includes(nb) || nb.includes(na)) {
    const shorter = Math.min(na.length, nb.length);
    const longer = Math.max(na.length, nb.length);
    return shorter / longer;
  }

  // Token-overlap score
  const tokensA = na.split(' ');
  const tokensB = nb.split(' ');
  const setB = new Set(tokensB);
  const overlap = tokensA.filter((t) => setB.has(t)).length;
  const tokenScore = overlap / Math.max(tokensA.length, tokensB.length);

  // LCS ratio
  const m = na.length;
  const n = nb.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = na[i - 1] === nb[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const lcsScore = (2 * dp[m][n]) / (m + n);

  return Math.max(tokenScore, lcsScore);
}

/**
 * Compute similarity between two strings (0-1).
 * For author names, the student only needs to say the last name --
 * so we also check the spoken text against just the last word of the
 * correct answer and take the best score.
 */
export function similarity(spoken: string, correct: string): number {
  const nSpoken = normalize(spoken);
  const nCorrect = normalize(correct);

  // Full-string comparison
  let best = rawSimilarity(nSpoken, nCorrect);

  // Also try matching against just the last name (last word) of the correct answer.
  // e.g. correct="Jason Reynolds" → also accept "Reynolds"
  const correctWords = nCorrect.split(' ');
  if (correctWords.length > 1) {
    const lastName = correctWords[correctWords.length - 1];
    best = Math.max(best, rawSimilarity(nSpoken, lastName));
  }

  return best;
}

export const AUTO_CORRECT_THRESHOLD = 0.95;
export const NEAR_MISS_THRESHOLD = 0.35;

/**
 * Classify a voice answer into one of three tiers.
 * - 'correct': high confidence match, auto-accept
 * - 'spell_check': close but not certain, ask student to type it
 * - 'wrong': clearly not the right answer
 */
export function classifyVoiceAnswer(
  spoken: string,
  correct: string,
): 'correct' | 'spell_check' | 'wrong' {
  const score = similarity(spoken, correct);
  if (score >= AUTO_CORRECT_THRESHOLD) return 'correct';
  if (score >= NEAR_MISS_THRESHOLD) return 'spell_check';
  return 'wrong';
}
