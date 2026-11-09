import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const rawUsers = process.env.RLS_TEST_USERS_JSON;

if (!supabaseUrl || !publishableKey || !rawUsers) {
  console.log("RLS test accounts are not configured; skipping authenticated role matrix.");
  process.exit(0);
}

let testUsers;
try {
  testUsers = JSON.parse(rawUsers);
} catch {
  console.error("RLS_TEST_USERS_JSON must be valid JSON.");
  process.exit(1);
}

if (!Array.isArray(testUsers) || !testUsers.length) {
  console.error("RLS_TEST_USERS_JSON must contain at least one test account.");
  process.exit(1);
}

let failures = 0;

function isPrivileged(roles) {
  return roles.includes("admin") || roles.includes("superadmin");
}

async function checkRoleAccount(account) {
  if (!account?.email || !account?.password || !Array.isArray(account.roles) || !account.roles.length) {
    failures += 1;
    console.error("FAIL role matrix account: each account needs email, password, and roles.");
    return;
  }

  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { data: authData, error: authError } = await client.auth.signInWithPassword({ email: account.email, password: account.password });
  if (authError || !authData.user) {
    failures += 1;
    console.error(`FAIL ${account.label ?? "role account"}: sign-in was not successful.`);
    return;
  }

  const { data: roleRows, error: roleError } = await client.from("user_roles").select("role").eq("user_id", authData.user.id);
  const actualRoles = (roleRows ?? []).map((row) => row.role);
  if (roleError || account.roles.some((role) => !actualRoles.includes(role))) {
    failures += 1;
    console.error(`FAIL ${account.label ?? "role account"}: expected role membership was not returned.`);
  } else {
    console.log(`PASS ${account.label ?? "role account"}: authenticated as ${actualRoles.join(", ")}.`);
  }

  const { data: ownProfile, error: profileError } = await client.from("profiles").select("id").eq("id", authData.user.id).limit(1);
  if (profileError || ownProfile?.length !== 1) {
    failures += 1;
    console.error(`FAIL ${account.label ?? "role account"}: own profile boundary was not returned.`);
  }

  if (!isPrivileged(account.roles)) {
    const restrictedTables = ["audit_logs", "email_messages"];
    if (!account.roles.includes("program_manager")) restrictedTables.push("support_request_notes");
    for (const table of restrictedTables) {
      const { data, error } = await client.from(table).select("id").limit(1);
      if (error && ![401, 403].includes(error.status ?? 0) && error.code !== "42501") {
        failures += 1;
        console.error(`FAIL ${account.label ?? "role account"}: ${table} probe errored unexpectedly.`);
      } else if (data?.length) {
        failures += 1;
        console.error(`FAIL ${account.label ?? "role account"}: ${table} returned restricted data.`);
      }
    }
  }

  await client.auth.signOut();
}

for (const account of testUsers) await checkRoleAccount(account);

if (failures) {
  console.error(`${failures} authenticated RLS matrix check(s) failed.`);
  process.exit(1);
}

console.log("Authenticated RLS role matrix checks passed.");
