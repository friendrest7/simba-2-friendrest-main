import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, PRODUCTS, categoryLabel, formatRWF } from "@/lib/products";
import { useI18n } from "@/lib/i18n";
import { conversationalSearch } from "@/lib/demo-store";
import { formatSearchExplanation } from "@/lib/search-explanation";
import { useCart } from "@/lib/cart";
import { ArrowRight, Coins, Gem, SlidersHorizontal, Wallet, X } from "lucide-react";
import { validateShopSearch, type ShopSearchParams } from "@/routes/products";

type PriceRangeOption = {
  id: string;
  label: string;
  min?: number;
  max?: number;
  icon: typeof Wallet;
};

const PRICE_RANGE_OPTIONS: PriceRangeOption[] = [
  { id: "micro", label: "0 - 1,000 RWF", min: 0, max: 1000, icon: Wallet },
  { id: "daily", label: "1,000 - 10,000 RWF", min: 1000, max: 10000, icon: Coins },
  { id: "basket", label: "10,000 - 100,000 RWF", min: 10000, max: 100000, icon: Wallet },
  { id: "premium", label: "100,000+ RWF", min: 100000, icon: Gem },
];

export const Route = createFileRoute("/shop")({
  component: ShopPage,
  validateSearch: validateShopSearch,
  head: () => ({
    meta: [
      { title: "Shop - Simba Supermarket" },
      { name: "description", content: "Shop and filter products at Simba Supermarket Rwanda." },
    ],
  }),
});

