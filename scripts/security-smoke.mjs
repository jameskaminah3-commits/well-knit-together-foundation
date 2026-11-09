import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !publishableKey) {
  console.log("Supabase publishable environment is not configured; skipping anonymous RLS smoke checks.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, publishableKey, {
  auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
});

const publicChecks = ["programs", "stories", "products", "public_impact_metrics"];
const protectedChecks = [
  ["user_roles", "user_id"],
  ["support_request_notes", "id"],
  ["support_referrals", "id"],
  ["audit_logs", "id"],
  ["email_messages", "id"],
];
let failures = 0;

async function checkPublic(table) {
  const { error } = await supabase.from(table).select("id").limit(1);
  if (error) {
    failures += 1;
    console.error(`FAIL public read ${table}: ${error.message}`);
    return;
  }
  console.log(`PASS public read ${table}`);
}

async function checkProtected([table, column]) {
  const { data, error } = await supabase.from(table).select(column).limit(1);
  if (error && ![401, 403].includes(error.status ?? 0) && error.code !== "42501") {
    failures += 1;
    console.error(`FAIL protected read ${table}: ${error.message}`);
    return;
  }
  if (data?.length) {
    failures += 1;
    console.error(`FAIL protected read ${table}: anonymous data was returned`);
    return;
  }
  console.log(`PASS protected read ${table}`);
}

for (const table of publicChecks) await checkPublic(table);
for (const table of protectedChecks) await checkProtected(table);

if (failures) {
  console.error(`${failures} anonymous RLS smoke check(s) failed.`);
  process.exit(1);
}

console.log("Anonymous RLS smoke checks passed.");
