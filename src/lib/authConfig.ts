import { hasSupabaseConfig } from "@/lib/supabase";

export type AuthProviderId = "email" | "phone" | "google" | "facebook";

type ProviderStrategy =
  | "local-password"
  | "supabase-password"
  | "supabase-otp"
  | "google-identity"
  | "facebook-sdk"
  | "supabase-oauth";

type ProviderConfig = {
  enabled: boolean;
  strategy?: ProviderStrategy;
  reason?: string;
};

export type AuthConfig = {
  providers: {
    email: ProviderConfig;
    phone: ProviderConfig;
    google: ProviderConfig & { clientId?: string };
    facebook: ProviderConfig & { appId?: string };
  };
};

const warnedProviders = new Set<string>();

function envValue(value: string | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function envFlag(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes((value ?? "").trim().toLowerCase());
}

function supabaseProviderEnabled(provider: Exclude<AuthProviderId, "email">) {
  if (!hasSupabaseConfig()) {
    return false;
  }

  const configuredProviders = (envValue(import.meta.env.VITE_SUPABASE_AUTH_PROVIDERS) ?? "")
    .split(",")
    .map((item: string) => item.trim().toLowerCase())
    .filter(Boolean);

  return configuredProviders.includes(provider);
}

export function getAuthConfig(): AuthConfig {
  const supabaseReady = hasSupabaseConfig();
  const googleClientId = envValue(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const facebookAppId = envValue(import.meta.env.VITE_FACEBOOK_APP_ID);
  const supabaseGoogle = supabaseProviderEnabled("google");
  const supabaseFacebook = supabaseProviderEnabled("facebook");
  const phoneOtpEnabled = supabaseProviderEnabled("phone") || (supabaseReady && envFlag(import.meta.env.VITE_ENABLE_PHONE_OTP));
  const forceGoogleIdentity = envFlag(import.meta.env.VITE_FORCE_GOOGLE_IDENTITY);

  return {
    providers: {
      email: {
        enabled: true,
        strategy: supabaseReady ? "supabase-password" : "local-password",
      },
      phone: phoneOtpEnabled
        ? {
            enabled: true,
            strategy: "supabase-otp",
          }
        : {
            enabled: false,
            reason: "missing VITE_ENABLE_PHONE_OTP=true or VITE_SUPABASE_AUTH_PROVIDERS=phone",
          },
      google: supabaseGoogle && !forceGoogleIdentity
        ? {
            enabled: true,
            strategy: "supabase-oauth",
          }
        : googleClientId
        ? {
            enabled: true,
            strategy: "google-identity",
            clientId: googleClientId,
          }
          : {
              enabled: false,
              reason: "missing VITE_SUPABASE_AUTH_PROVIDERS=google or VITE_GOOGLE_CLIENT_ID",
            },
      facebook: supabaseFacebook
        ? {
            enabled: true,
            strategy: "supabase-oauth",
            appId: facebookAppId,
          }
        : facebookAppId
          ? {
              enabled: true,
              strategy: "facebook-sdk",
              appId: facebookAppId,
            }
          : {
              enabled: false,
              reason: "missing VITE_FACEBOOK_APP_ID or VITE_SUPABASE_AUTH_PROVIDERS=facebook",
            },
    },
  };
}

export function warnUnconfiguredAuthProviders(surface: string, providerIds: AuthProviderId[]) {
  if (!import.meta.env.DEV) {
    return;
  }

  const config = getAuthConfig();

  providerIds.forEach((providerId) => {
    const provider = config.providers[providerId];
    if (provider.enabled) {
      return;
    }

    const warningKey = `${surface}:${providerId}`;
    if (warnedProviders.has(warningKey)) {
      return;
    }

    warnedProviders.add(warningKey);
    const providerName = providerId.charAt(0).toUpperCase() + providerId.slice(1);
    console.warn(`${providerName} auth not configured: ${provider.reason}`);
  });
}
