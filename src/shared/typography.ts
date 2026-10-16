// Spacing and punctuation of the Italian text shown on screen (dialogue lines, narration, choices, journal).
// `npm run validate` reports every problem as an error: typed text must read cleanly.

// Known abbreviations with inner dots (the will lists Jekyll's titles: M.D., D.C.L., L.L.D., F.R.S.).
const ABBREVIATIONS = /\b(?:[A-Z]\.){2,}|\b(?:M|Dr|Mr|Mrs|St|ecc|sig|pag|r)\./g

const RULES: [RegExp, string][] = [
  [/ {2,}/, 'double space'],
  [/^\s|\s$/, 'space at start or end'],
  [/ [,.;:!?»)\]’]/, 'space before punctuation'],
  [/[«([] /, 'space after an opening mark'],
  [/[,;:!?](?=[A-Za-zÀ-ÿ«])/, 'missing space after punctuation'],
  [/\.(?=[A-Za-zÀ-ÿ«])/, 'missing space after a full stop'],
  [/»(?=[A-Za-zÀ-ÿ«])/, 'missing space after »'],
  [/[A-Za-zÀ-ÿ.,;:!?…]«/, 'missing space before «'],
  [/\.{3}/, 'three dots: use the ellipsis character …'],
  [/…(?=[A-Za-zÀ-ÿ])/, 'missing space after …'],
]

// Problems of one text, as short messages (empty: clean). Line breaks (\n) are allowed.
export function typographyProblems(text: string): string[] {
  const out: string[] = []
  for (const part of text.split('\n')) {
    const t = part.replace(ABBREVIATIONS, (m) => m.replace(/\./g, '·'))
    for (const [re, msg] of RULES) if (re.test(t)) out.push(msg)
    const opens = (t.match(/«/g) ?? []).length
    const closes = (t.match(/»/g) ?? []).length
    if (opens !== closes) out.push('unbalanced « »')
  }
  return out
}
