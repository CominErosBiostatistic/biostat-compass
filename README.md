# Biostat Compass

A web app that helps students and researchers choose a statistical model from the research
question, the study design and the structure of the data. Every recommendation cites the
methodological literature it comes from.

**[Open the app](https://cominerosbiostatistic.github.io/biostat-compass/)**

## What it gives

| Part                 | Content                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Recommended method   | Model, effect measure, equivalent simple test, alternatives, assumptions to check         |
| Warnings             | Sample size (events per parameter, Riley criteria), design, missing data, effect measures |
| Presentation         | What to show to an exam board, to clinicians, or in a publication                         |
| Reporting guidelines | CONSORT 2025, STROBE, RECORD, TARGET, TRIPOD+AI, STARD and others                         |
| Sources              | Numbered references with PubMed and DOI links                                             |

Results can be shared as a link, copied as text or printed to PDF. The app works offline and can
be installed on a phone or a computer. No data leave the device.

## Contents

| Folder or file                                                           | Content                                                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| [`index.html`](index.html), [`app.js`](app.js), [`style.css`](style.css) | Interface                                                                                                    |
| [`engine/`](engine/)                                                     | Rule engine and validator, plain JavaScript with no dependencies                                             |
| [`rules/`](rules/README.md)                                              | Questions, models, warnings, presentation rules, guidelines, sources (JSON)                                  |
| [`research/`](research/literature-review.md)                             | Literature review behind the rules, with the full bibliography                                               |
| [`test/`](test/)                                                         | Validator page and test cases                                                                                |
| [`tools/`](tools/)                                                       | Scripts that build the sources file and the icons                                                            |
| [`docs/`](docs/)                                                         | [Technology choice](docs/technology-choice.md) and [how to make the tool citable](docs/making-it-citable.md) |

## How to run it

Any static web server works. From this folder:

```bash
python -m http.server 8765
```

Then open <http://localhost:8765> for the app and <http://localhost:8765/test/test.html> for the
rule validator, which must end with `ALL OK`.

## How to cite

See [`CITATION.cff`](CITATION.cff) or the **Cite** page of the app. Please also cite the original
sources listed with each recommendation.

## Licence

Code under the MIT licence; rules and texts under CC BY 4.0. See [`LICENSE`](LICENSE).

## Disclaimer

The app supports the choice of a method. It does not replace the judgement of a statistician who
knows the study.
