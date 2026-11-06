# Making the tool citable

| Level                    | What it gives                                              | Status               |
| ------------------------ | ---------------------------------------------------------- | -------------------- |
| 1. CITATION.cff          | "Cite this repository" button on GitHub, in APA and BibTeX | Done                 |
| 2. DOI from Zenodo       | A permanent DOI for every version, citable in an article   | At the first release |
| 3. Peer-reviewed article | A classic, indexed citation                                | Optional             |

## 1. CITATION.cff

[`../CITATION.cff`](../CITATION.cff) gives the title, author (with ORCID), version, licence and links.
GitHub reads it and shows a "Cite this repository" button; Zenodo and reference managers read it too.
In the app, the **Cite** page gives APA, Vancouver, BibTeX and a ready sentence for the Methods
section, and every result shows the citation of the tool next to the original sources.

## 2. DOI from Zenodo

Zenodo (run by CERN) archives every GitHub release and gives it a free, permanent DOI. It reads
the metadata from `CITATION.cff`, including the ORCID, so the record is linked to the author's
ORCID profile.

Order of the steps: the repository must exist and be public before Zenodo can see it, and Zenodo
must be switched on before the release, because it archives only releases made after that.

1. **Repository.** Create the public GitHub repository `biostat-compass` and push the project.
2. **GitHub Pages.** Settings → Pages → Source "Deploy from a branch" → branch `main`, folder `/ (root)`.
   After a minute the app is at `https://cominerosbiostatistic.github.io/biostat-compass/`.
3. **Zenodo account.** Go to <https://zenodo.org>, choose **Log in → Log in with GitHub** and
   authorise Zenodo. In the Zenodo profile settings, link the ORCID as well.
4. **Switch the repository on.** In Zenodo, open the account menu → **GitHub**, press **Sync now**,
   and turn on the switch next to `CominErosBiostatistic/biostat-compass`.
5. **Release.** On GitHub: Releases → **Draft a new release** → tag `v0.1.0` → title
   `Biostat Compass 0.1.0` → a short description → **Publish release**.
6. **DOI.** After a few minutes the record appears in Zenodo (account menu → GitHub, or
   "My uploads"). Zenodo gives two DOIs:
   - the **version DOI**, for `v0.1.0` only;
   - the **concept DOI**, which always points to the latest version. This is the one for the app.
7. **Back in the project.** Put the concept DOI in `app.js` (`APP.doi`) and in `CITATION.cff`
   (`doi:`), add the DOI badge to the README, and publish the change.

For every new version: update the version in `app.js`, `sw.js`, `index.html` and `CITATION.cff`
(also `date-released`), then create a new release. Zenodo assigns the new version DOI automatically.

## 3. Article (optional)

| Journal                                          | Why it fits                                       | Notes                                                             |
| ------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------- |
| Journal of Open Source Software (JOSS)           | Short software paper, open review on GitHub, free | Needs software with a substantial research contribution and tests |
| Journal of Statistics and Data Science Education | Teaching tool for statistics students             | Needs an evaluation with students                                 |
| BMC Medical Research Methodology                 | Methods tool for clinical researchers             | Open access with a fee                                            |

An article needs more than the software: an evaluation, for example having students and
researchers use the app on real cases and comparing their choices with those of experienced
statisticians. It is worth planning early, because usage data must be collected under a protocol.

## Links

- Citation File Format: <https://citation-file-format.github.io>
- GitHub and CITATION.cff: <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-citation-files>
- Zenodo and GitHub: <https://help.zenodo.org/docs/github/>
- JOSS submission requirements: <https://joss.readthedocs.io/en/latest/submitting.html>
