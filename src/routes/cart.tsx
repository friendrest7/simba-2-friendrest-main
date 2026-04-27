import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Package2, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatRWF } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({ meta: [{ title: "Your cart - Simba Supermarket" }] }),
});

function CartPage() {
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    count,
    setQty,
    remove,
    selectedBranch,
    overLimitItems,
    stockOf,
  } = useCart();
  const { t } = useI18n();

  if (count === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 shadow-lg shadow-primary/10">
          <ShoppingBag className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold">{t("cart.empty")}</h1>
        <p className="mt-2 text-muted-foreground">{t("cart.emptyHint")}</p>
        <div className="mx-auto mt-6 max-w-md rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
          <div className="text-sm font-semibold text-foreground">{t("ui.orderSummary")}</div>
          <p className="mt-2 text-sm text-muted-foreground">{t("checkout.orderSummaryHint")}</p>
        </div>
        <Button asChild size="lg" className="mt-6 rounded-full gradient-brand text-brand-foreground">
          <Link to="/products">{t("cart.continue")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{t("cart.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {count} {count === 1 ? t("cart.item") : t("cart.items")}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {overLimitItems.length > 0 && (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/8 p-4 text-sm">
              <div className="font-bold text-destructive">{t("pickup.cartBlocked")}</div>
              <div className="mt-1 text-muted-foreground">
                {t("cart.branchStockIssue").replace("{branch}", selectedBranch)}
              </div>
            </div>
          )}

          {items.map(({ product, qty }) => (
            <CartLine
              key={product.id}
              name={product.name}
              image={product.image}
              price={product.price}
              unit={product.unit}
              qty={qty}
              stock={stockOf(product.id)}
              removeLabel={t("cart.remove")}
              decreaseLabel={t("card.decrease")}
              increaseLabel={t("card.increase")}
              onInc={() => setQty(product.id, qty + 1)}
              onDec={() => setQty(product.id, qty - 1)}
              onRemove={() => remove(product.id)}
            />
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-20">
          <h2 className="mb-4 text-xl font-extrabold">{t("ui.orderSummary")}</h2>
          <div className="mb-4 rounded-xl bg-secondary p-4 text-sm">
            <div className="font-semibold text-foreground">
              {t("checkout.deliveryLocationLabel")}
            </div>
            <div className="mt-1 text-primary">{selectedBranch}</div>
            <div className="mt-2 text-muted-foreground">{t("checkout.orderSummaryHint")}</div>
          </div>
          <div className="space-y-2.5 text-sm">
            <Row label={t("cart.subtotal")} value={formatRWF(subtotal)} />
            <Row
              label={t("cart.delivery")}
              value={deliveryFee === 0 ? t("cart.free") : formatRWF(deliveryFee)}
            />
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4 font-bold">
            <span>{t("cart.total")}</span>
            <span className="text-2xl tabular-nums text-primary">{formatRWF(total)}</span>
          </div>
          <Button
            asChild
            size="lg"
            className="mt-6 w-full rounded-full"
            disabled={overLimitItems.length > 0}
          >
            <Link to="/checkout">{t("ui.proceedToCheckout")}</Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
            <Link to="/products">{t("ui.continueShopping")}</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

function CartLine({
  name,
  image,
  price,
  unit,
  qty,
  stock,
  removeLabel,
  decreaseLabel,
  increaseLabel,
  onInc,
  onDec,
  onRemove,
}: {
  name: string;
  image: string;
  price: number;
  unit: string;
  qty: number;
  stock: number;
  removeLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary/40">
        {!imageError ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <Package2 className="h-8 w-8 text-primary" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-base font-semibold leading-tight text-foreground">
          {name}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {formatRWF(price)} / {unit}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("cart.availableStock").replace("{stock}", String(stock))}
        </div>
        <div className="mt-1.5 text-sm font-bold text-primary">{formatRWF(price * qty)}</div>
      </div>

      <div className="flex h-10 items-center rounded-xl border border-primary/40 bg-primary/8 px-2">
        <button onClick={onDec} className="px-2 text-primary" aria-label={decreaseLabel}>
          <Minus className="h-4 w-4" />
        </button>
        <span className="px-2 text-sm font-bold tabular-nums text-primary">{qty}</span>
        <button onClick={onInc} className="px-2 text-primary" aria-label={increaseLabel}>
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={onRemove}
        className="rounded-full p-2 text-muted-foreground transition-colors hover:text-destructive"
        aria-label={removeLabel}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
