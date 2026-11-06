// Rule validator: checks that the JSON files are consistent with each other
// and that every possible path through the questionnaire leads to exactly one model.

import { activeQuestions, chooseModel, COMPUTED_FIELDS } from "./engine.js";

export function validate(rules) {
  const errors = [];
  const notes = [];
  const sources = new Set(rules.sources.map((s) => s.id));
  const questions = new Map(rules.questions.map((q) => [q.id, q]));

  // 1. Unique ids in each file
  for (const [name, list] of Object.entries(groups(rules))) {
    const seen = new Set();
    for (const x of list) {
      if (seen.has(x.id)) errors.push(`${name}: duplicate id "${x.id}"`);
      seen.add(x.id);
    }
  }

  // 2. Sources exist; every rule cites at least one (except the app's limits)
  for (const [name, list] of Object.entries(groups(rules))) {
    for (const x of list) {
      for (const s of x.sources ?? []) if (!sources.has(s)) errors.push(`${name}/${x.id}: unknown source "${s}"`);
      if ((x.sources ?? []).length === 0 && x.level !== "limit") errors.push(`${name}/${x.id}: no source`);
    }
  }

  // 3. Conditions use existing fields and values
  const checkCondition = (where, when) => {
    for (const [field, rule] of Object.entries(when ?? {})) {
      const q = questions.get(field);
      const computed = COMPUTED_FIELDS.includes(field);
      if (!q && !computed) { errors.push(`${where}: unknown field "${field}"`); continue; }
      if (Array.isArray(rule)) {
        if (!q || q.type !== "choice") { errors.push(`${where}: "${field}" is not a choice question`); continue; }
        const options = new Set(q.options.map((o) => o.id));
        for (const v of rule) if (!options.has(v)) errors.push(`${where}: "${field}" has no option "${v}"`);
      } else if (q && q.type !== "number") {
        errors.push(`${where}: numeric comparison on "${field}", which is not numeric`);
      }
    }
  };
  for (const q of rules.questions) checkCondition(`questions/${q.id}`, q.askIf);
  for (const [name, list] of Object.entries(groups(rules))) {
    if (name === "questions") continue;
    for (const x of list) checkCondition(`${name}/${x.id}`, x.when);
  }

  // 4. Every combination of choice answers leads to exactly one model.
  //    Numeric questions do not decide the model and are skipped.
  const reached = new Set();
  let paths = 0;
  const explore = (answers) => {
    const next = activeQuestions(rules.questions, answers).find((q) => q.type === "choice" && !(q.id in answers));
    if (!next) {
      paths++;
      const { model, ties } = chooseModel(rules.models, answers);
      const label = JSON.stringify(answers);
      if (!model) errors.push(`no model for ${label}`);
      else if (ties.length) errors.push(`several models (${ties.join(", ")}) for ${label}`);
      else reached.add(model.id);
      return;
    }
    for (const o of next.options) explore({ ...answers, [next.id]: o.id });
  };
  explore({});
  for (const m of rules.models) if (!reached.has(m.id)) errors.push(`models/${m.id}: never chosen`);
  notes.push(`${paths} paths explored, ${reached.size} of ${rules.models.length} models reachable`);

  // 5. Sources in the bibliography that no rule cites (not an error)
  const cited = new Set(Object.values(groups(rules)).flat().flatMap((x) => x.sources ?? []));
  const uncited = rules.sources.filter((s) => !cited.has(s.id)).map((s) => s.id);
  notes.push(`${rules.sources.length - uncited.length} of ${rules.sources.length} sources cited; not cited: ${uncited.join(", ") || "none"}`);

  // Coverage errors can be thousands: keep the first 50
  return { ok: errors.length === 0, errors: errors.slice(0, 50), totalErrors: errors.length, notes };
}

function groups(rules) {
  return {
    questions: rules.questions,
    models: rules.models,
    warnings: rules.warnings,
    presentation: rules.presentation,
    guidelines: rules.guidelines,
  };
}

// Checks a test case: expected model, and warnings that must (or must not) appear
export function checkCase(recommendation, testCase) {
  const problems = [];
  const modelId = recommendation.model?.id ?? null;
  if (modelId !== testCase.expectedModel) problems.push(`model ${modelId}, expected ${testCase.expectedModel}`);
  const warnings = new Set(recommendation.warnings.map((w) => w.id));
  for (const w of testCase.expectedWarnings ?? []) if (!warnings.has(w)) problems.push(`missing warning ${w}`);
  for (const w of testCase.excludedWarnings ?? []) if (warnings.has(w)) problems.push(`unexpected warning ${w}`);
  const guidelines = new Set(recommendation.guidelines.map((g) => g.id));
  for (const g of testCase.expectedGuidelines ?? []) if (!guidelines.has(g)) problems.push(`missing guideline ${g}`);
  return problems;
}
