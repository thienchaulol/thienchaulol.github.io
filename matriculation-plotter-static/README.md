# Matriculation Plotter (static version)

A standalone chart of college admit rate against SAT midpoint, with a five-year selector, 30 colleges, and a sortable data table.

## Included data

- Five annual reporting files: 2020–21 through 2024–25.
- 30 popular schools selected from the College Scorecard and IPEDS files. The original 20 are joined by Rice, Vanderbilt, Emory, Georgetown, Carnegie Mellon, Georgia Tech, UVA, UNC Chapel Hill, Wisconsin–Madison, and Illinois Urbana–Champaign.
- Applicants are included for all 30 schools and all five years. These counts come from the NCES IPEDS Admissions field `APPLCN` (first-time degree- or certificate-seeking undergraduate applicants), joined by institution ID.
- The 2020–21 through 2023–24 IPEDS files are final revised releases; the 2024–25 IPEDS file is provisional.
- No 2025–26 year is included because the official release contains no values for this chart's admissions and SAT fields for these schools yet.
- Missing/suppressed SAT percentiles remain null. These schools appear under “Not plotted” for the affected year.
- Average unweighted GPA and SAT submission percentages are not supplied by these files and remain null; this chart does not use GPA.
- SAT composite percentiles are approximations formed by adding the math and reading percentiles, as described on the page.

## Preview and data files

Open `index.html` directly. The JSON and metadata files are also in `data/`, while the five trimmed source CSVs (one row per selected school) are in `data/raw/`.

`build.js` embeds `data/colleges.json` and `data/meta.json` into `index.html`. After editing the JSON files, run `node build.js` to regenerate the standalone page. `add-year.js` can add or replace one year from a College Scorecard annual CSV. To populate applicants for a new year, join an IPEDS Admissions extract by `UNITID` and include it in the input as the optional `APPLCN` column.

The table starts sorted by admit rate, from low to high. Select a column heading to sort by that value; select it again to reverse the order. Schools with a missing value sort last.

## Source

Admit rate, SAT percentiles, and enrollment are from U.S. Department of Education, College Scorecard, annual institution-level files in the [November 2, 2026 bulk release](https://ed-public-download.scorecard.network/downloads/College_Scorecard_Raw_Data_11022026.zip). Applicant counts are from NCES [IPEDS Admissions data files](https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx?fromIpeds=true&gotoReportId=7&rtid=1&year=2024). See the [College Scorecard data portal](https://collegescorecard.ed.gov/data/) and [institution-level technical documentation](https://collegescorecard.ed.gov/assets/InstitutionDataDocumentation.pdf). Each college record links to its College Scorecard profile.
