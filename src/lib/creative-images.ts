// Public URLs for creative/hero images stored in the Supabase "Blogs" bucket.
// Upload a PNG named exactly <name>.png into that bucket and it appears on the
// matching page. Missing images are hidden gracefully by <SafeImage>.
const BLOGS = "https://lwworujvfttxkrjfrgav.supabase.co/storage/v1/object/public/Blogs";

/** Public URL for a creative image in the Supabase Blogs bucket (no extension). */
export function blogCreative(name: string): string {
  return `${BLOGS}/${encodeURIComponent(name)}.png`;
}
