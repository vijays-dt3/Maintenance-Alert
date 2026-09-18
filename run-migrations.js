/**
 * run-migrations.js
 * Executes all Supabase migrations using the pg-based REST SQL endpoint.
 * The Supabase project's service_role key IS accepted at the database REST endpoint.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Load env ────────────────────────────────────────────────────────────────
function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const trimmed = line.trim().replace(/\r$/, '');
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    });
    return env;
  } catch { return {}; }
}

const env = loadEnv(path.join(__dirname, 'apps', 'backend', '.env'));
const SUPABASE_URL = env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/backend/.env');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
console.log(`🔗  Project: ${projectRef}.supabase.co`);

// ─── Execute SQL via Supabase PostgREST "pg" endpoint ───────────────────────
// The /rest/v1/ endpoint does NOT accept raw SQL.
// Supabase exposes a raw SQL runner at: POST /pg -- but only via the CLI or direct DB URL.
//
// The correct approach without a PAT is to use the Supabase CLI or the Dashboard.
// We'll use the Supabase project's direct DB connection via pg-based URL if available,
// OR fall back to chunked HTTP calls to the REST endpoint via exec_sql RPC.

// Try the Supabase "pg" REST endpoint (available on hosted projects)
function executeSqlViaRpc(sql) {
  return new Promise((resolve, reject) => {
    const hostname = `${projectRef}.supabase.co`;
    const body = JSON.stringify({ query: sql });

    // Supabase exposes SQL execution via the pg endpoint on port 5432 REST proxy
    // The correct REST endpoint for arbitrary SQL is: /rest/v1/ + rpc/exec_sql
    // but that requires the function to exist first.
    // 
    // Instead, use the Supabase Management API which requires a Supabase PAT.
    // We'll prompt for the PAT below.

    const options = {
      hostname,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(body),
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ ok: res.statusCode < 300, status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Use Supabase Management API with PAT ────────────────────────────────────
// Read PAT from env (SUPABASE_ACCESS_TOKEN) or from a local file
const PAT = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN || '';

function executeSqlWithPat(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAT}`,
        'Content-Length': Buffer.byteLength(body),
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ ok: res.statusCode < 300, status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Migration files ─────────────────────────────────────────────────────────
const migrationDir = path.join(__dirname, 'supabase', 'migrations');
const migrations = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();
const seedPath = path.join(__dirname, 'supabase', 'seed', 'seed.sql');

async function runAll() {
  if (!PAT) {
    console.log('\n⚠️  No SUPABASE_ACCESS_TOKEN found.\n');
    console.log('The Supabase Management API requires a Personal Access Token (PAT).');
    console.log('Get one at: https://supabase.com/dashboard/account/tokens\n');
    console.log('Then either:');
    console.log('  1. Add to apps/backend/.env:  SUPABASE_ACCESS_TOKEN=sbp_...');
    console.log('  2. Or set env var: set SUPABASE_ACCESS_TOKEN=sbp_... && node run-migrations.js\n');
    
    // Still try the service_role RPC path as a fallback
    console.log('Trying service_role RPC path as fallback...\n');
  }

  const executor = PAT ? executeSqlWithPat : executeSqlViaRpc;
  const method = PAT ? 'Management API (PAT)' : 'RPC (service_role)';
  console.log(`📡  Using: ${method}\n`);

  let passed = 0, failed = 0;

  for (const file of migrations) {
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    process.stdout.write(`  ▶  ${file} ... `);
    try {
      const r = await executor(sql);
      if (r.ok) {
        console.log('✅  OK');
        passed++;
      } else {
        let msg = r.body;
        try { msg = JSON.parse(r.body)?.message || msg; } catch {}
        console.log(`⚠️  HTTP ${r.status}: ${String(msg).substring(0, 200)}`);
        failed++;
      }
    } catch (e) {
      console.log(`❌  ${e.message}`);
      failed++;
    }
  }

  // Seed
  if (fs.existsSync(seedPath)) {
    console.log('\n🌱  Running seed.sql ...');
    const sql = fs.readFileSync(seedPath, 'utf8');
    try {
      const r = await executor(sql);
      if (r.ok) { console.log('✅  Seed OK'); passed++; }
      else {
        let msg = r.body;
        try { msg = JSON.parse(r.body)?.message || msg; } catch {}
        console.log(`⚠️  Seed HTTP ${r.status}: ${String(msg).substring(0, 300)}`);
      }
    } catch (e) { console.log(`❌  Seed: ${e.message}`); }
  }

  console.log(`\n📊  Result: ${passed} succeeded, ${failed} failed.\n`);
}

runAll();
