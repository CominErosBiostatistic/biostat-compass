// Biostat Compass: user interface.
// All statistical logic lives in rules/*.json; the engine is in engine/engine.js.

import { recommend, activeQuestions, nextQuestion, cleanAnswers } from "./engine/engine.js";

// Release data: update together with CITATION.cff, sw.js and index.html at every release
const APP = {
  name: "Biostat Compass",
  version: "0.1.1",
  year: 2026,
  author: {
    familyName: "Comin",
    givenName: "Eros",
    orcid: "0009-0004-9241-5998",
  },
  url: "https://cominerosbiostatistic.github.io/biostat-compass/",
  repo: "https://github.com/CominErosBiostatistic/biostat-compass",
  doi: "10.5281/zenodo.24020233", // Zenodo concept DOI: always points to the latest version
};

const LEVEL_NAMES = { serious: "Important", caution: "Caution", limit: "Not covered", info: "Advice" };

// Shown on every result, on screen, in print and in the copied text
const DISCLAIMER = "The app supports the choice of a method. It does not replace the judgement of a statistician who knows the study.";
const RESPONSIBILITY = [
  "This is a suggestion, not a conclusion. It comes from published recommendations and from your answers, but the app cannot know every detail of your study.",
  "Before using the method, check that it fits your research question and your data, verify its assumptions, and discuss it with a statistician whenever possible.",
  "The choice of method, and the responsibility for it, always remain with the researcher.",
];

// Examples on the home page: they lead straight to a result
const EXAMPLES = [
  {
    name: "RCT with a binary outcome, for clinicians",
    answers: { goal: "effect", design: "rct", outcome: "binary", outcome_frequency: "common", independence: "independent", exposure: "binary", n: 400, events: 120, params: 4, missing: "none", audience: "clinicians" },
  },
  {
    name: "Cohort from health records, survival",
    answers: { goal: "effect", design: "routine_data", outcome: "time_to_event", independence: "independent", competing: "yes", exposure: "time_varying", n: 2000, events: 40, params: 10, missing: "some", audience: "publication" },
  },
  {
    name: "Prognostic model with machine learning",
    answers: { goal: "predict", predict_type: "prognosis", design: "cohort", outcome: "binary", outcome_frequency: "rare", independence: "independent", ml: "yes", n: 5000, events: 150, params: 20, missing: "few", audience: "publication" },
  },
  {
    name: "Repeated measurements, for a thesis",
    answers: { goal: "effect", design: "cohort", outcome: "continuous", independence: "repeated", exposure: "binary", n: 80, params: 3, missing: "some", audience: "exam" },
  },
];

let rules = null;
const state = { answers: {}, current: null };
const main = document.getElementById("content");

// ---------- Utilities ----------

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function notify(text) {
  const t = document.querySelector(".toast");
  t.textContent = text;
  t.classList.add("visible");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => t.classList.remove("visible"), 2200);
}

async function copy(text, message = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    notify(message);
  } catch {
    notify("Copy failed: select the text by hand");
  }
}

// Draft of the questionnaire in the browser session, so a reload does not lose it
function saveDraft() {
  try { sessionStorage.setItem("bc-draft", JSON.stringify(state)); } catch { /* storage not available */ }
}
function loadDraft() {
  try {
    const d = JSON.parse(sessionStorage.getItem("bc-draft"));
    if (d && typeof d.answers === "object") Object.assign(state, d);
  } catch { /* no draft */ }
}

const question = (id) => rules.questions.find((q) => q.id === id);

function answerLabel(q, value) {
  if (q.type === "number") return value === null || value === undefined ? "Not given" : Number(value).toLocaleString("en-GB");
  return q.options.find((o) => o.id === value)?.label ?? value;
}

// Answers <-> shareable link (choices and numbers only, no patient data)
function encode(answers) {
  const p = new URLSearchParams();
  for (const q of rules.questions) if (q.id in answers) p.set(q.id, answers[q.id] ?? "");
  return p.toString();
}
function decode(text) {
  const p = new URLSearchParams(text);
  const a = {};
  for (const q of rules.questions) {
    if (!p.has(q.id)) continue;
    const v = p.get(q.id);
    if (q.type === "number") a[q.id] = v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
    else if (q.options.some((o) => o.id === v)) a[q.id] = v;
  }
  return cleanAnswers(rules.questions, a);
}

