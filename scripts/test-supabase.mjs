import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";

const { Client } = pg;

function loadEnv(file) {
  const env = {};
  for (const line of readFileSync(join(process.cwd(), file), "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return env;
}

function getProjectRef(url) {
  try {
    return new URL(url).hostname.replace(/\.supabase\.co$/i, "");
  } catch {
    return url
      .replace(/^https?:\/\//, "")
      .replace(/\.supabase\.co.*/i, "");
  }
}

const env = loadEnv(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const password = env.SUPABASE_DB_PASSWORD;

if (!url || !password) {
  console.log("Supabase not configured — skipping db:test.");
  process.exit(0);
}

const projectRef = getProjectRef(url);
const encodedPassword = encodeURIComponent(password);
const region = env.SUPABASE_DB_REGION || "eu-west-1";
const candidates = env.DATABASE_URL
  ? [env.DATABASE_URL]
  : [
      `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
      `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
      `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
    ];

let client;
let connectedVia = "";

for (const connectionString of candidates) {
  const attempt = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await attempt.connect();
    client = attempt;
    connectedVia = connectionString.replace(/:([^:@/]+)@/, ":***@");
    break;
  } catch (error) {
    console.log(`Connect skip: ${error.message}`);
    await attempt.end().catch(() => {});
  }
}

if (!client) {
  console.error("db:test failed: could not connect to Supabase Postgres.");
  process.exit(1);
}

try {
  console.log("Connected to Supabase Postgres via", connectedVia);
  console.log("Project:", projectRef);

  const { rows: tables } = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);

  if (tables.length === 0) {
    console.log("public tables: (none)");
  } else {
    console.log(`public tables (${tables.length}):`);
    for (const row of tables) {
      console.log(`  - ${row.table_name}`);
    }
  }
} catch (error) {
  console.error("db:test failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
