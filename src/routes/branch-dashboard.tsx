import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import {
  type OrderStatus,
} from "@/lib/demo-store";
import {
  getBranchInventory,
  getBranchReviews,
  getDashboardSummary,
  getOrdersForBranches,
  updateBranchStock,
  updateOrderStatus,
} from "@/lib/data";
import { formatRWF } from "@/lib/products";

export const Route = createFileRoute("/branch-dashboard")({
  component: BranchDashboardPage,
  head: () => ({ meta: [{ title: "Branch dashboard - Simba Supermarket" }] }),
});

export default function BranchDashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [refreshKey, setRefreshKey] = useState(0);
  const [inventorySearch, setInventorySearch] = useState("");
  const [summary, setSummary] = useState({ orderCount: 0, readyCount: 0, lowStockCount: 0, zeroStockCount: 0 });
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getOrdersForBranches>>>([]);
  const [inventory, setInventory] = useState<Array<Awaited<ReturnType<typeof getBranchInventory>>[number]>>([]);
  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof getBranchReviews>>>([]);
  const isAllowed = user?.role === "manager" || user?.role === "staff";
  const branches = user?.branches ?? [];
  const filteredInventory = useMemo(
    () =>
      inventory
        .filter((product) => !inventorySearch || product.name.toLowerCase().includes(inventorySearch.toLowerCase()))
        .slice(0, 18),
    [inventory, inventorySearch],
  );

  useEffect(() => {
    let active = true;
    if (!branches.length) return;

    void (async () => {
      const [nextSummary, nextOrders, inventoryLists, reviewLists] = await Promise.all([
        getDashboardSummary(branches),
        getOrdersForBranches(branches),
        Promise.all(branches.map((branch) => getBranchInventory(branch))),
        Promise.all(branches.map((branch) => getBranchReviews(branch))),
      ]);

      if (!active) return;
      setSummary(nextSummary);
      setOrders(nextOrders);
      setInventory(inventoryLists.flat());
      setReviews(reviewLists.flat());
    })();

    return () => {
      active = false;
    };
  }, [branches, refreshKey]);

  const onStatusChange = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
    setRefreshKey((value) => value + 1);
  };

  const onStockChange = async (branch: string, productId: number, stock: number) => {
    await updateBranchStock(branch as never, productId, stock);
    setRefreshKey((value) => value + 1);
  };

  if (!user) {
    return <Navigate to="/signin" search={{ redirect: "/admin-dashboard" } as never} />;
  }

  if (!isAllowed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold">{t("dashboard.accessDenied")}</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("dashboard.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label={t("dashboard.orderCount")} value={String(summary.orderCount)} />
        <StatCard label={t("dashboard.readyCount")} value={String(summary.readyCount)} />
        <StatCard label={t("dashboard.lowStockCount")} value={String(summary.lowStockCount)} />
        <StatCard label={t("dashboard.zeroStockCount")} value={String(summary.zeroStockCount)} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black">{t("dashboard.orders")}</h2>
          </div>
          <div className="mt-4 space-y-4">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.noOrders")}</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-lg font-bold">{order.id}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {order.branch} · {order.pickupDate} · {order.pickupSlot}
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-semibold">{t("dashboard.customer")}:</span> {order.customerName}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items · {formatRWF(order.total)}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                        className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                      >
                        {(["placed", "preparing", "ready", "collected"] as OrderStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {t(`dashboard.status.${status}`)}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-muted-foreground">
                        {t("dashboard.payment")}: {order.paymentMethod === "momo" ? t("ui.mobileMoney") : t("pickup.payOnPickup")}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-6">
          <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">{t("dashboard.inventory")}</h2>
              <Input
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder={t("search.placeholder")}
                className="max-w-xs rounded-xl"
              />
            </div>
            <div className="mt-4 space-y-3">
              {filteredInventory.map((product) => (
                <InventoryRow
                  key={`${product.branch}-${product.id}`}
                  branch={product.branch}
                  name={product.name}
                  stock={product.stock}
                  price={product.price}
                  onUpdate={(stock) => onStockChange(product.branch, product.id, stock)}
                />
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
            <h2 className="text-xl font-black">{t("dashboard.reviews")}</h2>
            <div className="mt-4 space-y-3">
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("dashboard.noReviews")}</p>
              ) : (
                reviews.slice(0, 8).map((review) => (
                  <div key={review.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{review.title}</div>
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{review.branch}</div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

function InventoryRow({
  branch,
  name,
  stock,
  price,
  onUpdate,
}: {
  branch: string;
  name: string;
  stock: number;
  price: number;
  onUpdate: (stock: number) => void;
}) {
  const [value, setValue] = useState(String(stock));

  return (
    <div className="grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-[1fr_90px_90px_84px] md:items-center">
      <div>
        <div className="font-semibold">{name}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {branch} · {formatRWF(price)}
        </div>
      </div>
      <div className="text-sm font-bold text-primary">{stock}</div>
      <Input value={value} onChange={(e) => setValue(e.target.value)} className="h-10 rounded-xl" />
      <Button type="button" onClick={() => onUpdate(Number(value) || 0)} className="rounded-xl">
        Update
      </Button>
    </div>
  );
}