function shortSource(id) {
  const s = rules.sources.find((x) => x.id === id);
  if (!s) return id;
  const author = s.citation.split(/[,.]/)[0];
  const year = s.citation.match(/(19|20)\d{2}/)?.[0] ?? "";
  return `${author} ${year}`.trim();
}

function sourceLinks(s) {
  const l = [];
  if (s.pmid) l.push(`<a href="https://pubmed.ncbi.nlm.nih.gov/${esc(s.pmid)}/" target="_blank" rel="noopener">PubMed</a>`);
  if (s.doi) l.push(`<a href="https://doi.org/${esc(s.doi)}" target="_blank" rel="noopener">DOI</a>`);
  return `<span class="links">${l.join("")}</span>${s.pubmed ? "" : '<span class="not-pubmed">not in PubMed</span>'}`;
}

const showResult = () => { location.hash = `#/result?${encode(state.answers)}`; };

// ---------- Citing the tool ----------

function citations(today = new Date()) {
  const { name, version, year, author, url, doi } = APP;
  const where = doi ? `https://doi.org/${doi}` : url;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const cited = `${today.getFullYear()} ${months[today.getMonth()]} ${today.getDate()}`;
  return {
    APA: `${author.familyName}, ${author.givenName[0]}. (${year}). ${name} (Version ${version}) [Computer software]. ${where}`,
    Vancouver: `${author.familyName} ${author.givenName[0]}. ${name} [Internet]. Version ${version}. ${year} [cited ${cited}]. Available from: ${where}`,
    BibTeX: [
      `@software{${author.familyName.toLowerCase()}${year}compass,`,
      `  author  = {${author.familyName}, ${author.givenName}},`,
      `  title   = {${name}},`,
      `  version = {${version}},`,
      `  year    = {${year}},`,
      `  url     = {${url}},`,
      doi ? `  doi     = {${doi}},` : null,
      `  note    = {Decision support for the choice of a statistical model}`,
      `}`,
    ].filter(Boolean).join("\n"),
  };
}

// ---------- Feedback by email ----------

// Address that receives feedback; while it is null the feedback buttons are hidden
const FEEDBACK_EMAIL = "comin.eros1998+biostatcompass@gmail.com"; // the +biostatcompass part lets Gmail label these messages

const FEEDBACK_TYPES = {
  thanks: { label: "It was useful", subject: "Feedback", prompt: "What was useful:" },
  problem: { label: "Something is wrong or incomplete", subject: "Problem with a suggestion", prompt: "What looks wrong, inappropriate or incomplete, and what you expected:" },
  idea: { label: "Suggest an addition", subject: "Suggestion", prompt: "What you would add (a method, a question, a source with PMID or DOI):" },
};

