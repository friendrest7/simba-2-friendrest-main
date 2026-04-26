import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { SessionUser } from "@/lib/demo-store";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;
let clientPromise: Promise<SupabaseClient> | null = null;

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

function normalizeSiteUrl(value: string) {
  let url = value.trim();
  if (!url) {
    return "http://localhost:5173/";
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.endsWith("/") ? url : `${url}/`;
}

export function getPublicSiteUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return normalizeSiteUrl(window.location.origin);
  }

  const fallbackUrl =
    import.meta.env.VITE_PUBLIC_SITE_URL ??
    import.meta.env.VITE_SITE_URL ??
    "http://localhost:5173";

  return normalizeSiteUrl(fallbackUrl);
}

export function createBrowserRedirectUrl(
  path: string,
  search?: Record<string, string | undefined>,
) {
  const url = new URL(path.startsWith("/") ? path.slice(1) : path, getPublicSiteUrl());
  Object.entries(search ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export async function getSupabaseBrowserClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  if (!client) {
    clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(supabaseUrl!, supabasePublishableKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }),
    );
    client = await clientPromise;
  }

  return client;
}

export function supabaseUserToSessionUser(user: User): SessionUser {
  const metadata = user.user_metadata ?? {};
  const name =
    typeof metadata.name === "string" && metadata.name.trim()
      ? metadata.name.trim()
      : typeof metadata.full_name === "string" && metadata.full_name.trim()
        ? metadata.full_name.trim()
        : user.email?.split("@")[0] || "Simba Customer";

  const phone =
    typeof user.phone === "string" && user.phone.trim()
      ? user.phone
      : typeof metadata.phone === "string"
        ? metadata.phone
        : "";

  return {
    id: user.id,
    name,
    email: user.email || "",
    phone,
    role: "customer",
    branches: [],
  };
}

export async function getSupabaseSessionUser() {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user ? supabaseUserToSessionUser(session.user) : null;
}

export async function listenToSupabaseAuth(
  onChange: (nextUser: SessionUser | null, session: Session | null) => void,
) {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) return null;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session?.user ? supabaseUserToSessionUser(session.user) : null, session);
  });

  return subscription;
}
