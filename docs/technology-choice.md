# Technology choice

Decision: **a static web app (HTML + JavaScript), installable as a PWA, published on GitHub Pages**.
The rules are in JSON files, separate from the code.

## Requirements

| Requirement                 | Why                                                                 |
| --------------------------- | ------------------------------------------------------------------- |
| Works on phone and computer | Starting requirement                                                |
| Opens in a few seconds      | Used in class or while studying, often on a mobile connection       |
| Works offline               | Classrooms and libraries with a weak connection                     |
| No server to maintain       | Personal project, zero cost                                         |
| Rules editable without code | The rules change with the literature; every rule must cite a source |

## Options considered

| Option                       | For                                                                          | Against                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Shinylive (R in the browser) | Familiar language; same approach as `ml-classification-R`                    | The first load downloads R and the packages (up to a minute); heavy on phones; the app needs no R computation |
| Shiny on a server            | Simple to write in R                                                         | Needs a server; free plans have limited hours and go to sleep; no offline use                                 |
| **Static web app + PWA**     | Opens at once; installable on the home screen; offline; free on GitHub Pages | Written in JavaScript                                                                                         |
| Native app (Android/iOS)     | Native experience                                                            | Two platforms, paid store account (Apple), store review; too much for a questionnaire                         |

The app asks questions and applies rules: it fits no models, so R is not needed at run time.
The only computation is the ratio of events to parameters.

## Structure

| Folder      | Content                                                                     |
| ----------- | --------------------------------------------------------------------------- |
| `research/` | Literature review with the full bibliography                                |
| `rules/`    | Questions, models, warnings, presentation, guidelines and sources in JSON   |
| `engine/`   | Engine in plain JavaScript: chooses the next question and applies the rules |
| `test/`     | Rule validator and test cases, run in the browser                           |
| `tools/`    | Scripts that build the sources file and the icons                           |
| `docs/`     | Project notes                                                               |

The engine is separate from the interface: the same logic and the same JSON files could also serve
an R version in the future.
