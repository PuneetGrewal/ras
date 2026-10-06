// Reading profiles (each person's name and role). Like every file in src/lib/data, it takes a
// Supabase client so the same function works on the server or in the browser.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

// The logged-in person's profile, or null when nobody is logged in.
export async function getCurrentProfile(supabase: SupabaseClient): Promise<Profile | null> {
  // getClaims() checks the login token's signature, so a forged cookie can't pass as a real user.
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError) console.error("Could not verify the login:", claimsError.message);
  const userId = claimsData?.claims.sub;
  if (!userId) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(`Could not load your profile: ${error.message}`);
  // Every login gets a profile from the database trigger, so a missing one means setup went wrong.
  if (!data) throw new Error("This login has no profile. Ask an admin to check the profiles table in Supabase.");
  return data;
}

// Everyone with the framer role, A–Z, for the dashboard's worker filter and "Not submitted today".
// The security rules only show admins other people's profiles.
export async function getFramers(supabase: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "framer")
    .order("full_name")
    .overrideTypes<Profile[], { merge: false }>();
  if (error) throw new Error(`Could not load the workers: ${error.message}`);
  return data;
}
