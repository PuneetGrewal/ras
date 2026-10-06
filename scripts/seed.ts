// Seed script: creates the test logins (1 admin + 5 framers), the construction sites and sample
// safety forms. Run with `npm run seed`. Safe to run again: anything that already exists is skipped.
// It talks to Supabase directly with the secret key (not via src/lib/data) because it is a one-off admin tool.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_FRAMER_PASSWORD } from "../src/lib/constants";
import { seedSubmissions } from "./seed-submissions";

config({ path: ".env.local", quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local (see .env.example).");
  process.exit(1);
}

// The secret key skips every security rule, which is why it is only ever used here, never in the app.
const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ADMIN_NAME = "Sarah Mitchell";
const FRAMER_NAMES = ["Jasdeep Sandhu", "Tyler Morrison", "Megan Chu", "Ryan Fraser", "Daniel Nguyen"];

const SITES = [
  { name: "Willoughby Townhomes", address: "208 St & 80 Ave, Langley, BC" },
  { name: "Clayton Heights Duplexes", address: "188 St & 72 Ave, Surrey, BC" },
  { name: "Lonsdale Mid-Rise", address: "E 15th St & Lonsdale Ave, North Vancouver, BC" },
  { name: "Brentwood Rental Building", address: "Willingdon Ave & Halifax St, Burnaby, BC" },
  { name: "Silver Valley Custom Home", address: "Silver Valley Rd, Maple Ridge, BC" },
];

// "Jasdeep Sandhu" → "jasdeep.sandhu@example.com"
function emailFor(fullName: string): string {
  return `${fullName.toLowerCase().replace(/ /g, ".")}@example.com`;
}

// Creates the login unless one with this email already exists; returns the user's id either way.
// The database trigger then creates their profile (always as a framer).
async function ensureUser(existing: Map<string, string>, email: string, password: string, fullName: string) {
  const existingId = existing.get(email);
  if (existingId) {
    console.log(`  skip  ${email} (already exists)`);
    return existingId;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`Could not create ${email}: ${error.message}`);
  console.log(`  added ${email}`);
  return data.user.id;
}

// Returns the framers' user ids, in FRAMER_NAMES order, for the sample forms.
async function seedUsers(): Promise<string[]> {
  console.log("Users:");
  // One page of up to 1000 users is plenty for a seed of six.
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Could not list users: ${error.message}`);
  const existing = new Map(data.users.map((user) => [user.email ?? "", user.id]));

  const adminId = await ensureUser(existing, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, ADMIN_NAME);
  // Everyone starts as a framer; promoting the admin is a separate, deliberate step.
  const { error: promoteError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", adminId);
  if (promoteError) throw new Error(`Could not make ${TEST_ADMIN_EMAIL} an admin: ${promoteError.message}`);
  console.log(`  ${TEST_ADMIN_EMAIL} is an admin`);

  const framerIds: string[] = [];
  for (const name of FRAMER_NAMES) {
    framerIds.push(await ensureUser(existing, emailFor(name), TEST_FRAMER_PASSWORD, name));
  }
  return framerIds;
}

// Returns the sites' ids, in SITES order, for the sample forms.
async function seedSites(): Promise<string[]> {
  console.log("Sites:");
  const { data, error } = await supabase.from("sites").select("id, name");
  if (error) throw new Error(`Could not read sites: ${error.message}`);
  const existingNames = new Set(data.map((site) => site.name));

  const missing = SITES.filter((site) => !existingNames.has(site.name));
  for (const site of SITES) {
    console.log(existingNames.has(site.name) ? `  skip  ${site.name} (already exists)` : `  added ${site.name}`);
  }
  const { data: added, error: insertError } = await supabase.from("sites").insert(missing).select("id, name");
  if (insertError) throw new Error(`Could not add sites: ${insertError.message}`);

  const idByName = new Map([...data, ...added].map((site) => [site.name, site.id]));
  return SITES.map((site) => idByName.get(site.name) as string);
}

async function main() {
  const framerIds = await seedUsers();
  const siteIds = await seedSites();
  await seedSubmissions(supabase, framerIds, siteIds);
  console.log("Seed complete.");
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
