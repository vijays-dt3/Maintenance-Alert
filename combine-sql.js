const fs = require('fs');
const path = require('path');

const migrationDir = path.join(__dirname, 'supabase', 'migrations');
const seedFile = path.join(__dirname, 'supabase', 'seed', 'seed.sql');
const outputFile = path.join(__dirname, 'combined_migration.sql');

const files = fs.readdirSync(migrationDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

let out = '-- ================================================================\n';
out += '-- COMBINED MIGRATION FILE — Predictive Maintenance Alert System\n';
out += `-- Generated: ${new Date().toISOString()}\n`;
out += '-- Apply this entire file in the Supabase SQL Editor\n';
out += '-- ================================================================\n\n';

for (const file of files) {
  out += `\n-- ----------------------------------------------------------------\n`;
  out += `-- ${file}\n`;
  out += `-- ----------------------------------------------------------------\n`;
  out += fs.readFileSync(path.join(migrationDir, file), 'utf8');
  out += '\n';
}

out += `\n-- ----------------------------------------------------------------\n`;
out += `-- SEED DATA (Demo Equipment, Parameters, Spare Parts, Sample Alert)\n`;
out += `-- ----------------------------------------------------------------\n`;
out += fs.readFileSync(seedFile, 'utf8');

fs.writeFileSync(outputFile, out, 'utf8');
console.log(`Done! Combined file: ${outputFile}`);
console.log(`Total lines: ${out.split('\n').length}`);
