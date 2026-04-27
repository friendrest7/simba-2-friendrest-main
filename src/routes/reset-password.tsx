import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Reset password - Simba Supermarket" }] }),
});

function ResetPasswordPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    void (async () => {
      if (!hasSupabaseConfig()) {
        if (active) {
          setReady(false);
          setLoading(false);
        }
        return;
      }

      const supabase = await getSupabaseBrowserClient();
      if (!supabase || !active) {
        return;
      }

      const checkSession = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        setReady(Boolean(session));
        setLoading(false);
      };

      await checkSession();

      const authState = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) {
          return;
        }
        setReady(Boolean(session));
        setLoading(false);
      });

      subscription = authState.data.subscription;
      window.setTimeout(() => {
        void checkSession();
      }, 600);
    })();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t("auth.resetPasswordLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    const supabase = await getSupabaseBrowserClient();
    if (!supabase) {
      setError(t("auth.resetUnavailable"));
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || t("auth.resetFailed"));
      setSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    setUpdated(true);
    setSubmitting(false);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center px-4 py-10">
      <div className="w-full rounded-[2rem] border border-border bg-card p-8 shadow-xl">
        {updated ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight">{t("auth.resetSuccess")}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{t("auth.resetSuccessBody")}</p>
            <Button
              asChild
              size="lg"
              className="mt-6 rounded-full gradient-brand text-brand-foreground hover:opacity-90"
            >
              <Link to="/signin">{t("auth.backToSignIn")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <ShieldCheck className="h-4 w-4" />
              Simba
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight">{t("auth.resetTitle")}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{t("auth.resetBody")}</p>

            {loading ? (
              <div className="mt-6 rounded-2xl border border-border bg-background px-4 py-5 text-sm text-muted-foreground">
                {t("auth.resetChecking")}
              </div>
            ) : !ready ? (
              <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-5 text-sm text-destructive">
                {t("auth.resetInvalidSession")}
              </div>
            ) : (
              <form onSubmit={submitReset} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="new-password">{t("auth.resetNewPassword")}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("ui.passwordPlaceholder")}
                    className="mt-1.5 h-11 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">{t("auth.resetConfirmPassword")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("ui.passwordPlaceholder")}
                    className="mt-1.5 h-11 rounded-xl"
                  />
                </div>
                {error && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full gradient-brand text-brand-foreground hover:opacity-90"
                  disabled={submitting}
                >
                  {submitting ? t("ui.processing") : t("auth.resetSubmit")}
                </Button>
              </form>
            )}

            <Link
              to="/signin"
              className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              {t("auth.backToSignIn")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
