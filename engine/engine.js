// Rule engine: no dependencies, no access to the page.
// It takes the rules (the JSON files in rules/) and the user's answers,
// and returns the next question or the recommendation.

// Warning levels, most serious first
const LEVELS = ["serious", "caution", "limit", "info"];

// A condition is an object { field: rule }; every rule must hold (AND).
//   rule = ["a", "b"]           -> the answer is one of these (OR)
//   rule = { lt: 10, gte: 5 }   -> numeric comparison
// A field with no answer satisfies no rule.
export function conditionHolds(when, answers) {
  for (const [field, rule] of Object.entries(when)) {
    const value = answers[field];
    if (Array.isArray(rule)) {
      if (!rule.includes(value)) return false;
    } else {
      if (typeof value !== "number" || !Number.isFinite(value)) return false;
      if ("lt" in rule && !(value < rule.lt)) return false;
      if ("lte" in rule && !(value <= rule.lte)) return false;
      if ("gt" in rule && !(value > rule.gt)) return false;
      if ("gte" in rule && !(value >= rule.gte)) return false;
    }
  }
  return true;
}

// Fields the engine computes from the numeric answers
export const COMPUTED_FIELDS = ["epv", "spp"];

export function withComputedFields(answers) {
  const a = { ...answers };
  // Events per parameter, for binary and time-to-event outcomes
  if (Number.isFinite(a.events) && Number.isFinite(a.params) && a.params > 0) a.epv = a.events / a.params;
  // Subjects per parameter, for continuous outcomes
  if (Number.isFinite(a.n) && Number.isFinite(a.params) && a.params > 0) a.spp = a.n / a.params;
  return a;
}

// Removes answers to questions that are no longer active
// (for example, the user goes back and changes the type of outcome)
export function cleanAnswers(questions, answers) {
  const a = { ...answers };
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of questions) {
      if (q.id in a && q.askIf && !conditionHolds(q.askIf, a)) {
        delete a[q.id];
        changed = true;
      }
    }
  }
  return a;
}

export function activeQuestions(questions, answers) {
  return questions.filter((q) => !q.askIf || conditionHolds(q.askIf, answers));
}

// First active question without an answer, or null when the questionnaire is complete
export function nextQuestion(questions, answers) {
  return activeQuestions(questions, answers).find((q) => !(q.id in answers)) ?? null;
}

// The rule with the highest priority applies; with equal priority, the one with
// the most matching conditions (the most specific)
export function chooseModel(models, answers) {
  const candidates = models.filter((m) => conditionHolds(m.when, answers));
  if (candidates.length === 0) return { model: null, ties: [] };
  const weight = (m) => (m.priority ?? 0) * 100 + Object.keys(m.when).length;
  const top = Math.max(...candidates.map(weight));
  const best = candidates.filter((m) => weight(m) === top);
  return { model: best[0], ties: best.length > 1 ? best.map((m) => m.id) : [] };
}

// Full recommendation for a set of answers
export function recommend(rules, rawAnswers) {
  const answers = withComputedFields(cleanAnswers(rules.questions, rawAnswers));
  const { model, ties } = chooseModel(rules.models, answers);
  const warnings = rules.warnings
    .filter((w) => conditionHolds(w.when, answers))
    .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
  const presentation = rules.presentation.filter((p) => conditionHolds(p.when, answers));
  const guidelines = rules.guidelines.filter((g) => conditionHolds(g.when, answers));

  // Cited sources, without duplicates, in bibliography order
  const ids = new Set([model, ...warnings, ...presentation, ...guidelines].filter(Boolean).flatMap((x) => x.sources));
  const sources = rules.sources.filter((s) => ids.has(s.id));

  return { answers, model, ties, warnings, presentation, guidelines, sources };
}
