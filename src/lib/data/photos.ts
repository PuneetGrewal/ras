// Photo files in the private 'submission-photos' Storage bucket: uploading them, and making
// short-lived links so a page can show them. Nothing in the bucket is ever public.
import type { SupabaseClient } from "@supabase/supabase-js";
import { PHOTO_BUCKET, SIGNED_URL_SECONDS } from "@/lib/constants";

// A photo ready to show: its link, or null when Storage couldn't make one (the gallery says so).
export type PhotoLink = { path: string; url: string | null };

// Uploads one photo. Storage refuses it unless the path's first folder is the uploader's own
// user id, and the bucket itself refuses non-images and files over 10 MB (see schema.sql).
export async function uploadPhoto(supabase: SupabaseClient, path: string, file: File) {
  return supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type });
}

// Links to the given photos that work for one hour. Made on the server for each page view,
// and Storage's rules only sign photos this user may see (their own, or all for admins).
export async function getSignedPhotoUrls(supabase: SupabaseClient, paths: string[]): Promise<PhotoLink[]> {
  if (paths.length === 0) return [];

  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) throw new Error(`Could not load the photos: ${error.message}`);

  return data.map((item, index) => {
    if (item.error) console.error(`Could not make a link for photo ${paths[index]}:`, item.error);
    return { path: paths[index], url: item.error ? null : item.signedUrl };
  });
}
