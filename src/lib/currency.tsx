import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type DisplayCurrency = "RWF" | "USD" | "EUR" | "GBP";

const CURRENCY_STORAGE_KEY = "simba.currency.v1";

export const CURRENCY_OPTIONS: Array<{ code: DisplayCurrency; label: string }> = [
  { code: "RWF", label: "RWF" },
  { code: "USD", label: "USD $" },
  { code: "EUR", label: "EUR €" },
  { code: "GBP", label: "GBP £" },
];

export const CURRENCY_RATES: Record<DisplayCurrency, number> = {
  RWF: 1,
  USD: 0.00071,
  EUR: 0.00066,
  GBP: 0.00056,
};

let currentCurrency: DisplayCurrency = "RWF";

export const getCurrentCurrency = () => currentCurrency;

export const setCurrentCurrency = (currency: DisplayCurrency) => {
  currentCurrency = currency;
};

const Ctx = createContext<{
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
} | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>("RWF");

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(CURRENCY_STORAGE_KEY) as DisplayCurrency | null)
        : null;
    if (saved && CURRENCY_OPTIONS.some((option) => option.code === saved)) {
      currentCurrency = saved;
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (nextCurrency: DisplayCurrency) => {
    currentCurrency = nextCurrency;
    setCurrencyState(nextCurrency);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency);
    }
  };

  return <Ctx.Provider value={{ currency, setCurrency }}>{children}</Ctx.Provider>;
}

export const useCurrency = () => {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};
