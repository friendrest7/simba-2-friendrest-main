import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ProductCard } from "@/components/ProductCard";
import { SlideToVerify } from "@/components/SlideToVerify";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { CATEGORIES, PRODUCTS, STORE, categoryLabel, formatRWF } from "@/lib/products";
import {
  ArrowRight,
  Bike,
  Bot,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Store as StoreIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Simba Supermarket - Rwanda's Online Supermarket" },
      {
        name: "description",
        content:
          "Shop Simba Supermarket with a premium grocery experience, fast ordering, and delivery across Kigali.",
      },
    ],
  }),
});

const BRANCH_LOCATIONS = [
  {
    name: "Simba Kimironko",
    area: "Kimironko Branch",
    href: "https://www.google.com/maps/search/?api=1&query=Simba+Supermarket+Kimironko+Kigali+Rwanda",
  },
  {
    name: "Simba Kicukiro",
    area: "Kicukiro Branch",
    href: "https://www.google.com/maps/search/?api=1&query=Simba+Supermarket+Kicukiro+Kigali+Rwanda",
  },
  {
    name: "Simba Kacyiru",
    area: "Kacyiru / Kigali Heights",
    href: "https://www.google.com/maps/search/?api=1&query=Simba+Kigali+Heights+Kacyiru+Kigali+Rwanda",
  },
  {
    name: "Simba Kimihurura",
    area: "Kimihurura Branch",
    href: "https://www.google.com/maps/search/?api=1&query=Simba+Kimihurura+Kigali+Rwanda",
  },
  {
    name: "Simba City Centre",
    area: "Town / City Centre",
    href: "https://www.google.com/maps/search/?api=1&query=Simba+City+Center+Kigali+Rwanda",
  },
];

function HomePage() {
  const { count, subtotal } = useCart();

  return (
    <div className="pb-28">
      <LandingHero />
      <LocationsSection />
      <StickySearchRail />

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:gap-10 md:py-10">
        <QuickCategoryChips />
        <CategoryGrid />
        <BenefitsPanel />
        <ProductRail
          title="Popular tonight"
          subtitle="Fast-moving Simba picks customers reorder every week."
          products={PRODUCTS.slice(0, 10)}
          search={{}}
        />
        <ProductRail
          title="Pantry essentials"
          subtitle="Everyday groceries for breakfast, lunch, dinner, and top-ups."
          products={PRODUCTS.filter((product) => product.category === "Food Products").slice(0, 10)}
          search={{ cat: "Food Products" }}
        />
        <ProductRail
          title="Home care and cleaning"
          subtitle="Trusted home-care products for quick refill shopping."
          products={PRODUCTS.filter((product) => product.category === "Cleaning & Sanitary").slice(0, 10)}
          search={{ cat: "Cleaning & Sanitary" }}
        />
        <ProductRail
          title="Drinks and celebration"
          subtitle="Cold drinks, weekend extras, and hosting essentials."
          products={PRODUCTS.filter((product) => product.category === "Alcoholic Drinks").slice(0, 10)}
          search={{ cat: "Alcoholic Drinks" }}
        />
      </div>

      {count > 0 && <FloatingCartBar count={count} subtotal={subtotal} />}
    </div>
  );
}

