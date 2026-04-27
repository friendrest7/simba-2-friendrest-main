import { PRODUCTS, formatRWF, type Product } from "@/lib/products";

export type CartLineInput = {
  product: Product;
  qty: number;
};

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "out-for-delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "mobile-money" | "cash-on-delivery";

export type CheckoutOrderInput = {
  customerName: string;
  phoneNumber: string;
  deliveryLocation: string;
  paymentMethod: PaymentMethod;
  momoNumber?: string;
};

export type CustomerOrder = {
  id: string;
  customerName: string;
  phoneNumber: string;
  deliveryLocation: string;
  paymentMethod: PaymentMethod;
  momoNumber?: string;
  status: OrderStatus;
  deliveryStatus: OrderStatus;
  subtotal: number;
  deliveryFee: number;
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

const ORDERS_KEY = "simba.orders.v2";
const LEGACY_ORDERS_KEY = "simba.orders.v1";
const STOCK_KEY = "simba.stock.v1";
const LAST_ORDER_KEY = "simba.last-order.v1";
const STORE_EVENT = "simba:store-updated";
const DELIVERY_FEE = 1500;
const FREE_DELIVERY_THRESHOLD = 25000;

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

const normalizeStatus = (status: string | undefined): OrderStatus => {
  switch (status) {
    case "accepted":
    case "preparing":
    case "out-for-delivery":
    case "delivered":
    case "cancelled":
      return status;
    case "confirmed":
      return "accepted";
    default:
      return "pending";
  }
};

const normalizeOrder = (order: Partial<CustomerOrder> & { id: string }): CustomerOrder => {
  const subtotal =
    typeof order.subtotal === "number"
      ? order.subtotal
      : (order.items ?? []).reduce(
          (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
          0,
        );
  const deliveryFee =
    typeof order.deliveryFee === "number" ? order.deliveryFee : getDeliveryFee(subtotal);
  const status = normalizeStatus(order.status);

  return {
    id: order.id,
    customerName: order.customerName ?? "",
    phoneNumber: order.phoneNumber ?? "",
    deliveryLocation: order.deliveryLocation ?? "",
    paymentMethod: order.paymentMethod === "cash-on-delivery" ? "cash-on-delivery" : "mobile-money",
    momoNumber: order.momoNumber,
    status,
    deliveryStatus: normalizeStatus(order.deliveryStatus ?? order.status),
    subtotal,
    deliveryFee,
    total: typeof order.total === "number" ? order.total : subtotal + deliveryFee,
    createdAt: order.createdAt ?? new Date().toISOString(),
    items: (order.items ?? []).map((item) => ({
      productId: Number(item.productId),
      name: item.name ?? "",
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 0),
      image: item.image ?? "",
    })),
  };
};

const readOrders = (): CustomerOrder[] => {
  const current = safeRead<Array<Partial<CustomerOrder> & { id: string }>>(ORDERS_KEY, []);
  if (current.length > 0) {
    return current.map(normalizeOrder);
  }

  const legacy = safeRead<Array<Partial<CustomerOrder> & { id: string }>>(LEGACY_ORDERS_KEY, []);
  if (legacy.length > 0) {
    const migrated = legacy.map(normalizeOrder);
    safeWrite(ORDERS_KEY, migrated);
    return migrated;
  }

  return [];
};

const writeOrders = (orders: CustomerOrder[]) => {
  safeWrite(ORDERS_KEY, orders);
  emitStoreUpdate();
};

const writeStockMap = (stockMap: Record<number, number>) => {
  safeWrite(STOCK_KEY, stockMap);
  emitStoreUpdate();
};

export const getDeliveryFee = (subtotal: number) =>
  subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

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

export const getOrders = () => readOrders();

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
    if (
      event.key === ORDERS_KEY ||
      event.key === LEGACY_ORDERS_KEY ||
      event.key === STOCK_KEY ||
      event.key === LAST_ORDER_KEY
    ) {
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
  const deliveryFee = getDeliveryFee(subtotal);
  const order: CustomerOrder = {
    id: `SIM-${Date.now().toString(36).toUpperCase()}`,
    customerName: input.customerName.trim(),
    phoneNumber: input.phoneNumber.trim(),
    deliveryLocation: input.deliveryLocation.trim(),
    paymentMethod: input.paymentMethod,
    momoNumber: input.momoNumber?.trim() || undefined,
    status: "pending",
    deliveryStatus: "pending",
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
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
  const updatedOrders = getOrders().map((order) =>
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
  {
    label: "cart.delivery",
    value: order.deliveryFee === 0 ? "cart.free" : formatRWF(order.deliveryFee),
  },
  { label: "cart.total", value: formatRWF(order.total) },
];
