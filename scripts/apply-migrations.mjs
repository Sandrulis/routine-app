import { readFileSync, readdirSync } from "fs";
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

function getConnectionCandidates(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const password = env.SUPABASE_DB_PASSWORD;
  const ssl = { rejectUnauthorized: false };

  if (!url || !password) {
    if (env.DATABASE_URL) {
      return [{ connectionString: env.DATABASE_URL, ssl, label: "DATABASE_URL" }];
    }
    console.error(
      "Missing DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local\n" +
        "Supabase Dashboard → Project Settings → Database → Database password",
    );
    process.exit(1);
  }

  const projectRef = getProjectRef(url);
  const region = env.SUPABASE_DB_REGION || "eu-west-1";
  const poolerUser = `postgres.${projectRef}`;
  const candidates = [];

  if (env.DATABASE_URL) {
    candidates.push({
      connectionString: env.DATABASE_URL,
      ssl,
      label: "DATABASE_URL",
    });
  }

  for (const aws of ["aws-0", "aws-1"]) {
    const host = `${aws}-${region}.pooler.supabase.com`;
    for (const port of [5432, 6543]) {
      candidates.push({
        user: poolerUser,
        password,
        host,
        port,
        database: "postgres",
        ssl,
        connectionTimeoutMillis: 15000,
        label: `${host}:${port}`,
      });
    }
  }

  candidates.push({
    user: "postgres",
    password,
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: "postgres",
    ssl,
    connectionTimeoutMillis: 15000,
    label: `db.${projectRef}.supabase.co:5432`,
  });

  return candidates;
}

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );

    alter table public.schema_migrations enable row level security;

    revoke all on table public.schema_migrations from anon, authenticated;
  `);

  await client.query(`
    drop policy if exists "schema_migrations deny clients" on public.schema_migrations;
  `);

  await client.query(`
    create policy "schema_migrations deny clients"
    on public.schema_migrations
    as restrictive
    for all
    to anon, authenticated
    using (false)
    with check (false);
  `);
}

async function markMigrationApplied(client, filename) {
  await client.query(
    `
      insert into public.schema_migrations (filename)
      values ($1)
      on conflict (filename) do nothing
    `,
    [filename],
  );
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query(
    `select filename from public.schema_migrations order by filename`,
  );

  return new Set(rows.map((row) => row.filename));
}

const env = loadEnv(".env.local");
const migrationsDir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("No migration files found.");
  process.exit(0);
}

const candidates = getConnectionCandidates(env);
let client;
let connectedVia = "";

for (const config of candidates) {
  const { label, ...clientConfig } = config;
  const attempt = new Client(clientConfig);

  try {
    await attempt.connect();
    client = attempt;
    connectedVia = label;
    break;
  } catch (error) {
    console.log(`Connect skip: ${error.message}`);
    await attempt.end().catch(() => {});
  }
}

if (!client) {
  console.error(
    "Could not connect to Supabase Postgres. Check SUPABASE_DB_PASSWORD, SUPABASE_DB_REGION, or set DATABASE_URL from Dashboard → Database → Connection string.",
  );
  process.exit(1);
}

try {
  console.log("Connected to Supabase Postgres via", connectedVia);

  await ensureMigrationTable(client);

  const applied = await getAppliedMigrations(client);
  const pending = files.filter((file) => !applied.has(file));

  if (pending.length === 0) {
    console.log("No pending migrations.");
    process.exit(0);
  }

  for (const file of pending) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`Applying ${file}...`);
    await client.query(sql);
    await markMigrationApplied(client, file);
    console.log(`OK — ${file}`);
  }

  console.log(`Applied ${pending.length} migration(s).`);

  try {
    await client.query("notify pgrst, 'reload schema'");
  } catch {
    // PostgREST notify is best-effort.
  }
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
