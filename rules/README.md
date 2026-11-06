# Rules

All the logic of the app is in these files. The engine ([`../engine/engine.js`](../engine/engine.js))
contains no statistical rules: it reads them from here.

| File                                     | Content                                                                                         | How it applies                           |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [`questions.json`](questions.json)       | The questions, in the order they are asked                                                      | The first active unanswered one is asked |
| [`models.json`](models.json)             | The recommended model for each combination of answers                                           | Only the most specific rule applies      |
| [`warnings.json`](warnings.json)         | Warnings on sample size, design, missing data, effect measures                                  | All matching ones apply                  |
| [`presentation.json`](presentation.json) | What to show for an exam, clinicians, a publication                                             | All matching ones apply                  |
| [`guidelines.json`](guidelines.json)     | Reporting guidelines for publications                                                           | All matching ones apply                  |
| [`sources.json`](sources.json)           | Bibliography, built from [`../research/literature-review.md`](../research/literature-review.md) | Cited by the rules through `id`          |

## Conditions

Every rule has a `when` field (questions have `askIf`, with the same form).

| Form                                 | Meaning                                        |
| ------------------------------------ | ---------------------------------------------- |
| `{ "outcome": ["binary", "count"] }` | The answer to `outcome` is one of those listed |
| `{ "epv": { "gte": 5, "lt": 10 } }`  | Numeric comparison (`lt`, `lte`, `gt`, `gte`)  |
| Several fields in the same object    | All must hold                                  |
| Field without an answer              | The condition is false                         |

Fields computed by the engine: `epv` = `events / params`, `spp` = `n / params`.

## Specificity of models

Among the matching models, the one with the highest `priority` wins (models without it have
priority 0); with equal priority, the one with the most fields in `when` wins. Priority is used
for designs that override the usual choice, such as cross-over trials (1) and g-methods (2). For example,
`competing_effect` (3 fields) and `survival_independent` (4 fields) never overlap, because the
first needs `competing = yes` and the second `competing = no`.

## Rules for editing the files

1. Every rule cites at least one source in `sources.json`; only warnings of level `limit` are exempt.
2. A new source is first added to the bibliography of the literature review, with PMID and DOI
   verified, then `sources.json` is rebuilt with [`../tools/build_sources.py`](../tools/build_sources.py).
3. After every change, open [`../test/test.html`](../test/test.html) (it needs a local server, for
   example `python -m http.server`) and check that the result is `ALL OK`. The validator explores
   every combination of answers and reports combinations with no model or with more than one.
