import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PackageCheck, ShoppingBag, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { getOrdersForUser } from "@/lib/data";
import { formatRWF } from "@/lib/products";
import cartIcon from "@/assets/cart-icon.png";

export const Route = createFileRoute("/client-dashboard")({
  component: ClientDashboardPage,
  head: () => ({ meta: [{ title: "Client dashboard - Simba Supermarket" }] }),
});

function ClientDashboardPage() {
  const { user, hydrated } = useAuth();
  const { t } = useI18n();
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getOrdersForUser>>>([]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    void (async () => {
      const nextOrders = await getOrdersForUser(user);
      if (active) setOrders(nextOrders);
    })();

    return () => {
      active = false;
    };
  }, [user]);

  if (!hydrated) return null;
  if (!user) return <Navigate to="/signin" search={{ redirect: "/client-dashboard" } as never} />;
  if (user.role === "manager" || user.role === "staff") return <Navigate to="/admin-dashboard" />;

  const activeOrders = orders.filter((order) => order.status !== "collected").length;

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_18%,var(--card)),var(--card)_58%,color-mix(in_oklab,var(--brand-yellow)_18%,var(--card)))] p-6 shadow-sm md:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-8 hidden h-32 w-32 rounded-full bg-brand-yellow/20 blur-2xl md:block" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/40 bg-white/85 p-3 shadow-lg shadow-primary/10">
              <img src={cartIcon} alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {t("client.dashboard")}
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{user.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="rounded-full gradient-brand text-brand-foreground shadow-lg shadow-primary/20 hover:opacity-90"
          >
            <Link to="/products">{t("cart.continue")}</Link>
          </Button>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat
          icon={<ShoppingBag className="h-5 w-5" />}
          label={t("client.totalOrders")}
          value={String(orders.length)}
        />
        <Stat
          icon={<PackageCheck className="h-5 w-5" />}
          label={t("client.activeOrders")}
          value={String(activeOrders)}
        />
        <Stat
          icon={<UserRound className="h-5 w-5" />}
          label={t("auth.signInTab")}
          value={t("client.customer")}
        />
      </div>

      <section className="mt-8 rounded-[2rem] border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {t("pickup.summary")}
            </div>
            <h2 className="mt-1 text-2xl font-black tracking-tight">{t("client.recentOrders")}</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {activeOrders} {t("client.activeOrders").toLowerCase()}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background/60 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <div className="text-sm text-muted-foreground">{t("client.noOrders")}</div>
            </div>
          ) : (
            orders.slice(0, 8).map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-border bg-background/55 p-4 transition hover:border-primary/35 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-bold">#{order.id}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {order.branch} · {order.pickupDate} · {order.pickupSlot}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary">{formatRWF(order.total)}</div>
                  <div className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                    {t(`dashboard.status.${order.status}`)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}
