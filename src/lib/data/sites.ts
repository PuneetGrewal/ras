// Reading construction sites. Sites are added and switched off in the Supabase dashboard;
// the app only reads them.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Site } from "@/lib/types";

// Sites crews can currently submit forms for, A–Z. Switched-off sites (is_active = false) are left out.
export async function getActiveSites(supabase: SupabaseClient): Promise<Site[]> {
  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("is_active", true)
    .order("name")
    .overrideTypes<Site[], { merge: false }>();
  if (error) throw new Error(`Could not load the sites: ${error.message}`);
  return data;
}

// Every site, A–Z, including switched-off ones: the dashboard's filter and summary still need
// sites that have old submissions.
export async function getAllSites(supabase: SupabaseClient): Promise<Site[]> {
  const { data, error } = await supabase.from("sites").select("*").order("name").overrideTypes<Site[], { merge: false }>();
  if (error) throw new Error(`Could not load the sites: ${error.message}`);
  return data;
}
