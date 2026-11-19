#!/usr/bin/env node
// Copies data/colleges.json and data/meta.json into index.html so the page
// works when opened directly (no server needed). Run: node build.js
const fs = require("node:fs");
const path = require("node:path");

const dir = __dirname;
const colleges = JSON.parse(fs.readFileSync(path.join(dir, "data", "colleges.json"), "utf8"));
const meta = JSON.parse(fs.readFileSync(path.join(dir, "data", "meta.json"), "utf8"));

// "<" is escaped so no data value can ever close the script tag early.
const safe = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const block =
  "<!--DATA:START-->\n" +
  '<script id="college-data" type="application/json">' + safe(colleges) + "</script>\n" +
  '<script id="meta-data" type="application/json">' + safe(meta) + "</script>\n" +
  "<!--DATA:END-->";

const file = path.join(dir, "index.html");
const html = fs.readFileSync(file, "utf8");
const pattern = /<!--DATA:START-->[\s\S]*?<!--DATA:END-->/;
if (!pattern.test(html)) {
  console.error("Could not find the DATA:START / DATA:END markers in index.html");
  process.exit(1);
}
fs.writeFileSync(file, html.replace(pattern, () => block));
console.log("index.html updated with " + colleges.length + " colleges.");
