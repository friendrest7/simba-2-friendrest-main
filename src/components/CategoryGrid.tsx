import { Link } from "@tanstack/react-router";
import { CATEGORIES, categoryLabel } from "@/lib/products";
import { useI18n } from "@/lib/i18n";
import { ChevronRight } from "lucide-react";

export function CategoryGrid() {
  const { t } = useI18n();

  return (
    <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-sm md:p-5">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {t("ui.mainAisles")}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight md:text-2xl">
            {t("section.categories")}
          </h2>
        </div>
        <Link
          to="/products"
          className="hidden items-center gap-1 text-sm font-bold text-primary md:inline-flex"
        >
          {t("ui.seeAll")}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            to="/category/$slug"
            params={{ slug: c.slug }}
            className="group relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,244,252,0.94))] p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
          >
            <div
              className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-35"
              style={{ background: c.color }}
            />

            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm"
              style={{ background: `color-mix(in oklab, ${c.color} 16%, var(--background))` }}
            >
              {c.emoji}
            </div>

            <div className="mt-4 text-sm font-black leading-tight text-foreground">
              {categoryLabel(c.name, t)}
            </div>
            <div className="mt-1 text-[11px] font-medium text-muted-foreground">
              {c.count} {t("section.items")}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
