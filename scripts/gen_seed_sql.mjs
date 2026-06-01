import { readFileSync, writeFileSync } from "node:fs";

const csv = readFileSync("translation_examples.csv", "utf8").replace(/^﻿/, "");

// Minimal RFC-4180-ish parser
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ""));
}

const rows = parseCsv(csv);
// Drop header row if it looks like a header
const dataRows = rows.filter((r, i) => !(i === 0 && /cantonese/i.test(r[0])));
const esc = (s) => `'${String(s).replace(/'/g, "''")}'`;
const values = dataRows
  .filter(r => r[0]?.trim() && r[1]?.trim())
  .map(r => `(${esc(r[0].trim())}, ${esc(r[1].trim())}, 'seed')`)
  .join(",\n");

const sql = `INSERT INTO examples (cantonese, traditional_chinese, source) VALUES\n${values};\n`;
writeFileSync("migrations/0002_seed_examples.sql", sql, "utf8");
const count = dataRows.filter(r => r[0]?.trim() && r[1]?.trim()).length;
console.log(`Wrote ${count} seed rows to migrations/0002_seed_examples.sql`);
