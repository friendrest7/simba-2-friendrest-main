import { Link } from "@tanstack/react-router";
import { Minus, Package2, Plus } from "lucide-react";
import { type Product, categoryLabel, formatRWF } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";

export function ProductCard({ product }: { product: Product }) {
  const { add, qtyOf, setQty, stockOf } = useCart();
  const { t } = useI18n();
  const qty = qtyOf(product.id);
  const branchStock = stockOf(product.id);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative flex h-full flex-col rounded-[1.65rem] border border-border/70 bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
          {branchStock > 0 ? t("card.inStock") : t("card.outOfStock")}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {product.unit}
        </span>
      </div>

      <div className="relative mt-3 aspect-square w-full overflow-hidden rounded-[1.35rem] bg-[linear-gradient(180deg,rgba(243,238,250,0.95),rgba(255,255,255,1))] p-3">
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white text-primary">
            <Package2 className="h-10 w-10" />
          </div>
        )}

        <div className="absolute right-2 top-2 z-10">
          {qty === 0 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (branchStock > 0) add(product);
              }}
              disabled={branchStock <= 0}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-white text-primary shadow-md transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t("card.add")}
            >
              <Plus className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex flex-col items-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQty(product.id, qty - 1);
                }}
                className="flex h-8 w-8 items-center justify-center hover:bg-white/10"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="py-0.5 text-xs font-bold">{qty}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  add(product);
                }}
                className="flex h-8 w-8 items-center justify-center hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {branchStock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <span className="rounded-md bg-destructive px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground">
              {t("card.outOfStock")}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <Link
          to="/product/$id"
          params={{ id: String(product.id) }}
          className="min-h-[2.5rem] text-[13px] font-bold leading-snug text-foreground transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        <div className="mt-1 text-[11px] font-medium text-muted-foreground">{categoryLabel(product.category, t)}</div>
        <div className="mt-1 text-[11px] font-semibold text-primary">
          {branchStock} {t("pickup.availableNow")}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div>
            <div className="text-base font-black text-primary">{formatRWF(product.price)}</div>
            <div className="text-[11px] text-muted-foreground">{t("card.unit")} {product.unit}</div>
          </div>

          {qty === 0 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (branchStock > 0) add(product);
              }}
              disabled={branchStock <= 0}
              className="rounded-xl bg-primary px-3.5 py-2 text-xs font-extrabold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("card.add")}
            </button>
          ) : (
            <div className="flex items-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQty(product.id, qty - 1);
                }}
                className="flex h-9 w-9 items-center justify-center"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-6 text-center text-sm font-black">{qty}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  add(product);
                }}
                className="flex h-9 w-9 items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
