import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type HTMLAttributes, type HTMLInputTypeAttribute } from "react";
import { CreditCard, MapPin, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatRWF } from "@/lib/products";
import type { PaymentMethod } from "@/lib/order-store";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Checkout - Simba Supermarket" }] }),
});

function CheckoutPage() {
  const { items, subtotal, count, checkout } = useCart();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile-money");
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    deliveryLocation: "",
  });
  const normalizedPhoneNumber = formData.phoneNumber.replace(/[^\d+]/g, "");

  useEffect(() => {
    if (count === 0) {
      navigate({ to: "/cart" });
    }
  }, [count, navigate]);

  if (count === 0) {
    return null;
  }

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (
      !formData.customerName.trim() ||
      !formData.phoneNumber.trim() ||
      !formData.deliveryLocation.trim()
    ) {
      setError(t("checkout.error.completeDetails"));
      return;
    }

    if (!isValidPhoneNumber(normalizedPhoneNumber)) {
      setError(t("checkout.error.phone"));
      return;
    }

    setLoading(true);
    const result = await checkout({
      customerName: formData.customerName.trim(),
      phoneNumber: normalizedPhoneNumber,
      deliveryLocation: formData.deliveryLocation.trim(),
      paymentMethod,
    });
    setLoading(false);

    if (!result.ok) {
      setError(
        result.productName
          ? `${t("checkout.error.stockUnavailable")} ${result.productName}.`
          : t(result.error),
      );
      return;
    }

    navigate({
      to: "/order-confirmation",
      search: { orderId: result.order.id } as never,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          {t("checkout.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("checkout.subtitleShort")}</p>
      </div>

      <form onSubmit={submitOrder} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{t("checkout.customerDetails")}</h2>
                <p className="text-sm text-muted-foreground">{t("checkout.customerDetailsHint")}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                id="customer-name"
                label={t("checkout.name")}
                value={formData.customerName}
                onChange={(value) =>
                  setFormData((current) => ({ ...current, customerName: value }))
                }
              />
              <Field
                id="phone-number"
                label={t("checkout.phone")}
                value={formData.phoneNumber}
                onChange={(value) => setFormData((current) => ({ ...current, phoneNumber: value }))}
                type="tel"
                inputMode="tel"
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{t("checkout.deliveryLocationLabel")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("checkout.deliveryLocationHint")}
                </p>
              </div>
            </div>
            <Field
              id="delivery-location"
              label={t("checkout.deliveryLocationLabel")}
              value={formData.deliveryLocation}
              onChange={(value) =>
                setFormData((current) => ({ ...current, deliveryLocation: value }))
              }
              placeholder={t("checkout.addressPh")}
            />
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{t("ui.paymentMethod")}</h2>
                <p className="text-sm text-muted-foreground">{t("checkout.paymentHint")}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <PaymentOption
                active={paymentMethod === "mobile-money"}
                onClick={() => setPaymentMethod("mobile-money")}
                label={t("checkout.mobileMoney")}
                hint={t("checkout.mobileMoneyHint")}
              />
              <PaymentOption
                active={paymentMethod === "cash-on-delivery"}
                onClick={() => setPaymentMethod("cash-on-delivery")}
                label={t("checkout.cashOnDelivery")}
                hint={t("checkout.cashOnDeliveryHint")}
              />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:sticky lg:top-20">
          <h2 className="mb-4 text-xl font-extrabold">{t("ui.orderSummary")}</h2>
          <div className="space-y-3">
            {items.map(({ product, qty }) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-semibold">{product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {qty} x {formatRWF(product.price)}
                  </div>
                </div>
                <div className="font-semibold">{formatRWF(product.price * qty)}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2.5 text-sm">
            <SummaryRow label={t("cart.subtotal")} value={formatRWF(subtotal)} />
            <SummaryRow label={t("cart.delivery")} value={t("cart.free")} />
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-semibold">{t("cart.total")}</span>
            <span className="text-2xl font-black text-primary">{formatRWF(subtotal)}</span>
          </div>
          {error && (
            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" size="lg" className="mt-6 w-full rounded-full" disabled={loading}>
            {loading ? t("ui.processing") : t("checkout.placeOrder")}
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
            <Link to="/cart">{t("ui.backToCart")}</Link>
          </Button>
        </aside>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 rounded-xl"
      />
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
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-primary bg-primary/8 shadow-md"
          : "border-border bg-background hover:border-primary/40"
      }`}
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

function isValidPhoneNumber(phoneNumber: string) {
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  return digitsOnly.length >= 9 && digitsOnly.length <= 15;
}
