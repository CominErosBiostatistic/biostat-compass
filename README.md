# Biostat Compass

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.24020233.svg)](https://doi.org/10.5281/zenodo.24020233)

A web app that helps students and researchers choose a statistical model from the research
question, the study design and the structure of the data. Every suggestion cites the
methodological literature it comes from.

Biostat Compass suggests; it does not decide. The choice of method, and the responsibility for
it, always remain with the researcher.

**[Open the app](https://cominerosbiostatistic.github.io/biostat-compass/)**

The app online always runs the latest public version: [![Latest version](https://img.shields.io/github/v/release/CominErosBiostatistic/biostat-compass?label=version)](https://github.com/CominErosBiostatistic/biostat-compass/releases/latest)

## What it gives

| Part                   | Content                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Suggested method       | Model, effect measure, equivalent simple test, alternatives, assumptions to check              |
| Points to consider     | Sample size (events per parameter, Riley criteria), design, missing data, effect measures      |
| Presentation           | Suggestions on what may be useful to show to an exam board, to clinicians, or in a publication |
| Reporting guidelines   | Guidelines that may apply: CONSORT 2025, STROBE, RECORD, TARGET, TRIPOD+AI, STARD and others   |
| Sources                | Numbered references with PubMed and DOI links                                                  |
| A note on every result | A reminder that the result is a suggestion to evaluate, not a conclusion                       |

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

## How to cite

Cite with the DOI [10.5281/zenodo.24020233](https://doi.org/10.5281/zenodo.24020233), which always points to the latest version.
See [`CITATION.cff`](CITATION.cff) or the **Cite** page of the app for ready-made formats. Please also cite the original
sources listed with each suggestion.

## Disclaimer

The app supports the choice of a method. It does not replace the judgement of a statistician who
knows the study.

Every result is a suggestion, not a conclusion. Before using a method, check that it fits the
research question and the data, verify its assumptions, and discuss it with a statistician
whenever possible. The choice of method, and the responsibility for it, always remain with the
researcher.

## How it was made

Biostat Compass was built entirely with Claude Code, Anthropic's AI coding assistant. Claude Code wrote the code, searched PubMed for the literature, verified the references (PMID, DOI, year), drafted the rules and the texts, and ran the tests. The author directed the project, decided what the app should do and how it should speak, reviewed the results, and is responsible for the content.

Every reference can be checked through its PubMed or DOI link, and the rules are validated by the
test page described below.

## How to run it

### Open it online

Open the app at <https://cominerosbiostatistic.github.io/biostat-compass/>. Nothing needs to be
installed, and it works on phones, tablets and computers.

To keep it like an app:

| Device                   | How to install it                                                           |
| ------------------------ | --------------------------------------------------------------------------- |
| Android (Chrome)         | Menu (three dots) → **Add to Home screen** or **Install app**               |
| iPhone and iPad (Safari) | Share button → **Add to Home Screen**                                       |
| Computer (Chrome, Edge)  | The install icon at the right end of the address bar, or Menu → **Install** |

After the first visit it also works without an internet connection.

### On your own computer

This is useful if you want to change the rules or try the app before publishing a change.

**Why a "server" is needed.** If you double-click `index.html`, the page opens but stays on
"Loading the rules...". Browsers do not let a page read other files (here, the rules in `rules/`)
straight from the disk, for security reasons. A small local server, which runs only on your
computer and is not visible to anyone else, solves this.

**1. Download the project.** On the GitHub page of the project, press the green **Code** button →
**Download ZIP**. Unzip the file, for example on the Desktop. You get a folder called
`biostat-compass-main`.

**2. Check that Python is installed.** Python is free and is the simplest way to start the server.

| System  | How to open the terminal                  | Command to check Python |
| ------- | ----------------------------------------- | ----------------------- |
| Windows | Start menu → type `cmd` → press Enter     | `python --version`      |
| macOS   | Launchpad → type `Terminal` → press Enter | `python3 --version`     |
| Linux   | Search for "Terminal" in the applications | `python3 --version`     |

If you see something like `Python 3.12.4`, Python is installed. If you see an error, or on Windows
the Microsoft Store opens, install it from <https://www.python.org/downloads/>. On Windows, tick
**Add python.exe to PATH** on the first screen of the installer, then close and reopen the terminal.

**3. Open the terminal in the project folder.**

| System  | How                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------- |
| Windows | Open the `biostat-compass-main` folder, click the address bar at the top, type `cmd`, press Enter |
| macOS   | Right-click the folder in Finder → **New Terminal at Folder**                                     |
| Linux   | Right-click inside the folder → **Open in Terminal**                                              |

**4. Start the server.** Type this command and press Enter (on macOS and Linux write `python3`
instead of `python`):

```bash
python -m http.server 8765
```

The terminal shows a line like `Serving HTTP on :: port 8765`. Leave this window open: the app
works only while it runs.

**5. Open the app.** In your browser, go to <http://localhost:8765>.

**6. Stop the server.** When you have finished, go back to the terminal and press **Ctrl + C**, or
simply close the window.

### Checking the rules after a change

With the server running, open <http://localhost:8765/test/test.html>. The page checks every
possible combination of answers and must end with `RESULT: ALL OK`. If it shows errors, the
message says which file and which rule to fix. See [`rules/README.md`](rules/README.md) for how
the rule files work.

### Common problems

| What you see                                    | What to do                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| The page stays on "Loading the rules..."        | It was opened by double-click: start the server (step 4) and open <http://localhost:8765>                                      |
| `python` is not recognised                      | Install Python and tick "Add python.exe to PATH", or try `py -m http.server 8765` on Windows                                   |
| `Address already in use`                        | Another program uses port 8765: use another number, for example `python -m http.server 8800`, and open <http://localhost:8800> |
| After a change the app still shows the old text | Reload the page with **Ctrl + Shift + R** (on macOS **Cmd + Shift + R**)                                                       |

## Licence

Code under the MIT licence; rules and texts under CC BY 4.0. See [`LICENSE`](LICENSE).