// Opens the user's email app with subject and text already filled in.
// Nothing is sent until the user presses Send in their own email app.
function feedbackLink(type, withResult) {
  const f = FEEDBACK_TYPES[type];
  const lines = [
    f.prompt,
    "",
    "",
    "",
    "----",
    withResult ? `Link to my result (it contains my answers): ${location.href}` : null,
    withResult ? "If useful, attach the PDF of the result (Print or save as PDF)." : null,
    `${APP.name} ${APP.version}`,
  ].filter((x) => x !== null);
  const subject = `[${APP.name} ${APP.version}] ${f.subject}`;
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

function feedbackSection(withResult) {
  if (!FEEDBACK_EMAIL) return "";
  return `
    <section class="card">
      <h2>Send feedback</h2>
      <p class="small">A word of thanks, a suggestion that looks wrong or incomplete, or something to add: every message helps improve the rules.
      The button opens your email app with the text ready; nothing is sent until you press Send.${withResult ? " The link to this result is included, so the author can see your answers." : ""}</p>
      <div class="row">
        ${Object.entries(FEEDBACK_TYPES).map(([k, f]) => `<a class="btn${k === "problem" ? " primary" : ""}" href="${esc(feedbackLink(k, withResult))}">${esc(f.label)}</a>`).join("")}
      </div>
      <p class="small">No email app? Write to <a href="mailto:${esc(FEEDBACK_EMAIL)}">${esc(FEEDBACK_EMAIL)}</a>.</p>
    </section>`;
}

// ---------- Pages ----------

function homePage() {
  const nSources = rules.sources.length;
  const nPubmed = rules.sources.filter((s) => s.pubmed).length;
  main.innerHTML = `
    <section class="hero">
      <span class="badge">Evidence-based, with every source cited</span>
      <h1>Which statistical model fits your data?</h1>
      <p class="lead">Answer a few questions about your research question, study design and data. Get a suggested method,
      the assumptions to check, ideas on presenting the results to your audience, and the publications behind every suggestion.</p>
      <div class="row">
        <a class="btn primary" href="#/questions" data-action="new">Start</a>
        ${Object.keys(state.answers).length ? '<a class="btn" href="#/questions">Continue where you left off</a>' : ""}
      </div>
    </section>

    <div class="grid">
      <div class="stat"><strong>${nSources}</strong><span>publications cited, ${nPubmed} verified on PubMed</span></div>
      <div class="stat"><strong>${rules.models.length}</strong><span>models and methods, from the t-test to Fine-Gray</span></div>
      <div class="stat"><strong>3</strong><span>audiences: exam or thesis, clinicians, publication</span></div>
      <div class="stat"><strong>Offline</strong><span>installable on phone and computer, no data sent anywhere</span></div>
    </div>

    <section class="card">
      <h2>How it works</h2>
      <ol class="steps">
        <li><span><strong>The question before the data.</strong> Describing, estimating an effect and predicting need different methods, even on the same data.</span></li>
        <li><span><strong>Then design, outcome and data structure.</strong> Questions appear only when they matter: between 5 and 12 in total.</span></li>
        <li><span><strong>Finally the audience.</strong> It does not change which model suits the data, it changes what may be useful to show and which guidelines may apply.</span></li>
      </ol>
    </section>

    <section class="card">
      <h2>Try an example</h2>
      <div class="examples">
        ${EXAMPLES.map((e, i) => `<button class="example" data-example="${i}">${esc(e.name)}</button>`).join("")}
      </div>
    </section>`;

  main.querySelector('[data-action="new"]').addEventListener("click", () => {
    state.answers = {};
    state.current = null;
    saveDraft();
  });
  main.querySelectorAll("[data-example]").forEach((b) =>
    b.addEventListener("click", () => {
      state.answers = { ...EXAMPLES[Number(b.dataset.example)].answers };
      saveDraft();
      showResult();
    }),
  );
}

function questionPage() {
  state.answers = cleanAnswers(rules.questions, state.answers);
  const active = activeQuestions(rules.questions, state.answers);
  let q = state.current && active.find((x) => x.id === state.current);
  if (!q) q = nextQuestion(rules.questions, state.answers);
  if (!q) { showResult(); return; }
  state.current = q.id;
  saveDraft();

  const index = active.indexOf(q);
  const percent = Math.round((index / active.length) * 100);
  const value = state.answers[q.id];
  const complete = nextQuestion(rules.questions, state.answers) === null;

  const body = q.type === "choice"
    ? `<div class="options" role="group" aria-label="${esc(q.text)}">
        ${q.options.map((o) => `
          <button class="option" data-value="${esc(o.id)}" aria-pressed="${value === o.id}">
            <span class="option-title">${esc(o.label)}</span>
            ${o.help ? `<span class="option-detail">${esc(o.help)}</span>` : ""}
          </button>`).join("")}
      </div>`
    : `<form class="number-field" novalidate>
        <label class="skip-link" for="number">${esc(q.text)}</label>
        <input id="number" type="number" inputmode="numeric" min="${q.min ?? 0}" step="1"
               value="${Number.isFinite(value) ? value : ""}" placeholder="Number">
        <button class="btn primary" type="submit">Next</button>
        <button class="btn ghost" type="button" data-skip>I don't know yet</button>
      </form>`;

  main.innerHTML = `
    <section class="question">
      <div class="progress" aria-hidden="true"><div style="width:${percent}%"></div></div>
      <p class="step-label">Question ${index + 1} · ${esc(q.short ?? "")}</p>
      <h1>${esc(q.text)}</h1>
      ${q.help ? `<p class="help">${esc(q.help)}</p>` : ""}
      ${body}
      <div class="question-nav">
        <button class="btn ghost" data-back ${index === 0 ? "disabled" : ""}>← Back</button>
        ${complete ? '<button class="btn" data-result>See the result →</button>' : ""}
      </div>
      ${q.sources?.length ? `<details class="why"><summary>Why this question?</summary>
        <p>Sources: ${q.sources.map(shortSource).map(esc).join("; ")}. Full references are in the result and on the <a href="#/sources">Sources</a> page.</p></details>` : ""}
    </section>`;

  const answer = (v) => {
    state.answers[q.id] = v;
    state.answers = cleanAnswers(rules.questions, state.answers);
    // Move to the next active question in order, even if it already has an answer
    const now = activeQuestions(rules.questions, state.answers);
    const after = now.slice(now.findIndex((x) => x.id === q.id) + 1);
    const following = after.find((x) => !(x.id in state.answers)) ?? after[0];
    state.current = following ? following.id : null;
    saveDraft();
    if (!following) {
      showResult();
    } else {
      questionPage();
      main.focus();
    }
  };

  main.querySelectorAll(".option").forEach((b) => b.addEventListener("click", () => answer(b.dataset.value)));
  const form = main.querySelector("form");
  if (form) {
    const input = form.querySelector("input");
    input.focus();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const n = Number(input.value);
      if (input.value === "" || !Number.isFinite(n) || n < (q.min ?? 0)) { notify(`Enter a whole number from ${q.min ?? 0} upwards`); return; }
      answer(n);
    });
    form.querySelector("[data-skip]").addEventListener("click", () => answer(null));
  }
  main.querySelector("[data-back]").addEventListener("click", () => {
    if (index > 0) { state.current = active[index - 1].id; saveDraft(); questionPage(); }
  });
  main.querySelector("[data-result]")?.addEventListener("click", showResult);
}

