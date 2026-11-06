"""Builds rules/sources.json from the bibliography of the literature review.

Usage: python tools/build_sources.py research/literature-review.md rules/sources.json
Add the id of a new source at the end of IDS, in the same order as the bibliography.
"""
import json
import re
import sys

src, dst = sys.argv[1], sys.argv[2]

# Short id for each bibliography number (author + year), used by the rule files
IDS = """hernan2019 shmueli2010 ramspek2021 vansmeden2021 hernan2018 westreich2013 tennant2021
vanderweele2019 lederer2019 hernan2016 hernan2022 cashin2025 austin2011 heinze2018 sauerbrei2020
peduzzi1996 vittinghoff2007 vansmeden2016 vansmeden2019 riley2019 riley2020 riley2021 vanderploeg2014
christodoulou2019 collins2024tripod moons2025 collins2024eval efthimiou2024 steyerberg2014 vancalster2019
vickers2006 schober2021logistic norton2018 davies1998 holcomb2001 knol2012cmaj zhang1998 zou2004
cummings2009 ranganathan2015 doi2022 windish2007 akl2011 gigerenzer2007 schober2018survival hernan2010
stensrud2020 royston2013 uno2014 austin2016 andersen2012 latouche2013 austin2017 schober2018repeated
detry2016 hubbard2010 schober2021count coxe2009 liu2017 bland1986 koo2016 schober2018corr kim2017
mishra2019 altman2006 royston2006 sterne2009 white2011 lee2021 greenland2016pvalues wasserstein2016
greenland2016sparse knol2012interaction kahan2014 kahan2024 hopewell2025 chan2025 vonelm2007
benchimol2015 bossuyt2015 lang2015 assel2019 gamble2017 grant2019 harrell2015 austin2015 heinze2002
mchugh2012""".split()

text = open(src, encoding="utf-8").read()
bibliography = text.split("## Bibliography", 1)[1]
sources = []
for m in re.finditer(r"^(\d+)\. (.+)$", bibliography, flags=re.M):
    number, ref = int(m.group(1)), m.group(2)
    pmid = re.search(r"PMID (\d+)", ref)
    doi = re.search(r"doi:(\S+)", ref)
    sources.append({
        "id": IDS[number - 1],
        "number": number,
        # Citation without PMID, DOI and markers, which the app shows as links
        "citation": re.sub(r"\s*(PMID \d+\.|doi:\S+|`\[not in PubMed\]`)", "", ref).replace("*", "").strip(),
        "pmid": pmid.group(1) if pmid else None,
        "doi": doi.group(1) if doi else None,
        "pubmed": bool(pmid),
    })

assert len(sources) == len(IDS), (len(sources), len(IDS))
assert len(set(IDS)) == len(IDS), "duplicate ids"
with open(dst, "w", encoding="utf-8", newline="\n") as f:
    json.dump({"version": "0.1", "sources": sources}, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(len(sources), "sources written")