function LandingHero() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [verified, setVerified] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      navigate({ to: "/products", search: { q: q.trim() } as never });
    }
  };

  return (
    <section className="relative min-h-[84vh] overflow-hidden text-white">
      <video
        src="/simba-landing-hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(7,39,28,0.88)_0%,rgba(8,62,40,0.76)_42%,rgba(7,31,23,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,213,79,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_30%)]" />

      <div className="relative mx-auto grid min-h-[84vh] max-w-7xl gap-8 px-4 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-brand-yellow" />
            Simba premium grocery delivery
          </div>

          <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
            <span className="block">SIMBA</span>
            <span className="block text-brand-yellow">SUPERMARKET</span>
          </h1>

          <div className="mt-5 inline-flex rounded-[1.6rem] border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
            <span className="text-xl font-extrabold italic text-brand-yellow sm:text-2xl">
              {t("hero.kicker")}
            </span>
          </div>

          <p className="mt-6 max-w-xl text-sm leading-7 text-white/82 sm:text-base">
            Shop groceries, drinks, and household essentials with a fast, polished,
            mobile-first supermarket experience built for Kigali.
          </p>

          <form onSubmit={handleSearch} className="mt-7">
            <div className="flex flex-col gap-3 rounded-[1.75rem] bg-white/95 p-2 shadow-[0_28px_90px_rgba(5,25,18,0.35)] sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search milk, bread, fruits, soda..."
                  className="h-12 border-0 bg-transparent px-0 text-base text-black shadow-none focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                className="h-12 rounded-2xl bg-primary px-6 text-sm font-extrabold text-primary-foreground hover:bg-primary/90"
              >
                {t("ui.searchButton")}
              </Button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {["Milk", "Rice", "Bread", "Fanta", "Cooking Oil"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => navigate({ to: "/products", search: { q: term } as never })}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/18"
              >
                {term}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-13 rounded-2xl bg-brand-yellow px-6 text-sm font-extrabold text-black hover:bg-brand-yellow/90"
            >
              <Link to="/products">
                Continue to Buy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-13 rounded-2xl border-white/20 bg-white/8 px-6 text-sm font-bold text-white hover:bg-white/12"
            >
              <Link to="/products" search={{ sort: "popular" } as never}>
                Open shopping UI
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow">
                  Checking robot
                </p>
                <h2 className="mt-2 text-2xl font-black">Secure entry before shopping</h2>
              </div>
              <div className="rounded-2xl bg-white/12 p-3">
                <Bot className="h-6 w-6 text-brand-yellow" />
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-white/78">
              A fast verification step keeps the storefront clean and makes the first
              interaction feel like a premium app flow instead of a generic landing page.
            </p>

            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow text-black shadow-lg">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-sm font-black">Simba Check Assistant</div>
                  <div className="text-xs text-white/70">
                    Robot check active {verified ? "• access ready" : "• waiting for verification"}
                  </div>
                </div>
              </div>

              <SlideToVerify onVerified={() => setVerified(true)} />

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-brand-yellow">
                    Shopping access
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {verified ? "Verified and ready to continue" : "Complete the check to unlock fast shopping"}
                  </div>
                </div>
                <Button
                  asChild
                  disabled={!verified}
                  className="rounded-xl bg-primary px-4 text-sm font-extrabold text-primary-foreground disabled:opacity-50"
                >
                  <Link to="/products">Continue to Buy</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PromoCard
              eyebrow="Simba basket"
              title="Real supermarket flow"
              body="Sticky search, floating product cards, fast add-to-cart controls, and smooth grocery browsing."
            />
            <PromoCard
              eyebrow="Delivery dashboard"
              title="Premium and practical"
              body="Designed to feel modern, clean, and conversion-focused on both mobile and desktop."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StickySearchRail() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      navigate({ to: "/products", search: { q: q.trim() } as never });
    }
  };

  return (
    <section className="sticky top-16 z-30 border-b border-border/70 bg-background/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 text-primary" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("ui.searchStore")}
            className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="sm" className="rounded-xl px-4 font-bold">
            {t("ui.searchButton")}
          </Button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {CATEGORIES.slice(0, 6).map((category) => (
            <Link
              key={category.slug}
              to="/category/$slug"
              params={{ slug: category.slug }}
              className="shrink-0 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition hover:bg-primary hover:text-primary-foreground"
            >
              {categoryLabel(category.name, t)}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function LocationsSection() {
  return (
    <section className="relative z-10 -mt-12 px-4 md:-mt-16">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-border/70 bg-card/96 p-5 shadow-[0_24px_70px_rgba(16,58,38,0.12)] backdrop-blur md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Our Locations</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
              Find a Simba branch near you
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Choose your nearest Simba Supermarket branch and open directions in Google Maps.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground">
            <ShoppingBasket className="h-4 w-4 text-primary" />
            Kigali branches
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {BRANCH_LOCATIONS.map((location) => (
            <a
              key={location.name}
              href={location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,246,241,0.95))] p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
              </div>
              <div className="mt-4 text-sm font-black leading-tight text-foreground">{location.name}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">{location.area}</div>
              <div className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Open in Google Maps
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickCategoryChips() {
  const { t } = useI18n();
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {t("ui.shopByMission")}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight md:text-2xl">
            {t("ui.jumpIntoAisle")}
          </h2>
        </div>
        <Link to="/products" className="hidden items-center gap-1 text-sm font-bold text-primary md:inline-flex">
          {t("ui.browseAll")}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {CATEGORIES.slice(0, 4).map((category) => (
          <Link
            key={category.slug}
            to="/category/$slug"
            params={{ slug: category.slug }}
            className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,246,241,0.95))] p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
          >
            <div
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-2xl"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {category.emoji}
            </div>
            <div className="mt-3 text-sm font-bold leading-tight">{categoryLabel(category.name, t)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {category.count} {t("section.items")}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BenefitsPanel() {
  const items = [
    {
      icon: <Clock3 className="h-5 w-5 text-primary" />,
      title: "Fast top-up orders",
      body: "Designed for quick weekly and same-day grocery runs.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
      title: "Reliable Simba selection",
      body: "Clear units, trusted brands, and stock-aware shopping.",
    },
    {
      icon: <Bike className="h-5 w-5 text-primary" />,
      title: "Mobile-first flow",
      body: "Search, add, and checkout with minimal friction on any screen.",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
            {item.icon}
          </div>
          <h3 className="mt-4 text-base font-black">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
        </div>
      ))}
    </section>
  );
}

function ProductRail({
  title,
  subtitle,
  products,
  search,
}: {
  title: string;
  subtitle: string;
  products: typeof PRODUCTS;
  search: Record<string, string>;
}) {
  const { t } = useI18n();
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-sm md:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight md:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link
          to="/products"
          search={search as never}
          className="hidden items-center gap-1 text-sm font-bold text-primary md:inline-flex"
        >
          {t("ui.viewAisle")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {products.map((product) => (
          <div key={product.id} className="w-[170px] shrink-0 sm:w-[185px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

function PromoCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">{eyebrow}</p>
      <h3 className="mt-2 text-lg font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/78">{body}</p>
    </div>
  );
}

function FloatingCartBar({
  count,
  subtotal,
}: {
  count: number;
  subtotal: number;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-[1.6rem] bg-[linear-gradient(135deg,var(--primary)_0%,color-mix(in_oklab,var(--primary)_74%,black)_100%)] px-4 py-3 text-primary-foreground shadow-[0_18px_60px_rgba(18,88,54,0.32)]">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">
            {count} {t("ui.itemsInCart")}
          </div>
          <div className="mt-1 text-lg font-black">{formatRWF(subtotal)}</div>
        </div>
        <Button
          asChild
          className="rounded-2xl bg-brand-yellow px-4 text-sm font-extrabold text-black hover:bg-brand-yellow/90"
        >
          <Link to="/cart">{t("ui.viewCart")}</Link>
        </Button>
      </div>
    </div>
  );
}
