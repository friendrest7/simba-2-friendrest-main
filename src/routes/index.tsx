import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProductCard } from "@/components/ProductCard";
import { BranchReviews } from "@/components/BranchReviews";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { PICKUP_BRANCHES, type BranchName } from "@/lib/demo-store";
import { searchProducts } from "@/lib/products";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Simba Supermarket - Pickup-first grocery demo" },
      {
        name: "description",
        content:
          "Simba 2.0 is a pickup-first supermarket demo with branch-aware stock, checkout, dashboards, and multilingual support.",
      },
    ],
  }),
});

function HomePage() {
  const { t } = useI18n();
  const { selectedBranch, setSelectedBranch } = useCart();
  const navigate = useNavigate();
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const [q, setQ] = useState("");
  const [draftPrompt, setDraftPrompt] = useState("");

  const featuredResults = useMemo(
    () => searchProducts(q || t("landing.defaultSearch")).slice(0, 10),
    [q, t],
  );
  const promptSuggestions = t("landing.suggestions")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  useEffect(() => {
    if (heroVideoRef.current) {
      heroVideoRef.current.playbackRate = 0.55;
    }
  }, []);

  const submitPrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = draftPrompt.trim();
    setQ(prompt);
    navigate({ to: "/products", search: prompt ? ({ q: prompt } as never) : undefined });
  };

  return (
    <div>
      <section className="relative min-h-[52vh] overflow-hidden bg-[#071711] text-white md:min-h-[56vh]">
        <video
          ref={heroVideoRef}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-80"
          autoPlay
          muted
          defaultMuted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/simba.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,23,17,0.48)_0%,rgba(7,23,17,0.2)_42%,rgba(7,23,17,0.08)_100%),radial-gradient(circle_at_top_right,rgba(255,184,77,0.1),transparent_22%)]" />
        <div className="relative mx-auto flex min-h-[52vh] max-w-7xl flex-col justify-center px-4 py-8 md:min-h-[56vh] md:py-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-brand-yellow" />
              {t("hero.badge2")}
            </div>
          </div>

          <div className="mt-14 flex justify-start md:mt-16">
            <div className="w-full max-w-2xl rounded-[1.5rem] border border-white/12 bg-[rgba(255,255,255,0.08)] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">
                    {t("landing.panelLabel")}
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Store className="h-4 w-4 text-brand-yellow" />
                </div>
              </div>

              <form
                className="mt-3 grid gap-2.5 lg:grid-cols-[1.5fr_0.85fr] lg:items-start"
                onSubmit={submitPrompt}
              >
                <div className="grid gap-3">
                  <Textarea
                    value={draftPrompt}
                    onChange={(e) => setDraftPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder={t("landing.placeholder")}
                    rows={2}
                    className="min-h-[58px] rounded-[1.1rem] border-0 bg-white px-3.5 py-2.5 text-sm text-black shadow-none placeholder:text-black/45 focus-visible:ring-2 focus-visible:ring-brand-yellow/60"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {promptSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setDraftPrompt(suggestion)}
                        className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-white/85 transition hover:bg-white/14"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 lg:self-stretch">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value as BranchName)}
                    className="h-10 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white"
                  >
                    {PICKUP_BRANCHES.map((branch) => (
                      <option key={branch} value={branch} className="text-black">
                        {branch}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    className="h-10 rounded-xl bg-brand-yellow px-4 text-xs font-extrabold text-black shadow-lg shadow-black/20 hover:bg-brand-yellow/90"
                  >
                    {t("landing.startShopping")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-[11px] leading-5 text-white/72 lg:pt-0.5">
                    {t("landing.panelTitle")}
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {t("products.aiTitle")}
              </div>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                {t("products.resultsForBranch")} {selectedBranch}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("products.aiExamples")}</p>
            </div>
            <Link
              to="/products"
              search={{ q } as never}
              className="text-sm font-bold text-primary hover:underline"
            >
              {t("ui.browseAll")}
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {featuredResults.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-2">
        <BranchReviews branch={selectedBranch} />
      </section>
    </div>
  );
}
