import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, PackageCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { formatRWF } from "@/lib/products";
import {
  formatOrderStatus,
  getDeliveryStatusText,
  getLastOrder,
  getOrderById,
  getOrderSummaryLines,
} from "@/lib/order-store";

export const Route = createFileRoute("/order-confirmation")({
  component: OrderConfirmationPage,
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === "string" ? search.orderId : undefined,
  }),
  head: () => ({ meta: [{ title: "Order Confirmation - Simba Supermarket" }] }),
});

function OrderConfirmationPage() {
  const { t } = useI18n();
  const { orderId } = Route.useSearch();
  const order = (orderId ? getOrderById(orderId) : null) ?? getLastOrder();

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold">{t("order.confirmationMissing")}</h1>
        <p className="mt-2 text-muted-foreground">{t("order.confirmationMissingHint")}</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/products">{t("ui.continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold">{t("order.confirmationTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("order.confirmationBody")}</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[1.5rem] border border-border bg-background/70 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={<PackageCheck className="h-4 w-4" />}
                label={t("order.orderId")}
                value={order.id}
              />
              <InfoCard
                icon={<Truck className="h-4 w-4" />}
                label={t("order.deliveryStatusLabel")}
                value={getDeliveryStatusText(order.status, t)}
              />
              <InfoCard label={t("checkout.name")} value={order.customerName} />
              <InfoCard label={t("checkout.phone")} value={order.phoneNumber} />
              <InfoCard
                label={t("checkout.deliveryLocationLabel")}
                value={order.deliveryLocation}
              />
              <InfoCard
                label={t("ui.paymentMethod")}
                value={t(`checkout.payment.${order.paymentMethod}`)}
              />
              <InfoCard
                label={t("dashboard.dateColumn")}
                value={new Date(order.createdAt).toLocaleString()}
              />
            </div>

            <div className="mt-6">
              <div className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
                {t("ui.orderSummary")}
              </div>
              <div className="mt-3 space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
                  >
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">{formatRWF(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-border bg-background/70 p-5">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
              {t("order.statusLabel")}
            </div>
            <div className="mt-2 rounded-2xl bg-primary/8 p-4">
              <div className="text-lg font-bold text-primary">
                {formatOrderStatus(order.status, t)}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {getDeliveryStatusText(order.status, t)}
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              {getOrderSummaryLines(order).map((line) => (
                <SummaryRow
                  key={line.label}
                  label={t(line.label)}
                  value={line.value === "cart.free" ? t("cart.free") : line.value}
                />
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              <Button asChild className="rounded-full">
                <Link to="/products">{t("ui.continueShopping")}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/dashboard">{t("nav.marketRepDashboard")}</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
