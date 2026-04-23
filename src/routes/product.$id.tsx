import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { categoryLabel, formatRWF, productById, PRODUCTS, CATEGORIES } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import { ChevronLeft, Minus, Package, Package2, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  loader: ({ params }) => {
    const product = productById(Number(params.id));
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name ?? "Product"} - Simba Supermarket` },
      { name: "description", content: `Buy ${loaderData?.product.name} at Simba Supermarket Rwanda.` },
      { property: "og:image", content: loaderData?.product.image ?? "" },
    ],
  }),
  notFoundComponent: () => <ProductNotFound />,
});

function ProductNotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">{t("product.notFound")}</h1>
      <Link to="/" className="mt-4 inline-block font-semibold text-primary">{t("back.home")}</Link>
    </div>
  );
}

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { add, qtyOf, setQty, stockOf, selectedBranch } = useCart();
  const { t } = useI18n();
  const qty = qtyOf(product.id);
  const branchStock = stockOf(product.id);
  const [imgError, setImgError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 6);
  const categorySlug = CATEGORIES.find((c) => c.name === product.category)?.slug ?? "general";

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/products" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> {t("ui.backToProducts")}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-secondary/40">
            {!imgError ? (
              <img
                src={product.image}
                alt={product.name}
                decoding="async"
                fetchPriority="high"
                onError={() => setImgError(true)}
                className="h-full w-full object-contain p-4"
              />
            ) : (
              <Package2 className="h-20 w-20 text-primary" />
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <Link to="/category/$slug" params={{ slug: categorySlug }} className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            {categoryLabel(product.category, t)}
          </Link>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums text-primary">{formatRWF(product.price)}</span>
            <span className="text-sm text-muted-foreground">/ {product.unit}</span>
          </div>
            <span className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${branchStock > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
            {branchStock > 0 ? t("card.inStock") : t("card.outOfStock")}
          </span>
          <div className="mt-2 text-sm font-semibold text-primary">
            {selectedBranch}: {branchStock} {t("pickup.availableNow")}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {qty > 0 && (
              <div className="flex h-12 w-48 items-center gap-3 rounded-full border border-primary/40 bg-primary/8 px-4">
                <button onClick={() => setQty(product.id, qty - 1)} className="rounded-full p-1 text-primary transition-colors enabled:hover:bg-white/15 disabled:text-muted-foreground" aria-label={t("card.decrease")}>
                  <Minus className="h-5 w-5" />
                </button>
                <span className="px-2 text-lg font-bold tabular-nums text-primary">{qty}</span>
                <button onClick={() => add(product)} className="rounded-full p-1 text-primary transition-colors enabled:hover:bg-white/15" aria-label={t("card.increase")}>
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            )}
            {qty === 0 && (
              <Button size="lg" onClick={() => add(product)} disabled={branchStock <= 0} className="h-12 rounded-full gradient-brand px-6 text-brand-foreground hover:opacity-90 gap-2 glow-primary">
                <ShoppingBag className="h-5 w-5" /> {t("card.add")}
              </Button>
            )}
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full">
              <Link to="/cart">{t("ui.viewCart")}</Link>
            </Button>
          </div>

          <div className="mt-8">
            <button onClick={() => setShowDetails(!showDetails)} className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40">
              <span className="font-semibold">{t("ui.productDetails")}</span>
              {showDetails ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
            {showDetails && (
              <div className="mt-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                <p>{t("ui.productDescription")}</p>
                <p className="mt-2">{t("ui.weight")}: {product.unit}</p>
                <p>{t("ui.sku")}: {product.id}</p>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Feature icon={<Truck className="h-4 w-4" />} title={t("feature.fastDelivery")} desc={t("feature.fastDeliveryDesc")} />
            <Feature icon={<ShieldCheck className="h-4 w-4" />} title={t("feature.secure")} desc={t("feature.secureDesc")} />
            <Feature icon={<Package className="h-4 w-4" />} title={t("feature.authentic")} desc={t("feature.authenticDesc")} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-xl font-extrabold tracking-tight">{t("ui.relatedProducts")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