function ShopPage() {
  const { t } = useI18n();
  const { selectedBranch, stockOf } = useCart();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");
  const [draftPrompt, setDraftPrompt] = useState(search.q ?? "");
  const cat = search.cat ?? "";
  const sort = search.sort ?? "popular";
  const inStockOnly = search.inStock === "1";
  const minPrice = search.min;
  const maxPrice = search.max;
  const [showFilters, setShowFilters] = useState(false);

  const updateSearch = (next: Partial<ShopSearchParams>) => {
    navigate({ search: (prev) => ({ ...prev, ...next }) as never });
  };

  const results = useMemo(() => {
    let list = q.trim() ? conversationalSearch(q, selectedBranch).products : [...PRODUCTS];
    if (cat) list = list.filter((p) => p.category === cat);
    if (inStockOnly) list = list.filter((p) => stockOf(p.id) > 0);
    if (minPrice !== undefined) list = list.filter((p) => p.price >= minPrice);
    if (maxPrice !== undefined) list = list.filter((p) => p.price <= maxPrice);
    switch (sort) {
      case "priceAsc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return list;
  }, [q, cat, sort, inStockOnly, minPrice, maxPrice, selectedBranch, stockOf]);

  const clearFilters = () => {
    setQ("");
    updateSearch({ q: undefined, cat: undefined, sort: "popular", inStock: undefined, min: undefined, max: undefined });
    setShowFilters(false);
  };

  const searchExplanation = useMemo(
    () => formatSearchExplanation(conversationalSearch(q || t("search.defaultTerms"), selectedBranch), t),
    [q, selectedBranch, t],
  );
  const promptSuggestions = useMemo(
    () => t("products.aiExamples")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3),
    [t],
  );

  const submitPrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = draftPrompt.trim();
    setQ(prompt);
    updateSearch({ q: prompt || undefined });
  };

  const isActiveRange = (option: PriceRangeOption) => minPrice === option.min && maxPrice === option.max;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight md:text-4xl">{t("section.allProducts")}</h1>

      <div className="mb-6 rounded-[2rem] border border-border bg-card p-5 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t("products.aiTitle")}</div>
        <h2 className="mt-1 text-2xl font-black tracking-tight">{selectedBranch}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("products.aiBody")}</p>
        <p className="mt-2 text-sm text-primary">{searchExplanation}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("products.aiExamples")}</p>
      </div>

      <div className="sticky top-16 z-30 mb-6 bg-background/92 py-3 backdrop-blur">
        <div className="grid gap-3 rounded-[1.75rem] border border-border/80 bg-card/95 p-3 shadow-sm md:p-4">
        <form onSubmit={submitPrompt} className="grid gap-3">
          <Textarea
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={t("hero.searchHint2")}
            rows={2}
            className="min-h-[76px] rounded-[1.25rem] border-input bg-muted/35 px-4 py-3 text-sm focus-visible:ring-primary/50 md:min-h-[88px] md:text-base"
          />
          <div className="flex flex-wrap gap-2">
            {promptSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setDraftPrompt(suggestion)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Button type="submit" className="h-11 rounded-full px-5 text-sm font-bold">
              {t("ui.searchButton")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <button onClick={() => setShowFilters(!showFilters)} type="button" className="flex h-11 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-sm text-secondary-foreground transition-colors hover:bg-secondary/80 md:hidden">
              <SlidersHorizontal className="h-5 w-5" />
              <span className="font-semibold">{t("ui.filters")}</span>
            </button>

            <div className="hidden items-center gap-3 md:flex">
              <select value={sort} onChange={(e) => updateSearch({ sort: e.target.value })} className="h-11 rounded-full border border-input bg-background px-4 text-sm font-medium text-foreground shadow-sm focus:border-primary/50 focus:ring-primary/50">
                <option value="popular">{t("sort.popular")}</option>
                <option value="priceAsc">{t("sort.priceAsc")}</option>
                <option value="priceDesc">{t("sort.priceDesc")}</option>
                <option value="name">{t("sort.name")}</option>
              </select>
            </div>
          </div>
        </form>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Price range</div>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                {minPrice !== undefined || maxPrice !== undefined
                  ? `Showing products ${minPrice !== undefined ? `from ${formatRWF(minPrice)}` : ""}${minPrice !== undefined && maxPrice !== undefined ? " to " : ""}${maxPrice !== undefined ? formatRWF(maxPrice) : "and above"}`
                  : "Open a focused price band in a new tab."}
              </p>
            </div>
          </div>
          <div className="-mx-1 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-3 px-1">
              {PRICE_RANGE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = isActiveRange(option);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateSearch({ min: option.min, max: option.max })}
                    className={`group flex min-w-[220px] flex-1 items-center gap-3 rounded-[1.5rem] border px-4 py-3 text-left shadow-sm transition md:min-w-[240px] ${active ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border bg-card text-foreground hover:border-primary/35 hover:bg-primary/5"}`}
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? "bg-white/16" : "bg-primary/10 text-primary"}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-black tracking-tight">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 bg-background/95 backdrop-blur transition-transform duration-300 ease-in-out md:hidden ${showFilters ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <h2 className="text-xl font-bold">{t("ui.filters")}</h2>
          <button onClick={() => setShowFilters(false)} className="p-2" aria-label={t("back")}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold">{t("nav.categories")}</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => updateSearch({ cat: undefined })} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${!cat ? "gradient-brand text-brand-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {t("filter.all")}
              </button>
              {CATEGORIES.map((c) => (
                <button key={c.slug} onClick={() => updateSearch({ cat: cat === c.name ? undefined : c.name })} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${cat === c.name ? "gradient-brand text-brand-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                  {c.emoji} {categoryLabel(c.name, t)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold">{t("ui.sortBy")}</h3>
            <select value={sort} onChange={(e) => updateSearch({ sort: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-4 text-base font-medium text-foreground shadow-sm focus:border-primary/50 focus:ring-primary/50">
              <option value="popular">{t("sort.popular")}</option>
              <option value="priceAsc">{t("sort.priceAsc")}</option>
              <option value="priceDesc">{t("sort.priceDesc")}</option>
              <option value="name">{t("sort.name")}</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-background p-4 text-base font-medium text-foreground shadow-sm">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => updateSearch({ inStock: e.target.checked ? "1" : undefined })} className="h-5 w-5 rounded border-input accent-primary" />
              {t("filter.inStock")}
            </label>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 p-4">
          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="outline" className="h-12 flex-1 rounded-full">{t("ui.clearAll")}</Button>
            <Button onClick={() => setShowFilters(false)} className="h-12 flex-1 rounded-full gradient-brand text-brand-foreground">{t("ui.showResults")}</Button>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto max-w-md rounded-[1.75rem] border border-border/70 bg-card p-8 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-foreground">{t("products.emptyTitle")}</h2>
            <p className="mt-3 text-lg text-muted-foreground">{t("ui.noProductsMatch")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("products.emptyBody")}
            </p>
          </div>
          <Link to="/shop" className="mt-4 inline-block font-semibold text-primary hover:underline">
            {t("ui.clearFiltersTryAgain")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