function resultPage(query) {
  state.answers = decode(query);
  saveDraft();
  if (nextQuestion(rules.questions, state.answers)) {
    state.current = null;
    location.hash = "#/questions";
    return;
  }
  const r = recommend(rules, state.answers);
  const m = r.model;

  // Reference numbers, in the order they appear on the page
  const numbers = new Map();
  const ref = (ids) => {
    if (!ids?.length) return "";
    const n = ids.map((id) => { if (!numbers.has(id)) numbers.set(id, numbers.size + 1); return numbers.get(id); });
    return `<sup class="ref">[${n.map((x) => `<a href="#ref-${x}" data-ref="${x}">${x}</a>`).join(",")}]</sup>`;
  };

  const audience = answerLabel(question("audience"), r.answers.audience);
  const modelSection = `
    <section class="card recommendation">
      <p class="kicker">Suggested method · ${esc(audience)}</p>
      <h1>${esc(m.name)}${ref(m.sources)}</h1>
      <p>${esc(m.description)}</p>
      <p class="small">A suggestion to evaluate, not a conclusion: see <a href="#note" data-note>the note at the end</a>.</p>
      <div class="facts">
        ${m.measure ? `<div class="fact"><h3>Effect measure</h3><p>${esc(m.measure)}</p></div>` : ""}
        ${m.simpleTest ? `<div class="fact"><h3>Equivalent simple test</h3><p>${esc(m.simpleTest)}</p></div>` : ""}
      </div>
    </section>
    ${m.alternatives?.length || m.assumptions?.length ? `
    <section class="card">
      ${m.alternatives?.length ? `<h2>Alternatives</h2><ul class="list">${m.alternatives.map((a) => `<li><strong>${esc(a.name)}</strong>: ${esc(a.when.charAt(0).toLowerCase() + a.when.slice(1))}</li>`).join("")}</ul>` : ""}
      ${m.assumptions?.length ? `<h2 style="margin-top:${m.alternatives?.length ? "20px" : "0"}">Assumptions to check</h2><ul class="list">${m.assumptions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
    </section>` : ""}`;

  const warningSection = r.warnings.length ? `
    <section class="card">
      <h2>Points to consider for your case</h2>
      ${r.warnings.map((w) => `
        <div class="warning ${esc(w.level)}">
          <span class="level">${esc(LEVEL_NAMES[w.level] ?? w.level)}</span>
          <p>${esc(w.text)}${ref(w.sources)}</p>
        </div>`).join("")}
    </section>` : "";

  const show = r.presentation.flatMap((p) => p.show.map((t) => ({ t, s: p.sources })));
  const avoid = r.presentation.flatMap((p) => p.avoid.map((t) => ({ t, s: p.sources })));
  const presentationSection = show.length || avoid.length ? `
    <section class="card">
      <h2>Suggestions for presenting the results</h2>
      <div class="show-avoid">
        <div class="show"><h3>You might show</h3><ul>${show.map((x) => `<li>${esc(x.t)}${ref(x.s)}</li>`).join("")}</ul></div>
        ${avoid.length ? `<div class="avoid"><h3>Usually best avoided</h3><ul>${avoid.map((x) => `<li>${esc(x.t)}${ref(x.s)}</li>`).join("")}</ul></div>` : ""}
      </div>
    </section>` : "";

  const guidelineSection = r.guidelines.length ? `
    <section class="card">
      <h2>Reporting guidelines to consider</h2>
      <div class="guidelines">
        ${r.guidelines.map((g) => `<div class="guideline"><strong>${esc(g.name)}${ref(g.sources)}</strong><span class="small">${esc(g.use)}</span></div>`).join("")}
      </div>
    </section>` : "";

  const active = activeQuestions(rules.questions, r.answers);
  const answerSection = `
    <section class="card">
      <h2>Your answers</h2>
      <dl class="answers">
        ${active.map((q) => `
          <div class="answer">
            <dt>${esc(q.short ?? q.text)}</dt>
            <dd>${esc(answerLabel(q, r.answers[q.id]))}</dd>
            <button class="btn ghost" data-edit="${esc(q.id)}" aria-label="Edit: ${esc(q.short ?? q.text)}">Edit</button>
          </div>`).join("")}
        ${Number.isFinite(r.answers.epv) ? `<div class="answer"><dt>Events per parameter (computed)</dt><dd>${r.answers.epv.toLocaleString("en-GB", { maximumFractionDigits: 1 })}</dd></div>` : ""}
      </dl>
    </section>`;

  // References are numbered while the sections are built: the bibliography comes last
  const body = modelSection + warningSection + presentationSection + guidelineSection + answerSection;
  const sourceList = [...numbers.entries()].map(([id, n]) => {
    const s = rules.sources.find((x) => x.id === id);
    return `<li id="ref-${n}" value="${n}">${esc(s.citation)} ${sourceLinks(s)}</li>`;
  }).join("");

  const cit = citations();
  main.innerHTML = `
    ${body}
    <section class="card note" id="note">
      <h2>A suggestion, not a conclusion</h2>
      ${RESPONSIBILITY.map((t) => `<p>${esc(t)}</p>`).join("")}
      <p class="small">${esc(DISCLAIMER)}</p>
    </section>
    <section class="card">
      <h2>Sources</h2>
      <ol class="sources">${sourceList}</ol>
    </section>
    <section class="card">
      <h2>Citing this result</h2>
      <p class="small">If you use this suggestion in a thesis, a protocol or an article, cite the tool and, above all, the original sources listed above.</p>
      <div class="format"><pre>${esc(cit.APA)}</pre></div>
      <a href="#/cite">More formats (Vancouver, BibTeX)</a>
    </section>
    ${feedbackSection(true)}
    <div class="actions row">
      <button class="btn primary" data-action="link">Copy link</button>
      <button class="btn" data-action="text">Copy as text</button>
      <button class="btn" data-action="print">Print or save as PDF</button>
      <a class="btn ghost" href="#/questions" data-action="new">Start again</a>
    </div>`;

  // Reference links scroll to the source without changing the route
  main.querySelectorAll("[data-ref]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const li = document.getElementById(`ref-${a.dataset.ref}`);
    li.scrollIntoView({ behavior: "smooth", block: "center" });
    li.style.background = "var(--primary-soft)";
    setTimeout(() => { li.style.background = ""; }, 1600);
  }));
  main.querySelector("[data-note]").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("note").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  main.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => {
    state.current = b.dataset.edit;
    saveDraft();
    location.hash = "#/questions";
  }));
  main.querySelector('[data-action="link"]').addEventListener("click", () => copy(location.href, "Link copied"));
  main.querySelector('[data-action="text"]').addEventListener("click", () => copy(plainText(r, [...numbers.keys()]), "Text copied"));
  main.querySelector('[data-action="print"]').addEventListener("click", () => window.print());
  main.querySelector('[data-action="new"]').addEventListener("click", () => { state.answers = {}; state.current = null; saveDraft(); });
}

// Plain-text version of the result, to paste into a document
function plainText(r, sourceOrder) {
  const n = (ids) => (ids?.length ? ` [${ids.map((id) => sourceOrder.indexOf(id) + 1).join(",")}]` : "");
  const m = r.model;
  const lines = [
    `${APP.name} ${APP.version}`,
    "",
    `SUGGESTED METHOD: ${m.name}${n(m.sources)}`,
    m.description,
    m.measure ? `Effect measure: ${m.measure}` : null,
    m.simpleTest ? `Simple test: ${m.simpleTest}` : null,
    ...(m.alternatives ?? []).map((a) => `Alternative: ${a.name} (${a.when})`),
    ...(m.assumptions ?? []).map((a) => `To check: ${a}`),
    "",
    r.warnings.length ? "POINTS TO CONSIDER" : null,
    ...r.warnings.map((w) => `- [${LEVEL_NAMES[w.level]}] ${w.text}${n(w.sources)}`),
    "",
    "ANSWERS",
    ...activeQuestions(rules.questions, r.answers).map((q) => `- ${q.short}: ${answerLabel(q, r.answers[q.id])}`),
    "",
    "A SUGGESTION, NOT A CONCLUSION",
    ...RESPONSIBILITY,
    DISCLAIMER,
    "",
    "SOURCES",
    ...sourceOrder.map((id, i) => { const s = rules.sources.find((x) => x.id === id); return `${i + 1}. ${s.citation}${s.doi ? ` https://doi.org/${s.doi}` : ""}`; }),
    "",
    `Tool: ${citations().APA}`,
    `Link to this result: ${location.href}`,
  ];
  return lines.filter((x) => x !== null).join("\n");
}

function sourcesPage() {
  main.innerHTML = `
    <h1>Sources</h1>
    <p class="lead">All the publications the rules are based on. Every entry with a PMID was verified on PubMed.</p>
    <input class="search" type="search" placeholder="Search by author, title, journal or year" aria-label="Search the sources">
    <p class="small" data-count></p>
    <section class="card"><ol class="sources" data-list></ol></section>`;
  const list = main.querySelector("[data-list]");
  const count = main.querySelector("[data-count]");
  const draw = (filter = "") => {
    const f = filter.trim().toLowerCase();
    const items = rules.sources.filter((s) => !f || s.citation.toLowerCase().includes(f));
    list.innerHTML = items.map((s) => `<li value="${s.number}">${esc(s.citation)} ${sourceLinks(s)}</li>`).join("");
    count.textContent = `${items.length} of ${rules.sources.length} sources`;
  };
  main.querySelector(".search").addEventListener("input", (e) => draw(e.target.value));
  draw();
}

function citePage() {
  const c = citations();
  const { orcid } = APP.author;
  main.innerHTML = `
    <h1>How to cite</h1>
    <p class="lead">If the tool helped you in a thesis, a protocol, an analysis plan or an article, cite it with the version:
    the rules change with the literature, and the version makes the choice reproducible.</p>
    ${Object.entries({ APA: "APA 7", Vancouver: "Vancouver (biomedical journals)", BibTeX: "BibTeX (LaTeX, Zotero, Mendeley)" })
      .map(([k, title]) => `
        <div class="format card">
          <h2>${esc(title)}</h2>
          <pre>${esc(c[k])}</pre>
          <button class="btn" data-copy="${k}">Copy</button>
        </div>`).join("")}
    <section class="card">
      <h2>Also cite the original sources</h2>
      <p>The tool summarises recommendations published by others. In the result, every suggestion has numbered references:
      those are the ones to cite to justify the choice of method.</p>
      ${APP.doi ? "" : `<p class="small">A permanent DOI will be available from the first release archived on Zenodo. Until then, use the link and the version.</p>`}
      <p class="small">A <a href="${APP.repo}/blob/main/CITATION.cff" target="_blank" rel="noopener">CITATION.cff</a> file is available for GitHub and reference managers.</p>
    </section>
    <section class="card">
      <h2>Author</h2>
      <p>${esc(APP.author.givenName)} ${esc(APP.author.familyName)}${orcid ? ` · ORCID <a href="https://orcid.org/${esc(orcid)}" target="_blank" rel="noopener">${esc(orcid)}</a>` : ""}</p>
    </section>`;
  main.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => copy(c[b.dataset.copy], "Citation copied")));
}

function methodPage() {
  main.innerHTML = `
    <h1>Method</h1>
    <p class="lead">How the rules are built, how they are checked, and what the tool does not do.</p>
    <section class="card">
      <h2>Where the rules come from</h2>
      <p>Every rule cites at least one publication: reporting guidelines (EQUATOR network), consensus documents,
      tutorials in clinical journals, simulation studies and systematic reviews. The entries were verified on PubMed
      (PMID, DOI, year); the ${rules.sources.filter((s) => !s.pubmed).length} entries outside PubMed are marked as such.</p>
      <p>The full literature review and the rules in an open format (JSON) are in the <a href="${APP.repo}" target="_blank" rel="noopener">repository</a>.</p>
    </section>
    <section class="card">
      <h2>How they are checked</h2>
      <p>A validator explores every possible combination of answers and checks that each one leads to exactly one model,
      that every rule cites existing sources and that every model can be reached. Test cases check the expected results.</p>
    </section>
    <section class="card">
      <h2>Disclaimer</h2>
      <p>${esc(DISCLAIMER)}</p>
      ${RESPONSIBILITY.slice(1).map((t) => `<p>${esc(t)}</p>`).join("")}
    </section>
    <section class="card">
      <h2>Limits</h2>
      <ul class="list">
        <li>It supports the choice of a method: it does not know your study better than you do, and it does not replace a statistician.</li>
        <li>Not covered yet: matched case-control studies, cross-over trials, non-inferiority, meta-analysis, Bayesian methods, g-methods for time-varying exposures.</li>
        <li>The sources were collected with a targeted search, not a systematic review.</li>
        <li>Your answers stay on your device: the tool sends no data. Only if you choose to send feedback does your email app send the message you write.</li>
      </ul>
    </section>
    <section class="card">
      <h2>How it was made</h2>
      <p>Biostat Compass was built entirely with Claude Code, Anthropic's AI coding assistant. Claude Code wrote the code, searched PubMed for the literature, verified the references (PMID, DOI, year), drafted the rules and the texts, and ran the tests. The author directed the project, decided what the app should do and how it should speak, reviewed the results, and is responsible for the content.</p>
      <p class="small">Like every rule, the literature behind the app can be checked: each source has its PubMed or DOI link.</p>
    </section>
    <section class="card">
      <h2>Contributing</h2>
      <p>Found a mistake or a more recent source? ${FEEDBACK_EMAIL ? "Send feedback by email (below) or open" : "Open"} an issue on the <a href="${APP.repo}/issues" target="_blank" rel="noopener">repository</a>,
      if possible with the publication (PMID or DOI) that supports the change.</p>
    </section>
    ${feedbackSection(false)}`;
}

// ---------- Navigation ----------

function route() {
  const [path, query = ""] = location.hash.replace(/^#/, "").split("?");
  const page = path.replace(/^\//, "").split("/")[0] || "home";
  document.querySelectorAll(".menu a").forEach((a) => {
    if (a.dataset.page === page) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  const pages = { home: homePage, questions: questionPage, result: () => resultPage(query), sources: sourcesPage, cite: citePage, method: methodPage };
  (pages[page] ?? homePage)();
  const titles = { questions: "Questions", result: "Result", sources: "Sources", cite: "How to cite", method: "Method" };
  document.title = titles[page] ? `${titles[page]} · ${APP.name}` : APP.name;
  if (page !== "questions") window.scrollTo(0, 0);
}

async function start() {
  document.getElementById("version").textContent = `${APP.name} ${APP.version}`;
  const files = ["questions", "models", "warnings", "presentation", "guidelines", "sources"];
  try {
    const [q, m, w, p, g, s] = await Promise.all(files.map((f) => fetch(`rules/${f}.json`).then((r) => { if (!r.ok) throw new Error(f); return r.json(); })));
    rules = { questions: q.questions, models: m.models, warnings: w.warnings, presentation: p.presentation, guidelines: g.guidelines, sources: s.sources };
  } catch (e) {
    main.innerHTML = `<p class="loading">The rules could not be loaded (${esc(e.message)}). Please reload the page.</p>`;
    return;
  }
  document.getElementById("version").textContent = `${APP.name} ${APP.version} · rules based on ${rules.sources.length} sources`;
  loadDraft();
  window.addEventListener("hashchange", route);
  route();

  // Installation as an app and offline use
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* the app works without it */ });
  }
}

start();
