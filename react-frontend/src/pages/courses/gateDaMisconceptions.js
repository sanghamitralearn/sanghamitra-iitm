// ─── Misconception lookup for the GATE DA "why did this happen?" card ───────
// Mirrors ./satMisconceptions.js's exported shape/signature exactly:
//   resolveMisconception(item, rushed) -> { name, why, risks } | null
// where item is a flat chapter item (from buildChapterItems) with at least
// { subject, topic, unattempted, isCorrect }, and rushed is a boolean
// computed by the caller (isRushedMiss).
//
// There is no authored GATE DA misconception taxonomy yet (unlike SAT's
// topic-by-topic PATTERNS table), so this always returns a sensible generic
// fallback, parameterized by the missed question's subject/topic, so the
// Mistakes tab in GATEDAScoreDashboard.jsx renders sensibly without any
// special-case null-handling for GATE DA specifically.

const RUSHED_PATTERN = {
  name: 'Misread Trap',
  why: (subject, topic) =>
    `Moving quickly through this ${subject} question likely caused a key detail in "${topic}" to be missed, even though the underlying method may have been sound. Under GATE DA's negative marking, a rushed guess can cost more than skipping the question.`,
}

const STEADY_PATTERN = {
  name: 'Conceptual Gap',
  why: (subject, topic) =>
    `The approach used here suggests the core idea behind "${topic}" (${subject}) hasn't fully settled yet — targeted revision and a few more practice questions on this topic should help close the gap before your next attempt.`,
}

// item: { subject, topic, unattempted, isCorrect } — rushed: boolean, computed by the caller (isRushedMiss)
export function resolveMisconception(item, rushed) {
  if (!item || item.unattempted || item.isCorrect) return null

  const subject = item.subject || 'this subject'
  const topic = item.topic || 'this topic'
  const pattern = rushed ? RUSHED_PATTERN : STEADY_PATTERN

  return {
    name: pattern.name,
    why: pattern.why(subject, topic),
    risks: [
      { topic: subject, pct: 60, by: 'before your next attempt' },
    ],
  }
}
