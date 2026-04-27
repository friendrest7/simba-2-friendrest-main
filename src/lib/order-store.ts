import { PRODUCTS, formatRWF, type Product } from "@/lib/products";

export type CartLineInput = {
  product: Product;
  qty: number;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out-for-delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "mobile-money" | "cash-on-delivery";

export type CustomerOrder = {
  id: string;
  customerName: string;
  phoneNumber: string;
  deliveryLocation: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  deliveryStatus: string;
  subtotal: number;
  total: number;
  createdAt: string;
  items: Array<{
    productId: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
};

export type CheckoutOrderInput = {
  customerName: string;
  phoneNumber: string;
  deliveryLocation: string;
  paymentMethod: PaymentMethod;
};

const ORDERS_KEY = "simba.orders.v1";
const STOCK_KEY = "simba.stock.v1";
const LAST_ORDER_KEY = "simba.last-order.v1";
const STORE_EVENT = "simba:store-updated";

const hasWindow = () => typeof window !== "undefined";

const emitStoreUpdate = () => {
  if (!hasWindow()) return;
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
};

const safeRead = <T>(key: string, fallback: T): T => {
  if (!hasWindow()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key: string, value: unknown) => {
  if (!hasWindow()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const buildInitialStockMap = () =>
  Object.fromEntries(
    PRODUCTS.map((product) => {
      const seededStock = product.inStock ? 4 + (product.id % 15) : 0;
      const stock = product.id % 19 === 0 ? 0 : seededStock;
      return [product.id, stock];
    }),
  ) as Record<number, number>;

export const getStockMap = () => {
  const stored = safeRead<Record<number, number>>(STOCK_KEY, {});
  if (Object.keys(stored).length > 0) {
    return stored;
  }

  const initialStock = buildInitialStockMap();
  safeWrite(STOCK_KEY, initialStock);
  return initialStock;
};

export const getStockOf = (productId: number) => getStockMap()[productId] ?? 0;

export const getOrders = () => safeRead<CustomerOrder[]>(ORDERS_KEY, []);

export const getOrderById = (orderId: string) =>
  getOrders().find((order) => order.id === orderId) ?? null;

export const getLastOrder = () => {
  const orderId = safeRead<string | null>(LAST_ORDER_KEY, null);
  return orderId ? getOrderById(orderId) : null;
};

export const subscribeStore = (listener: () => void) => {
  if (!hasWindow()) {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === ORDERS_KEY || event.key === STOCK_KEY || event.key === LAST_ORDER_KEY) {
      listener();
    }
  };
  const handleCustomEvent = () => listener();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORE_EVENT, handleCustomEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORE_EVENT, handleCustomEvent);
  };
};

const writeOrders = (orders: CustomerOrder[]) => {
  safeWrite(ORDERS_KEY, orders);
  emitStoreUpdate();
};

const writeStockMap = (stockMap: Record<number, number>) => {
  safeWrite(STOCK_KEY, stockMap);
  emitStoreUpdate();
};

export const formatOrderStatus = (status: OrderStatus, t: (key: string) => string) =>
  t(`order.status.${status}`);

export const getDeliveryStatusText = (status: OrderStatus, t: (key: string) => string) =>
  t(`order.delivery.${status}`);

export const placeOrder = (input: CheckoutOrderInput, items: CartLineInput[]) => {
  const stockMap = getStockMap();

  for (const item of items) {
    const available = stockMap[item.product.id] ?? 0;
    if (available < item.qty) {
      return {
        ok: false as const,
        error: "checkout.error.stockUnavailable",
        productName: item.product.name,
      };
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const order: CustomerOrder = {
    id: `SIM-${Date.now().toString(36).toUpperCase()}`,
    customerName: input.customerName.trim(),
    phoneNumber: input.phoneNumber.trim(),
    deliveryLocation: input.deliveryLocation.trim(),
    paymentMethod: input.paymentMethod,
    status: "pending",
    deliveryStatus: "pending",
    subtotal,
    total: subtotal,
    createdAt: new Date().toISOString(),
    items: items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.qty,
      image: item.product.image,
    })),
  };

  const nextStockMap = { ...stockMap };
  for (const item of items) {
    nextStockMap[item.product.id] = Math.max(0, (nextStockMap[item.product.id] ?? 0) - item.qty);
  }

  writeStockMap(nextStockMap);
  writeOrders([order, ...getOrders()]);
  safeWrite(LAST_ORDER_KEY, order.id);
  emitStoreUpdate();

  return { ok: true as const, order };
};

export const updateOrderStatus = (orderId: string, status: OrderStatus) => {
  const orders = getOrders();
  const updatedOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          status,
          deliveryStatus: status,
        }
      : order,
  );
  writeOrders(updatedOrders);
  return updatedOrders.find((order) => order.id === orderId) ?? null;
};

export const getRevenue = (orders: CustomerOrder[]) =>
  orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);

export const getOrderSummaryLines = (order: CustomerOrder) => [
  { label: "cart.subtotal", value: formatRWF(order.subtotal) },
  { label: "cart.total", value: formatRWF(order.total) },
];
