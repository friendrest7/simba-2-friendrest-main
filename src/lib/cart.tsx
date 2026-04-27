import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PICKUP_BRANCHES, type BranchName } from "@/lib/demo-store";
import type { Product } from "@/lib/products";
import {
  getDeliveryFee,
  getStockMap,
  placeOrder,
  subscribeStore,
  type CheckoutOrderInput,
  type CustomerOrder,
} from "@/lib/order-store";

export type CartItem = { product: Product; qty: number };

const CART_STORAGE_KEY = "simba.cart.v3";
const BRANCH_STORAGE_KEY = "simba.branch.v2";

const Ctx = createContext<{
  items: CartItem[];
  count: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  hydrated: boolean;
  selectedBranch: BranchName;
  lastOrder: CustomerOrder | null;
  add: (product: Product, qty?: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
  setQty: (productId: number, qty: number) => Promise<void>;
  clear: () => Promise<void>;
  qtyOf: (productId: number) => number;
  stockOf: (productId: number) => number;
  setSelectedBranch: (branch: BranchName) => void;
  overLimitItems: Array<{ product: Product; qty: number; stock: number }>;
  checkout: (
    input: CheckoutOrderInput,
  ) => Promise<
    { ok: true; order: CustomerOrder } | { ok: false; error: string; productName?: string }
  >;
} | null>(null);

const readStoredCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const readStoredBranch = () => {
  try {
    const raw = localStorage.getItem(BRANCH_STORAGE_KEY) as BranchName | null;
    return raw && PICKUP_BRANCHES.includes(raw) ? raw : "Remera";
  } catch {
    return "Remera";
  }
};

const writeStoredCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage failures in demo mode.
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedBranch, setSelectedBranchState] = useState<BranchName>("Remera");
  const [stockMap, setStockMap] = useState<Record<number, number>>({});
  const [lastOrder, setLastOrder] = useState<CustomerOrder | null>(null);

  useEffect(() => {
    setItems(readStoredCart());
    setSelectedBranchState(readStoredBranch());
    setStockMap(getStockMap());
    setHydrated(true);

    return subscribeStore(() => {
      setStockMap(getStockMap());
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredCart(items);
  }, [hydrated, items]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(BRANCH_STORAGE_KEY, selectedBranch);
  }, [hydrated, selectedBranch]);

  const stockOf = (productId: number) => stockMap[productId] ?? 0;

  const add = async (product: Product, qty = 1) => {
    setItems((current) => {
      const existingQty = current.find((item) => item.product.id === product.id)?.qty ?? 0;
      const nextQty = existingQty + qty;
      const available = stockOf(product.id);

      if (available <= 0) {
        toast.error(`${product.name} is out of stock.`);
        return current;
      }

      if (nextQty > available) {
        toast.error(`Only ${available} left for ${product.name}.`);
        return current;
      }

      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, qty: nextQty } : item,
        );
      }

      return [...current, { product, qty }];
    });
  };

  const remove = async (productId: number) => {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  };

  const setQty = async (productId: number, qty: number) => {
    if (qty <= 0) {
      await remove(productId);
      return;
    }

    const available = stockOf(productId);
    if (qty > available) {
      toast.error(`Only ${available} left for this product.`);
      return;
    }

    setItems((current) =>
      current.map((item) => (item.product.id === productId ? { ...item, qty } : item)),
    );
  };

  const clear = async () => {
    setItems([]);
    setLastOrder(null);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore storage failures in demo mode.
    }
  };

  const checkout = async (input: CheckoutOrderInput) => {
    const result = placeOrder(input, items);
    if (!result.ok) {
      return result;
    }

    setLastOrder(result.order);
    setItems([]);
    setStockMap(getStockMap());
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore storage failures in demo mode.
    }
    return result;
  };

  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.product.price, 0);
  const deliveryFee = getDeliveryFee(subtotal);
  const total = subtotal + deliveryFee;
  const overLimitItems = items
    .map((item) => ({
      product: item.product,
      qty: item.qty,
      stock: stockOf(item.product.id),
    }))
    .filter((item) => item.qty > item.stock);

  const value = {
    items,
    count,
    subtotal,
    deliveryFee,
    total,
    hydrated,
    selectedBranch,
    lastOrder,
    add,
    remove,
    setQty,
    clear,
    qtyOf: (productId: number) => items.find((item) => item.product.id === productId)?.qty ?? 0,
    stockOf,
    setSelectedBranch: (branch: BranchName) => setSelectedBranchState(branch),
    overLimitItems,
    checkout,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
