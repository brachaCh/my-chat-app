import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Fallback values are only used during the build prerender pass.
  // At runtime, real env vars must be set in .env.local (dev) or Vercel (prod).
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

  return createBrowserClient(url, key);
}
