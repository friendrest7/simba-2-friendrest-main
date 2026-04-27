import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { categoryBySlug, categoryLabel, productsByCategorySlug } from "@/lib/products";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
  loader: ({ params }) => {
    const cat = categoryBySlug(params.slug);
    if (!cat) throw notFound();
    return { cat, products: productsByCategorySlug(params.slug) };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.cat.name ?? "Category"} - Simba Supermarket` },
      {
        name: "description",
        content: `Shop ${loaderData?.cat.name ?? "products"} at Simba Supermarket Rwanda.`,
      },
    ],
  }),
  notFoundComponent: () => <CategoryNotFound />,
});

function CategoryNotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">{t("category.notFound")}</h1>
      <Link to="/" className="mt-4 inline-block font-semibold text-primary">
        {t("back.home")}
      </Link>
    </div>
  );
}

function CategoryPage() {
  const { cat, products: allProducts } = Route.useLoaderData();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = useMemo(() => {
    let list = [...allProducts];
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term),
      );
    }
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
  }, [allProducts, q, sort]);

  const clearFilters = () => {
    setQ("");
    setSort("popular");
    setShowFilters(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" /> {t("ui.backToCategories")}
      </Link>

      <div
        className="relative mb-8 overflow-hidden rounded-3xl border border-border p-8 shadow-sm md:p-12"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklab, ${cat.color} 22%, var(--card)), var(--card))`,
        }}
      >
        <div
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
          style={{ background: cat.color }}
        />
        <div className="text-6xl">{cat.emoji}</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight">{categoryLabel(cat.name, t)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {allProducts.length} {t("section.items")}
        </p>
      </div>

      <div className="sticky top-16 z-30 mb-8 flex flex-col gap-4 bg-background/90 py-4 backdrop-blur md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("ui.searchInCategory")}
            className="h-12 rounded-full border-input bg-muted/50 pl-10 text-base focus-visible:ring-primary/50"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-secondary-foreground transition-colors hover:bg-secondary/80 md:hidden"
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="font-semibold">{t("ui.filters")}</span>
        </button>
        <div className="hidden items-center gap-3 md:flex">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-12 rounded-full border border-input bg-background px-4 text-base font-medium text-foreground shadow-sm focus:border-primary/50 focus:ring-primary/50"
          >
            <option value="popular">{t("sort.popular")}</option>
            <option value="priceAsc">{t("sort.priceAsc")}</option>
            <option value="priceDesc">{t("sort.priceDesc")}</option>
            <option value="name">{t("sort.name")}</option>
          </select>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-background/95 backdrop-blur transition-transform duration-300 ease-in-out md:hidden ${showFilters ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <h2 className="text-xl font-bold">{t("ui.filters")}</h2>
          <button onClick={() => setShowFilters(false)} className="p-2" aria-label={t("back")}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold">{t("ui.sortBy")}</h3>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-base font-medium text-foreground shadow-sm focus:border-primary/50 focus:ring-primary/50"
            >
              <option value="popular">{t("sort.popular")}</option>
              <option value="priceAsc">{t("sort.priceAsc")}</option>
              <option value="priceDesc">{t("sort.priceDesc")}</option>
              <option value="name">{t("sort.name")}</option>
            </select>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 p-4">
          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="outline" className="h-12 flex-1 rounded-full">
              {t("ui.clearAll")}
            </Button>
            <Button
              onClick={() => setShowFilters(false)}
              className="h-12 flex-1 rounded-full gradient-brand text-brand-foreground"
            >
              {t("ui.showResults")}
            </Button>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-muted-foreground">{t("ui.noProductsInCategory")}</p>
          <button
            onClick={clearFilters}
            className="mt-4 inline-block font-semibold text-primary hover:underline"
          >
            {t("ui.clearSearchTryAgain")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
