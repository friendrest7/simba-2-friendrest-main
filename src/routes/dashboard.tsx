import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  DollarSign,
  PackageCheck,
  PackageOpen,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { formatRWF } from "@/lib/products";
import {
  formatOrderStatus,
  getDeliveryStatusText,
  getOrders,
  getRevenue,
  subscribeStore,
  updateOrderStatus,
  type CustomerOrder,
  type OrderStatus,
} from "@/lib/order-store";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out-for-delivery",
  "delivered",
  "cancelled",
];

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Market Rep Dashboard - Simba Supermarket" }] }),
});

function DashboardPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const sync = () => setOrders(getOrders());
    sync();
    return subscribeStore(sync);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
      const haystack =
        `${order.id} ${order.customerName} ${order.phoneNumber} ${order.deliveryLocation} ${order.items.map((item) => item.name).join(" ")}`.toLowerCase();
      const matchesQuery = query.trim() ? haystack.includes(query.trim().toLowerCase()) : true;
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, statusFilter]);

  const stats = {
    total: orders.length,
    pending: orders.filter((order) => order.status === "pending").length,
    confirmed: orders.filter((order) => order.status === "confirmed").length,
    delivered: orders.filter((order) => order.status === "delivered").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
    revenue: getRevenue(orders),
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_4%,var(--background)),var(--background)_24%,var(--background))]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2rem] border border-border bg-card/95 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {t("nav.marketRepDashboard")}
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
                {t("dashboard.titleSimple")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.subtitleSimple")}</p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/products">{t("dashboard.backToShop")}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            icon={<ClipboardList className="h-4 w-4" />}
            label={t("dashboard.totalOrders")}
            value={String(stats.total)}
          />
          <StatCard
            icon={<PackageOpen className="h-4 w-4" />}
            label={t("dashboard.pendingOrdersShort")}
            value={String(stats.pending)}
          />
          <StatCard
            icon={<PackageCheck className="h-4 w-4" />}
            label={t("dashboard.confirmedOrders")}
            value={String(stats.confirmed)}
          />
          <StatCard
            icon={<Truck className="h-4 w-4" />}
            label={t("dashboard.deliveredOrders")}
            value={String(stats.delivered)}
          />
          <StatCard
            icon={<XCircle className="h-4 w-4" />}
            label={t("dashboard.cancelledOrders")}
            value={String(stats.cancelled)}
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label={t("dashboard.totalRevenue")}
            value={formatRWF(stats.revenue)}
          />
        </div>

        <section className="mt-6 rounded-[2rem] border border-border bg-card/95 p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-extrabold">{t("dashboard.ordersList")}</h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("dashboard.searchOrders")}
                  className="w-full rounded-full pl-9 md:w-72"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-full border border-input bg-background px-4 text-sm"
              >
                <option value="all">{t("dashboard.filter.all")}</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatOrderStatus(status, t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-background/60 px-6 py-12 text-center">
              <div className="font-semibold">{t("dashboard.noOrders")}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.noOrdersHintSimple")}
              </div>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-3 py-3">{t("dashboard.orderIdColumn")}</th>
                    <th className="px-3 py-3">{t("dashboard.customerColumn")}</th>
                    <th className="px-3 py-3">{t("dashboard.itemsColumn")}</th>
                    <th className="px-3 py-3">{t("dashboard.paymentColumn")}</th>
                    <th className="px-3 py-3">{t("dashboard.totalColumn")}</th>
                    <th className="px-3 py-3">{t("dashboard.deliveryStatusColumn")}</th>
                    <th className="px-3 py-3">{t("dashboard.statusColumn")}</th>
                    <th className="px-3 py-3">{t("dashboard.dateColumn")}</th>
                    <th className="px-3 py-3">{t("dashboard.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/70 align-top">
                      <td className="px-3 py-4 font-semibold">{order.id}</td>
                      <td className="px-3 py-4">
                        <div className="font-semibold">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">{order.phoneNumber}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {order.deliveryLocation}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                      </td>
                      <td className="px-3 py-4">{t(`checkout.payment.${order.paymentMethod}`)}</td>
                      <td className="px-3 py-4 font-semibold">{formatRWF(order.total)}</td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {getDeliveryStatusText(order.status, t)}
                      </td>
                      <td className="px-3 py-4">
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">
                          {formatOrderStatus(order.status, t)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-4">
                        <select
                          value={order.status}
                          onChange={(event) => {
                            updateOrderStatus(order.id, event.target.value as OrderStatus);
                            setOrders(getOrders());
                          }}
                          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {formatOrderStatus(status, t)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
    </div>
  );
}
