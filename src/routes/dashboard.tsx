import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  ClipboardList,
  PackageCheck,
  Search,
  Truck,
  UserRoundSearch,
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
  "accepted",
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
    const term = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const haystack = [
        order.id,
        order.customerName,
        order.phoneNumber,
        order.deliveryLocation,
        order.items.map((item) => item.name).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [orders, query, statusFilter]);

  const stats = {
    total: orders.length,
    pending: orders.filter((order) => order.status === "pending").length,
    accepted: orders.filter((order) => order.status === "accepted").length,
    outForDelivery: orders.filter((order) => order.status === "out-for-delivery").length,
    delivered: orders.filter((order) => order.status === "delivered").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
    revenue: getRevenue(orders),
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,rgba(255,154,86,0.14),transparent_28%),linear-gradient(180deg,color-mix(in_oklab,var(--primary)_5%,var(--background)),var(--background)_30%,var(--background))]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <section className="rounded-[2rem] border border-border bg-card/95 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {t("nav.marketRepDashboard")}
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
                {t("dashboard.titleSimple")}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {t("dashboard.subtitleSimple")}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="rounded-full border border-primary/15 bg-primary/8 px-4 py-2 text-sm font-semibold text-primary">
                {t("dashboard.demoBackend")}
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/products">{t("dashboard.backToShop")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            icon={<ClipboardList className="h-4 w-4" />}
            label={t("dashboard.totalOrders")}
            value={String(stats.total)}
          />
          <StatCard
            icon={<UserRoundSearch className="h-4 w-4" />}
            label={t("dashboard.pendingOrdersShort")}
            value={String(stats.pending)}
          />
          <StatCard
            icon={<PackageCheck className="h-4 w-4" />}
            label={t("order.status.accepted")}
            value={String(stats.accepted)}
          />
          <StatCard
            icon={<Truck className="h-4 w-4" />}
            label={t("order.status.out-for-delivery")}
            value={String(stats.outForDelivery)}
          />
          <StatCard
            icon={<XCircle className="h-4 w-4" />}
            label={t("dashboard.cancelledOrders")}
            value={String(stats.cancelled)}
          />
          <StatCard
            icon={<BadgeDollarSign className="h-4 w-4" />}
            label={t("dashboard.totalRevenue")}
            value={formatRWF(stats.revenue)}
          />
        </section>

        <section className="mt-6 rounded-[2rem] border border-border bg-card/95 p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">{t("dashboard.ordersList")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.noOrdersHintSimple")}</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("dashboard.searchOrders")}
                  className="w-full rounded-full pl-9 md:w-80"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-full border border-input bg-background px-4 text-sm"
                aria-label={t("dashboard.statusColumn")}
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
            <>
              <div className="mt-6 grid gap-4 xl:hidden">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
              <div className="mt-6 hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1180px] text-left text-sm">
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
                        <td className="px-3 py-4">
                          <div>{t(`checkout.payment.${order.paymentMethod}`)}</div>
                          {order.momoNumber && (
                            <div className="mt-1 text-xs text-muted-foreground">{order.momoNumber}</div>
                          )}
                        </td>
                        <td className="px-3 py-4 font-semibold">{formatRWF(order.total)}</td>
                        <td className="px-3 py-4 text-muted-foreground">
                          {getDeliveryStatusText(order.status, t)}
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-3 py-4 text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-4">
                          <OrderStatusControls order={order} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const { t } = useI18n();

  return (
    <article className="rounded-[1.5rem] border border-border bg-background/70 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            {t("dashboard.orderIdColumn")}
          </div>
          <div className="mt-1 text-lg font-extrabold">{order.id}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Info label={t("dashboard.customerColumn")} value={order.customerName} />
        <Info label={t("checkout.phone")} value={order.phoneNumber} />
        <Info label={t("checkout.deliveryLocationLabel")} value={order.deliveryLocation} />
        <Info label={t("dashboard.dateColumn")} value={new Date(order.createdAt).toLocaleString()} />
        <Info label={t("dashboard.paymentColumn")} value={t(`checkout.payment.${order.paymentMethod}`)} />
        <Info label={t("dashboard.totalColumn")} value={formatRWF(order.total)} />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          {t("dashboard.itemsColumn")}
        </div>
        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between gap-3">
              <span>{item.name} x{item.quantity}</span>
              <span className="font-semibold text-foreground">{formatRWF(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          {t("dashboard.deliveryStatusColumn")}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{getDeliveryStatusText(order.status, t)}</p>
      </div>

      <div className="mt-4">
        <OrderStatusControls order={order} />
      </div>
    </article>
  );
}

function OrderStatusControls({ order }: { order: CustomerOrder }) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <select
        value={order.status}
        onChange={(event) => {
          updateOrderStatus(order.id, event.target.value as OrderStatus);
        }}
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {formatOrderStatus(status, t)}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.filter((status) => status !== order.status).slice(0, 3).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => updateOrderStatus(order.id, status)}
            className="rounded-full border border-primary/20 bg-primary/6 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            {formatOrderStatus(status, t)}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  const tone =
    status === "delivered"
      ? "bg-success/15 text-success"
      : status === "cancelled"
        ? "bg-destructive/15 text-destructive"
        : "bg-secondary text-secondary-foreground";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
      {formatOrderStatus(status, t)}
    </span>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{label}</div>
      <div className="mt-2 font-semibold text-foreground">{value}</div>
    </div>
  );
}
