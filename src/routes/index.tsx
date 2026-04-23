import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { BranchReviews } from "@/components/BranchReviews";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { conversationalSearch, getBranchReviewSummary, PICKUP_BRANCHES, type BranchName } from "@/lib/demo-store";
import { formatSearchExplanation } from "@/lib/search-explanation";
import { getBranchMapUrl } from "@/lib/branchLocations";

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
  const { count, subtotal, selectedBranch, setSelectedBranch } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const featuredSearch = useMemo(
    () => conversationalSearch(q || t("search.defaultTerms"), selectedBranch),
    [q, selectedBranch, t],
  );

  const featuredResults = featuredSearch.products.slice(0, 10);
  const heroSearchExplanation = useMemo(() => formatSearchExplanation(featuredSearch, t), [featuredSearch, t]);

  const openBranchMap = (branch: BranchName) => {
    setSelectedBranch(branch);
    if (window.confirm(`Open ${branch} branch in Google Maps?`)) {
      window.open(getBranchMapUrl(branch), "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="pb-24">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#083325_0%,#0b4f39_45%,#0a241b_100%)] text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-38"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/simba-landing-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,51,37,0.9),rgba(11,79,57,0.74)_48%,rgba(10,36,27,0.94)),radial-gradient(circle_at_top_right,rgba(255,184,77,0.2),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
              <ShieldCheck className="h-4 w-4 text-brand-yellow" />
              {t("hero.badge2")}
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.94] tracking-tight sm:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/82">{t("hero.body2")}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                t("hero.trust.stock"),
                t("hero.trust.orders"),
                t("hero.trust.staff"),
              ].map((signal) => (
                <div key={signal} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85">
                  {signal}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-2xl bg-brand-yellow px-6 text-sm font-extrabold text-black hover:bg-brand-yellow/90"
              >
                <Link to="/products">
                  {t("hero.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="text-sm text-white/70">
                {count > 0 ? `${count} items - ${subtotal.toLocaleString()} RWF` : t("pickup.free")}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">
                    {t("hero.searchLabel")}
                  </div>
                  <h2 className="mt-2 text-2xl font-black">{selectedBranch}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                  <Store className="h-6 w-6 text-brand-yellow" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_160px]">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("hero.searchHint2")}
                  className="h-12 rounded-2xl border-0 bg-white text-black shadow-none"
                />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value as BranchName)}
                  className="h-12 rounded-2xl border border-white/15 bg-white/10 px-3 text-sm font-semibold text-white"
                >
                  {PICKUP_BRANCHES.map((branch) => (
                    <option key={branch} value={branch} className="text-black">
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              <p className="mt-3 text-sm text-white/75">
                {heroSearchExplanation}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <TrustStat label={t("dashboard.orderCount")} value="nyabyo" helper={t("home.trust1")} />
              <TrustStat label={t("pickup.branchStock")} value="bihari" helper={t("home.trust2")} />
              <TrustStat label={t("app.dashboard")} value="abakozi" helper={t("home.trust3")} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t("home.branchTitle")}</div>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{t("home.branchBody")}</h2>
            </div>
            <div className="text-sm text-muted-foreground">{t("home.trustTitle")}</div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PICKUP_BRANCHES.map((branch) => {
              const summary = getBranchReviewSummary(branch);
              const active = branch === selectedBranch;

              return (
                <button
                  key={branch}
                  type="button"
                  onClick={() => openBranchMap(branch)}
                  className={`rounded-[1.5rem] border p-4 text-left transition ${active ? "border-primary bg-primary/6 shadow-md" : "border-border bg-background hover:border-primary/30"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-black">{branch}</div>
                    {active && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    {summary.count > 0 ? `${summary.average.toFixed(1)} / 5` : "ishami rishya"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-2">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard title={t("home.trust1")} body={t("home.trustBody")} />
          <InfoCard title={t("home.trust2")} body={t("pickup.instructions")} />
          <InfoCard title={t("home.trust3")} body={t("dashboard.subtitle")} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t("products.aiTitle")}</div>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{t("products.resultsForBranch")} {selectedBranch}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("products.aiExamples")}</p>
            </div>
            <Link to="/products" search={{ q } as never} className="text-sm font-bold text-primary hover:underline">
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

function TrustStat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 text-white backdrop-blur">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <div className="mt-2 text-sm text-white/70">{helper}</div>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
      <div className="text-base font-black">{title}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
