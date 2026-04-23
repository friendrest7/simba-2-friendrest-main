import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { formatRWF } from "@/lib/products";
import { PICKUP_BRANCHES, type BranchName } from "@/lib/demo-store";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Store, Wallet } from "lucide-react";

type SignInSearch = { redirect?: string };

const PICKUP_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "16:00 - 18:00"];

function defaultPickupDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  validateSearch: (s: Record<string, unknown>): SignInSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Checkout - Simba Supermarket" }] }),
});

function CheckoutPage() {
  const { items, subtotal, count, checkout, selectedBranch, setSelectedBranch, overLimitItems } = useCart();
  const { user, hydrated } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "pay-on-pickup">("momo");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    customerPhone: user?.phone || "",
    branch: selectedBranch,
    pickupDate: defaultPickupDate(),
    pickupSlot: PICKUP_SLOTS[1],
    paymentPhone: user?.phone || "",
    notes: "",
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!user && !orderSuccess) {
      navigate({ to: "/signin", search: { redirect: "/checkout" } as never });
      return;
    }

    if (count === 0 && !orderSuccess) {
      navigate({ to: "/cart" });
    }
  }, [user, count, orderSuccess, hydrated, navigate]);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      name: user?.name || current.name,
      email: user?.email || current.email,
      customerPhone: user?.phone || current.customerPhone,
      paymentPhone: user?.phone || current.paymentPhone,
      branch: selectedBranch,
    }));
  }, [selectedBranch, user]);

  const branchTotalItems = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  if (!user || (count === 0 && !orderSuccess)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.customerPhone.trim() || !formData.pickupDate || !formData.pickupSlot) {
      setError(t("checkout.error.completeDetails"));
      return;
    }

    if (paymentMethod === "momo" && !formData.paymentPhone.trim()) {
      setError(t("checkout.error.momo"));
      return;
    }

    if (overLimitItems.length > 0) {
      setError(t("pickup.fixCart"));
      return;
    }

    setLoading(true);
    const result = await checkout({
      user,
      branch: formData.branch,
      pickupDate: formData.pickupDate,
      pickupSlot: formData.pickupSlot,
      paymentMethod,
      paymentPhone: paymentMethod === "momo" ? formData.paymentPhone : undefined,
      customerPhone: formData.customerPhone,
      notes: formData.notes,
    });

    if (result.ok) {
      setOrderId(result.order.id);
      setOrderSuccess(true);
      setSelectedBranch(formData.branch);
    } else if (result.productName) {
      setError(`${t("pickup.stockChanged")} ${result.productName}.`);
    } else {
      setError(t(result.error));
    }

    setLoading(false);
  };

  if (orderSuccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
        <h1 className="text-3xl font-extrabold">{t("pickup.pickupReady")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("pickup.pickupReadyHint")} {orderId ? `#${orderId}` : ""}
        </p>
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left shadow-sm">
          <div className="grid gap-3 text-sm">
            <SummaryRow label={t("pickup.branch")} value={formData.branch} />
            <SummaryRow label={t("pickup.date")} value={formData.pickupDate} />
            <SummaryRow label={t("pickup.slot")} value={formData.pickupSlot} />
            <SummaryRow label={t("dashboard.payment")} value={paymentMethod === "momo" ? t("ui.mobileMoney") : t("pickup.payOnPickup")} />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="rounded-full gradient-brand text-brand-foreground hover:opacity-90">
            <Link to="/">{t("ui.backHome")}</Link>
          </Button>
          {(user.role === "manager" || user.role === "staff") && (
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/admin-dashboard">{t("app.dashboard")}</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight md:text-4xl">{t("pickup.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("pickup.instructions")}</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{t("pickup.branch")}</h2>
                <p className="text-sm text-muted-foreground">{branchTotalItems} {t("cart.items")}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="branch">{t("pickup.branch")}</Label>
                <select
                  id="branch"
                  value={formData.branch}
                  onChange={(e) => {
                    const branch = e.target.value as BranchName;
                    setFormData((current) => ({ ...current, branch }));
                    setSelectedBranch(branch);
                  }}
                  className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3"
                >
                  {PICKUP_BRANCHES.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="pickupDate">{t("pickup.date")}</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={formData.pickupDate}
                  onChange={(e) => setFormData((current) => ({ ...current, pickupDate: e.target.value }))}
                  className="mt-1.5 h-11 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="pickupSlot">{t("pickup.slot")}</Label>
                <select
                  id="pickupSlot"
                  value={formData.pickupSlot}
                  onChange={(e) => setFormData((current) => ({ ...current, pickupSlot: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3"
                >
                  {PICKUP_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="customerPhone">{t("checkout.phone")}</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData((current) => ({ ...current, customerPhone: e.target.value }))}
                  className="mt-1.5 h-11 rounded-xl"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">{t("pickup.notes")}</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((current) => ({ ...current, notes: e.target.value }))}
                  placeholder={t("pickup.notesPlaceholder")}
                  className="mt-1.5 h-11 rounded-xl"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{t("ui.paymentMethod")}</h2>
                <p className="text-sm text-muted-foreground">{t("pickup.free")}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PaymentOption
                active={paymentMethod === "momo"}
                onClick={() => setPaymentMethod("momo")}
                label={t("ui.mobileMoney")}
                hint={t("ui.mobileMoneyHint")}
              />
              <PaymentOption
                active={paymentMethod === "pay-on-pickup"}
                onClick={() => setPaymentMethod("pay-on-pickup")}
                label={t("pickup.payOnPickup")}
                hint={t("pickup.payOnPickupHint")}
              />
            </div>
            {paymentMethod === "momo" && (
              <div className="mt-4">
                <Label htmlFor="paymentPhone">{t("ui.mobileMoneyNumber")}</Label>
                <Input
                  id="paymentPhone"
                  value={formData.paymentPhone}
                  onChange={(e) => setFormData((current) => ({ ...current, paymentPhone: e.target.value }))}
                  className="mt-1.5 h-11 rounded-xl"
                />
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-20">
          <h2 className="mb-4 text-xl font-extrabold">{t("pickup.summary")}</h2>
          <div className="space-y-2.5 text-sm">
            <SummaryRow label={t("pickup.branch")} value={formData.branch} />
            <SummaryRow label={t("cart.subtotal")} value={formatRWF(subtotal)} />
            <SummaryRow label={t("pickup.summary")} value={t("pickup.free")} />
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4 font-bold">
            <span>{t("cart.total")}</span>
            <span className="text-2xl tabular-nums text-primary">{formatRWF(subtotal)}</span>
          </div>
          {overLimitItems.length > 0 && (
            <div className="mt-4 rounded-xl border border-destructive/25 bg-destructive/8 p-4 text-sm">
              <div className="font-bold text-destructive">{t("pickup.cartBlocked")}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("cart.branchStockIssue").replace("{branch}", formData.branch)}
              </div>
              <div className="mt-3 space-y-2">
                {overLimitItems.map((item) => (
                  <div key={item.product.id} className="rounded-lg border border-destructive/15 bg-background/80 p-2">
                    <div className="font-semibold text-foreground">{item.product.name}</div>
                    <div className="mt-1 text-xs text-destructive">
                      {t("cart.stockShortfall")
                        .replace("{requested}", String(item.qty))
                        .replace("{available}", String(item.stock))}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.suggestedBranches.length > 0 ? (
                        <>
                          {t("cart.availableAt")}{" "}
                          <span className="font-bold text-primary">
                            {item.suggestedBranches.map((candidate) => `${candidate.branch} (${candidate.stock})`).join(", ")}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-destructive">{t("cart.noBranchSuggestion")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" size="lg" className="mt-6 w-full rounded-full gradient-brand text-brand-foreground hover:opacity-90 glow-primary" disabled={loading || overLimitItems.length > 0}>
            {loading ? t("ui.processing") : t("ui.placeOrder")}
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
            <Link to="/cart">{t("ui.backToCart")}</Link>
          </Button>
        </aside>
      </form>
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${active ? "border-primary bg-primary/8 shadow-md" : "border-border bg-background hover:border-primary/40"}`}
    >
      <div className="text-sm font-semibold text-foreground">{label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
