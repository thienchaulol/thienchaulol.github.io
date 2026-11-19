#!/usr/bin/env node
// Adds (or replaces) one year of College Scorecard data for the schools already in data/colleges.json.
//
//   node add-year.js <scorecard.csv> <year-id> "<label>" ["note"]
//   node add-year.js --drop <year-id>
//
// Example:
//   node add-year.js scorecard-2022-23.csv 2022-23 "2022–23" "College Scorecard file for 2022-23"
//
// The CSV needs these columns: INSTNM, ADM_RATE, SATMT25, SATMT75, SATVR25, SATVR75, UGDS.
// APPLCN is optional; College Scorecard's annual file does not include it, so add it from IPEDS Admissions if available.
// Schools are matched on INSTNM (ignoring case and extra spaces). Unmatched or duplicate names are listed so
// you can fix them. Blank, NULL and PrivacySuppressed values are stored as null (the school is then left off
// the chart for that year and shown under "Not plotted").
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const dataDir = path.join(__dirname, "data");
const collegesPath = path.join(dataDir, "colleges.json");
const metaPath = path.join(dataDir, "meta.json");
const colleges = JSON.parse(fs.readFileSync(collegesPath, "utf8"));
const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
meta.years = meta.years || [];

function save() {
  fs.writeFileSync(collegesPath, JSON.stringify(colleges, null, 2));
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  execFileSync(process.execPath, [path.join(__dirname, "build.js")], { stdio: "inherit" });
}

const args = process.argv.slice(2);

if (args[0] === "--drop") {
  const id = args[1];
  if (!id) { console.error("Usage: node add-year.js --drop <year-id>"); process.exit(1); }
  colleges.forEach((c) => { if (c.years) delete c.years[id]; });
  meta.years = meta.years.filter((y) => y.id !== id);
  save();
  console.log('Removed year "' + id + '".');
  process.exit(0);
}

const [csvPath, id, label, note] = args;
if (!csvPath || !id || !label) {
  console.error('Usage: node add-year.js <scorecard.csv> <year-id> "<label>" ["note"]');
  process.exit(1);
}
if (!/^[A-Za-z0-9-]+$/.test(id)) {
  console.error("The year id may only contain letters, digits and hyphens (for example 2022-23).");
  process.exit(1);
}

function parseCsv(text) {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false; }
      else field += ch;
      continue;
    }
    if (ch === '"' && field.length === 0) quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      row.push(field); rows.push(row); row = []; field = "";
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
    } else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v !== ""));
}

const rows = parseCsv(fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, ""));
const header = rows[0].map((h) => h.trim());
const need = ["INSTNM", "ADM_RATE", "SATMT25", "SATMT75", "SATVR25", "SATVR75", "UGDS"];
const missingCols = need.filter((c) => !header.includes(c));
if (missingCols.length) { console.error("The CSV is missing columns: " + missingCols.join(", ")); process.exit(1); }
const col = Object.fromEntries(header.map((h, i) => [h, i]));
const norm = (s) => String(s).replace(/\s+/g, " ").trim().toLowerCase();
const toNum = (v) => {
  if (v == null) return null;
  const t = String(v).trim();
  if (t === "" || /^(null|na|n\/a|privacysuppressed)$/i.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const byName = new Map();
for (const r of rows.slice(1)) {
  const key = norm(r[col.INSTNM] || "");
  if (!byName.has(key)) byName.set(key, []);
  byName.get(key).push(r);
}

const unmatched = [], duplicates = [];
for (const c of colleges) {
  const hits = byName.get(norm(c.name)) || [];
  if (hits.length === 0) { unmatched.push(c.name); continue; }
  if (hits.length > 1) { duplicates.push(c.name); continue; }
  const r = hits[0];
  const mt25 = toNum(r[col.SATMT25]), mt75 = toNum(r[col.SATMT75]);
  const vr25 = toNum(r[col.SATVR25]), vr75 = toNum(r[col.SATVR75]);
  c.years = c.years || {};
  c.years[id] = {
    sat_math_25: mt25, sat_math_75: mt75, sat_reading_25: vr25, sat_reading_75: vr75,
    sat_25: mt25 != null && vr25 != null ? mt25 + vr25 : null,
    sat_75: mt75 != null && vr75 != null ? mt75 + vr75 : null,
    sat_note: "approximate composite",
    admit_rate: toNum(r[col.ADM_RATE]),
    undergraduate_enrollment: toNum(r[col.UGDS]),
    applicants: col.APPLCN == null ? null : toNum(r[col.APPLCN]),
    pct_submitting_sat: null,
    avg_gpa_unweighted: null,
  };
}

const entry = { id, label, note: note || "" };
const at = meta.years.findIndex((y) => y.id === id);
if (at === -1) meta.years.push(entry); else meta.years[at] = entry;
meta.years.sort((a, b) => a.id.localeCompare(b.id));

save();
console.log('Year "' + id + '" saved for ' + (colleges.length - unmatched.length - duplicates.length) + " of " + colleges.length + " schools.");
if (unmatched.length) console.log("No match in the CSV (check spelling, add them by hand if needed):\n  - " + unmatched.join("\n  - "));
if (duplicates.length) console.log("More than one row matched (skipped, needs a manual check):\n  - " + duplicates.join("\n  - "));
