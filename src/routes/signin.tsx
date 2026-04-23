import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { getAuthConfig, warnUnconfiguredAuthProviders } from "@/lib/authConfig";
import { useI18n } from "@/lib/i18n";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import type { SessionUser } from "@/lib/demo-store";

type SignInSearch = { redirect?: string; intent?: AuthIntent };
type AuthTab = "signin" | "signup";
type AuthIntent = "client" | "admin";

const AUTH_INTENT_KEY = "simba.auth.intent";

export const Route = createFileRoute("/signin")({
  component: SignInPage,
  validateSearch: (s: Record<string, unknown>): SignInSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    intent: s.intent === "admin" || s.intent === "client" ? s.intent : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign in - Simba Supermarket" }] }),
});

function SignInPage() {
  const { t } = useI18n();
  const { user, hydrated, signIn, signUp, signInWithGoogle, signInWithFacebook, signOut } = useAuth();
  const navigate = useNavigate();
  const { redirect, intent } = useSearch({ from: "/signin" }) as SignInSearch;
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [authIntent, setAuthIntent] = useState<AuthIntent>("client");
  const [signInData, setSignInData] = useState({ credential: "", password: "" });
  const [signUpData, setSignUpData] = useState({ name: "", email: "", phone: "", password: "" });
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const authConfig = getAuthConfig();
  const emailProvider = authConfig.providers.email;
  const googleProvider = authConfig.providers.google;
  const facebookProvider = authConfig.providers.facebook;
  const hasSocialAuth = googleProvider.enabled || facebookProvider.enabled;

  const isAdminIntent = authIntent === "admin";

  const dashboardFor = (sessionUser: SessionUser | null) =>
    sessionUser?.role === "manager" || sessionUser?.role === "staff" ? "/admin-dashboard" : "/client-dashboard";

  const goNext = (sessionUser: SessionUser | null) => {
    navigate({ to: (redirect as "/checkout") || (dashboardFor(sessionUser) as "/client-dashboard") });
  };

  const switchAuthTab = (nextTab: AuthTab) => {
    setAuthError(null);
    setActiveTab(nextTab);
  };

  const validateIntentAndRoute = async (sessionUser: SessionUser | null, intent: AuthIntent) => {
    if (intent === "admin" && sessionUser?.role !== "manager" && sessionUser?.role !== "staff") {
      await signOut();
      setAuthError(t("auth.adminRequired"));
      return;
    }

    window.localStorage.removeItem(AUTH_INTENT_KEY);
    setAuthError(null);
    goNext(sessionUser);
  };

  useEffect(() => {
    if (intent) {
      setAuthIntent(intent);
    }
  }, [intent]);

  useEffect(() => {
    warnUnconfiguredAuthProviders("signin", ["google", "facebook"]);
  }, []);

  useEffect(() => {
    if (hydrated && user) {
      const storedIntent = (window.localStorage.getItem(AUTH_INTENT_KEY) as AuthIntent | null) ?? authIntent;
      void validateIntentAndRoute(user, storedIntent);
    }
  }, [hydrated, user]);

  useEffect(() => {
    if (googleProvider.strategy !== "google-identity" || !googleProvider.clientId || !googleButtonRef.current) {
      return;
    }

    const googleClientId = googleProvider.clientId;
    let cancelled = false;
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');

    const initialize = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          void (async () => {
            try {
              const supabase = await getSupabaseBrowserClient();
              if (supabase) {
                window.localStorage.setItem(AUTH_INTENT_KEY, authIntent);
                const { error } = await supabase.auth.signInWithIdToken({
                  provider: "google",
                  token: response.credential ?? "",
                });

                if (error) {
                  setAuthError(error.message || t("auth.supabaseGoogleFailed"));
                  return;
                }

                setAuthError(null);
                return;
              }

              const payload = parseGoogleCredential(response.credential);
              const result = await signInWithGoogle({
                email: payload.email,
                name: payload.name,
                googleSubject: payload.sub,
              });

              if (!result.ok) {
                setAuthError(t(result.error));
                return;
              }

              setAuthError(null);
              await validateIntentAndRoute(result.user, authIntent);
            } catch {
              setAuthError(t("auth.googleFailed"));
            }
          })();
        },
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: "100%",
        logo_alignment: "left",
      });
      setGoogleLoaded(true);
    };

    if (existingScript) {
      if (window.google?.accounts?.id) {
        initialize();
      } else {
        existingScript.addEventListener("load", initialize, { once: true });
      }

      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = initialize;
    script.onerror = () => setAuthError(t("auth.googleScriptFailed"));
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [googleProvider.clientId, googleProvider.strategy, signInWithGoogle, t]);

  const submitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const result = await signIn(signInData);
    if (!result.ok) {
      setAuthError(result.error.includes("auth.") ? t(result.error) : result.error);
      return;
    }
    await validateIntentAndRoute(result.user, authIntent);
  };

  const submitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const result = await signUp(signUpData);
    if (!result.ok) {
      setAuthError(result.error.includes("auth.") ? t(result.error) : result.error);
      return;
    }
    if (hasSupabaseConfig()) {
      setAuthError(t("auth.supabaseEmailConfirm"));
      return;
    }
    await validateIntentAndRoute(result.user, "client");
  };

  const signInWithGoogleProvider = async () => {
    if (googleProvider.strategy !== "supabase-oauth") {
      return;
    }

    setAuthError(null);
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    window.localStorage.setItem(AUTH_INTENT_KEY, authIntent);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });

    if (error) {
      setAuthError(error.message || t("auth.googleFailed"));
    }
  };

  const signInWithFacebookProvider = async () => {
    setAuthError(null);

    if (facebookProvider.strategy === "supabase-oauth") {
      const supabase = await getSupabaseBrowserClient();
      if (!supabase) {
        return;
      }

      window.localStorage.setItem(AUTH_INTENT_KEY, authIntent);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: window.location.href,
        },
      });

      if (error) {
        setAuthError(error.message || t("auth.facebookFailed"));
      }
      return;
    }

    if (facebookProvider.strategy !== "facebook-sdk" || !facebookProvider.appId) {
      return;
    }

    try {
      await loadFacebookSdk(facebookProvider.appId);
      window.FB?.login(
        (response) => {
          if (!response.authResponse) {
            setAuthError(t("auth.facebookFailed"));
            return;
          }

          window.FB?.api("/me", { fields: "id,name,email" }, (profile) => {
            void (async () => {
              if (!profile.id || !profile.name || !profile.email || profile.error) {
                setAuthError(t("auth.socialInvalidProfile"));
                return;
              }

              const result = await signInWithFacebook({
                email: profile.email,
                name: profile.name,
                facebookSubject: profile.id,
              });

              if (!result.ok) {
                setAuthError(t(result.error));
                return;
              }

              await validateIntentAndRoute(result.user, authIntent);
            })();
          });
        },
        { scope: "public_profile,email" },
      );
    } catch {
      setAuthError(t("auth.facebookFailed"));
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl items-center px-4 py-10">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[18%] top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[12%] top-1/3 h-80 w-80 rounded-full bg-brand-yellow/20 blur-3xl" />
      </div>

      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-border bg-[linear-gradient(150deg,rgba(9,61,40,0.98),rgba(9,43,31,0.95))] p-8 text-white shadow-2xl shadow-primary/10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
            <Sparkles className="h-4 w-4 text-brand-yellow" />
            Simba 2.0
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">{t("signin.title")}</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80">
            {redirect === "/checkout" ? t("signin.subtitleCheckout") : t("signin.subtitle")}
          </p>

          <div className="mt-8 grid gap-3">
            <Feature title={t("hero.trust.stock")} body={t("home.trust2")} />
            <Feature title={t("hero.trust.orders")} body={t("pickup.instructions")} />
            <Feature title={t("hero.trust.staff")} body={t("home.trust3")} />
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
            <div className="text-sm font-bold text-brand-yellow">{t("auth.demoAccounts")}</div>
            <div className="mt-3 space-y-2 text-sm text-white/80">
              <p>{t("auth.managerDemo")}</p>
              <p>{t("auth.staffDemo")}</p>
              <p className="text-white/65">{t("auth.passwordHint")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card/90 p-8 shadow-xl backdrop-blur">
          <Tabs value={activeTab} onValueChange={(value) => switchAuthTab(value as AuthTab)}>
            <TabsList className="grid w-full grid-cols-2 rounded-full">
              <TabsTrigger value="signin" className="gap-2 rounded-full">
                <LockKeyhole className="h-4 w-4" />
                {t("auth.signInTab")}
              </TabsTrigger>
              <TabsTrigger value="signup" className="gap-2 rounded-full">
                <UserRound className="h-4 w-4" />
                {t("auth.signUpTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={submitSignIn} className="mt-6 space-y-4">
                {hasSocialAuth && (
                  <>
                    <div className="space-y-3">
                      {googleProvider.strategy === "google-identity" && <div ref={googleButtonRef} className="min-h-11" />}
                      {googleProvider.strategy === "google-identity" && !googleLoaded && !authError && (
                        <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                          {t("auth.googleReady")}
                        </div>
                      )}
                      {googleProvider.strategy === "supabase-oauth" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-11 w-full rounded-full border-border bg-background text-foreground shadow-sm hover:bg-muted"
                          onClick={signInWithGoogleProvider}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-xs font-black text-[#4285f4]">
                            G
                          </span>
                          {t("signin.google")}
                        </Button>
                      )}
                      {facebookProvider.enabled && (
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-11 w-full rounded-full border-[#1877f2]/30 bg-[#1877f2] text-white shadow-sm hover:bg-[#166fe5] hover:text-white"
                          onClick={signInWithFacebookProvider}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-[#1877f2]">
                            f
                          </span>
                          {t("auth.facebook")}
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {t("signin.or")}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </>
                )}

                {emailProvider.enabled && (
                  <>
                    <div className="rounded-2xl border border-border bg-background p-3">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isAdminIntent}
                          onChange={(e) => setAuthIntent(e.target.checked ? "admin" : "client")}
                          className="mt-1 h-4 w-4 rounded border-input accent-primary"
                        />
                        <span>
                          <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            {t("auth.signInAsAdmin")}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {t("auth.adminHint")}
                          </span>
                        </span>
                      </label>
                    </div>

                    <div>
                      <Label htmlFor="credential">{t("auth.credential")}</Label>
                      <Input
                        id="credential"
                        required
                        value={signInData.credential}
                        onChange={(e) => setSignInData((current) => ({ ...current, credential: e.target.value }))}
                        placeholder="manager@simba.demo"
                        className="mt-1.5 h-11 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">{t("signin.password")}</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={signInData.password}
                        onChange={(e) => setSignInData((current) => ({ ...current, password: e.target.value }))}
                        placeholder={t("ui.passwordPlaceholder")}
                        className="mt-1.5 h-11 rounded-xl"
                      />
                    </div>
                  </>
                )}
                {authError && <AuthError message={authError} />}
                {emailProvider.enabled && (
                  <Button type="submit" size="lg" className="w-full rounded-full gradient-brand text-brand-foreground hover:opacity-90">
                    {t("signin.cta")}
                  </Button>
                )}
                <div className="text-center text-sm text-muted-foreground">
                  {t("auth.noAccount")}{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 font-semibold"
                    onClick={() => switchAuthTab("signup")}
                  >
                    {t("auth.signUpTab")}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={submitSignUp} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="name">{t("signin.name")}</Label>
                  <Input
                    id="name"
                    required
                    value={signUpData.name}
                    onChange={(e) => setSignUpData((current) => ({ ...current, name: e.target.value }))}
                    placeholder={t("signin.namePh")}
                    className="mt-1.5 h-11 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t("signin.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={signUpData.email}
                    onChange={(e) => setSignUpData((current) => ({ ...current, email: e.target.value }))}
                    placeholder={t("signin.emailPh")}
                    className="mt-1.5 h-11 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t("auth.phone")}</Label>
                  <Input
                    id="phone"
                    required
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData((current) => ({ ...current, phone: e.target.value }))}
                    placeholder="0788 000 000"
                    className="mt-1.5 h-11 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">{t("signin.password")}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    value={signUpData.password}
                    onChange={(e) => setSignUpData((current) => ({ ...current, password: e.target.value }))}
                    placeholder={t("ui.passwordPlaceholder")}
                    className="mt-1.5 h-11 rounded-xl"
                  />
                </div>
                {authError && <AuthError message={authError} />}
                <Button type="submit" size="lg" className="w-full rounded-full gradient-brand text-brand-foreground hover:opacity-90">
                  {t("auth.createAccount")}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  {t("auth.alreadyHaveAccount")}{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 font-semibold"
                    onClick={() => switchAuthTab("signin")}
                  >
                    {t("auth.signInTab")}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {!redirect && (
            <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <Mail className="h-4 w-4" />
              {t("signin.guest")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="mt-1 text-sm text-white/75">{body}</div>
    </div>
  );
}

function AuthError({ message }: { message: string }) {
  return <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{message}</div>;
}

function parseGoogleCredential(credential?: string) {
  if (!credential) {
    throw new Error("Missing credential");
  }

  const [, payload] = credential.split(".");
  if (!payload) {
    throw new Error("Invalid credential");
  }

  const decoded = JSON.parse(decodeBase64Url(payload)) as {
    sub?: string;
    email?: string;
    name?: string;
  };

  if (!decoded.sub || !decoded.email || !decoded.name) {
    throw new Error("Incomplete profile");
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
    name: decoded.name,
  };
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return decodeURIComponent(
    atob(padded)
      .split("")
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join(""),
  );
}

function loadFacebookSdk(appId: string) {
  if (window.FB) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-facebook-sdk="true"]');

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        cookie: true,
        xfbml: false,
        version: "v20.0",
      });
      resolve();
    };

    if (existingScript) {
      existingScript.addEventListener("load", () => window.FB && resolve(), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.dataset.facebookSdk = "true";
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
