/**
 * Reset all teams to 0 paid seats. Cancels active Stripe subscriptions first,
 * otherwise /team/billing reconcile restores counts from Stripe.
 *
 * Usage: node scripts/reset-all-team-billing.mjs
 */
import { createDecipheriv, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import Stripe from "stripe";

const { Client } = pg;
const PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const DEV_FALLBACK = "routine-app-dev-secrets";

function loadEnv(file) {
  const env = {};
  for (const line of readFileSync(join(process.cwd(), file), "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return env;
}

function keyFromMaterial(raw) {
  return createHash("sha256").update(`routine-app-secrets:${raw}`).digest();
}

function decryptSecret(value, materials) {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  if (!raw.startsWith(PREFIX)) return raw;
  const packed = Buffer.from(raw.slice(PREFIX.length), "base64url");
  for (const material of materials) {
    try {
      const iv = packed.subarray(0, IV_LENGTH);
      const tag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const encrypted = packed.subarray(IV_LENGTH + TAG_LENGTH);
      const decipher = createDecipheriv("aes-256-gcm", keyFromMaterial(material), iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    } catch {
      continue;
    }
  }
  throw new Error("Could not decrypt Stripe secret");
}

async function cancelTeamSubscriptions(stripe, team) {
  const canceled = [];
  const statuses = ["active", "trialing", "past_due", "unpaid"];

  if (team.stripe_customer_id) {
    const listed = await stripe.subscriptions.list({
      customer: team.stripe_customer_id,
      status: "all",
      limit: 100,
    });
    for (const sub of listed.data) {
      if (!statuses.includes(sub.status)) continue;
      if (sub.metadata?.teamId && sub.metadata.teamId !== team.id) continue;
      await stripe.subscriptions.cancel(sub.id);
      canceled.push(sub.id);
    }
  }

  const searched = await stripe.subscriptions.search({
    query: `metadata['teamId']:'${team.id}'`,
    limit: 20,
  });
  for (const sub of searched.data) {
    if (canceled.includes(sub.id)) continue;
    if (!statuses.includes(sub.status)) continue;
    await stripe.subscriptions.cancel(sub.id);
    canceled.push(sub.id);
  }

  return canceled;
}

const env = loadEnv(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const password = env.SUPABASE_DB_PASSWORD;
if (!url || !password) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const decryptMaterials = [
  env.INTEGRATION_SECRETS_KEY,
  env.SUPABASE_SERVICE_ROLE_KEY,
  DEV_FALLBACK,
].filter(Boolean);

const projectRef = new URL(url).hostname.replace(/\.supabase\.co$/i, "");
const region = env.SUPABASE_DB_REGION || "eu-west-1";
const client = new Client({
  connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const stripeRow = await client.query(
  `select client_secret, is_enabled from site_integrations where integration_key = 'stripe'`,
);
const stripeSecret = decryptSecret(stripeRow.rows[0]?.client_secret, decryptMaterials);
if (!stripeSecret?.startsWith("sk_")) {
  console.error("Stripe secret not found or invalid");
  process.exit(1);
}
const stripe = new Stripe(stripeSecret);

const teams = await client.query(
  `select id, name, stripe_customer_id, paid_seat_count, stripe_subscription_id from teams order by name`,
);

for (const team of teams.rows) {
  const canceled = await cancelTeamSubscriptions(stripe, team);
  console.log(`${team.name}: canceled Stripe subs`, canceled.length ? canceled : "(none)");
}

const updated = await client.query(`
  update teams set
    paid_seat_count = 0,
    early_bird_seat_count = 0,
    stripe_subscription_id = null,
    billing_cycle_end = null,
    payment_plan_paid = false,
    payment_plan_is_trial = false
  returning id, name, paid_seat_count, stripe_subscription_id, billing_cycle_end
`);
console.log("DB reset:", updated.rows);

const members = await client.query(`
  update team_members set seat_status = 'active'
  where coalesce(seat_status, 'active') = 'pending_payment'
  returning id
`);
console.log("Pending members reset:", members.rowCount);

await client.end();
console.log("Done. Hard-refresh /team/billing.");
