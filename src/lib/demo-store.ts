import { PRODUCTS, type Product } from "@/lib/products";

export const PICKUP_BRANCHES = [
  "Remera",
  "Kimironko",
  "Kacyiru",
  "Nyamirambo",
  "Gikondo",
  "Kanombe",
  "Kinyinya",
  "Kibagabaga",
  "Nyanza",
] as const;

export type BranchName = (typeof PICKUP_BRANCHES)[number];
export type UserRole = "customer" | "manager" | "staff";
export type PaymentMethod = "momo" | "pay-on-pickup";
export type OrderStatus = "placed" | "preparing" | "ready" | "collected";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branches: BranchName[];
};

type StoredUser = SessionUser & {
  password: string;
};

type BranchInventoryRow = {
  productId: number;
  stock: number;
  updatedAt: string;
};

export type BranchStorefrontRow = {
  branch: BranchName;
  productId: number;
  isVisible: boolean;
  updatedAt: string;
};

export type BranchReview = {
  id: string;
  branch: BranchName;
  rating: number;
  authorName: string;
  title: string;
  comment: string;
  createdAt: string;
};

export type OrderRecord = {
  id: string;
  branch: BranchName;
  pickupDate: string;
  pickupSlot: string;
  paymentMethod: PaymentMethod;
  paymentPhone?: string;
  notes?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    productId: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

type DemoState = {
  users: StoredUser[];
  inventory: Record<BranchName, BranchInventoryRow[]>;
  storefront: Record<BranchName, BranchStorefrontRow[]>;
  orders: OrderRecord[];
  reviews: BranchReview[];
};

type SearchIntent = {
  branch?: BranchName;
  maxPrice?: number;
  inStockOnly: boolean;
  category?: string;
  searchTerms: string[];
};

export type ConversationalSearchResult = {
  explanationParts: ConversationalSearchExplanation;
  branch: BranchName;
  products: Product[];
};

export type ConversationalSearchExplanation = {
    branch: BranchName;
    category?: string;
    maxPrice?: number;
    inStockOnly: boolean;
    terms: string[];
};

const STATE_KEY = "simba.demo.state.v2";
const SESSION_KEY = "simba.demo.session.v2";
const ORDER_STATUSES: OrderStatus[] = ["placed", "preparing", "ready", "collected"];

const STOP_WORDS = new Set([
  "show",
  "me",
  "for",
  "the",
  "a",
  "an",
  "and",
  "with",
  "pickup",
  "branch",
  "today",
  "please",
  "need",
  "find",
  "want",
  "some",
  "from",
  "at",
  "near",
  "my",
  "have",
  "has",
  "that",
  "are",
  "is",
  "ya",
  "za",
  "kwa",
  "na",
]);

const CATEGORY_KEYWORDS: Array<{ category: string; words: string[] }> = [
  { category: "Food Products", words: ["food", "groceries", "grocery", "bread", "rice", "milk", "cereal"] },
  { category: "Alcoholic Drinks", words: ["drink", "drinks", "wine", "beer", "soda", "juice", "oil"] },
  { category: "Cleaning & Sanitary", words: ["clean", "cleaning", "soap", "detergent", "tissue"] },
  { category: "Baby Products", words: ["baby", "diaper", "wipes", "milk formula", "toy"] },
  { category: "Cosmetics & Personal Care", words: ["cosmetic", "beauty", "care", "personal care", "shampoo"] },
  { category: "General", words: ["general", "essentials", "everyday"] },
  { category: "Kitchenware & Electronics", words: ["kitchen", "electronics", "electronic", "fruit", "pan"] },
];

function canUseDomStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function nowIso() {
  return new Date().toISOString();
}

function safeReadState(): DemoState | null {
  if (!canUseDomStorage()) return null;

  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw) as Partial<DemoState>);
  } catch {
    return null;
  }
}

function writeState(state: DemoState) {
  if (!canUseDomStorage()) return;
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function toSessionUser(user: StoredUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    branches: user.branches,
  };
}

function seededStock(productId: number, branchIndex: number, available: boolean) {
  if (!available) return 0;

  const seed = ((productId % 97) + 1) * (branchIndex + 3);
  if (seed % 11 === 0) return 0;
  if (seed % 5 === 0) return 2;
  return 4 + (seed % 18);
}

function seededVisibility(productId: number, branchIndex: number, stock: number) {
  if (stock <= 0) return false;
  return ((productId % 13) + branchIndex) % 7 !== 0;
}

function normalizeState(state: Partial<DemoState>): DemoState {
  const initial = createInitialState();
  const inventory = (state.inventory ?? initial.inventory) as Record<BranchName, BranchInventoryRow[]>;
  const storefront = (state.storefront ?? createInitialStorefront(inventory)) as Record<BranchName, BranchStorefrontRow[]>;

  return {
    users: state.users ?? initial.users,
    inventory,
    storefront,
    orders: state.orders ?? [],
    reviews: state.reviews ?? initial.reviews,
  };
}

function createInitialStorefront(inventory: Record<BranchName, BranchInventoryRow[]>) {
  return Object.fromEntries(
    PICKUP_BRANCHES.map((branch, branchIndex) => [
      branch,
      inventory[branch].map((row) => ({
        branch,
        productId: row.productId,
        isVisible: seededVisibility(row.productId, branchIndex, row.stock),
        updatedAt: nowIso(),
      })),
    ]),
  ) as Record<BranchName, BranchStorefrontRow[]>;
}

function createInitialState(): DemoState {
  const users: StoredUser[] = [
    {
      id: "manager-simba",
      name: "Ariane Manager",
      email: "manager@simba.demo",
      phone: "0788000001",
      password: "simba123",
      role: "manager",
      branches: [...PICKUP_BRANCHES],
    },
    {
      id: "admin-remera",
      name: "Bella Remera Admin",
      email: "admin.remera@simba.demo",
      phone: "0788000004",
      password: "simba123",
      role: "staff",
      branches: ["Remera"],
    },
    {
      id: "admin-kimironko",
      name: "David Kimironko Admin",
      email: "admin.kimironko@simba.demo",
      phone: "0788000005",
      password: "simba123",
      role: "staff",
      branches: ["Kimironko"],
    },
    {
      id: "staff-kacyiru",
      name: "Claude Staff",
      email: "staff@simba.demo",
      phone: "0788000002",
      password: "simba123",
      role: "staff",
      branches: ["Kacyiru"],
    },
    {
      id: "staff-kimironko",
      name: "Grace Staff",
      email: "kimironko@simba.demo",
      phone: "0788000003",
      password: "simba123",
      role: "staff",
      branches: ["Kimironko"],
    },
  ];

  const inventory = Object.fromEntries(
    PICKUP_BRANCHES.map((branch, branchIndex) => [
      branch,
      PRODUCTS.map((product) => ({
        productId: product.id,
        stock: seededStock(product.id, branchIndex, product.inStock),
        updatedAt: nowIso(),
      })),
    ]),
  ) as Record<BranchName, BranchInventoryRow[]>;

  const reviews: BranchReview[] = [
    {
      id: "review-remera-1",
      branch: "Remera",
      rating: 5,
      authorName: "Nadine",
      title: "Pickup was ready on time",
      comment: "Clear handoff, good packing, and the branch confirmed my order quickly.",
      createdAt: "2026-04-15T08:00:00.000Z",
    },
    {
      id: "review-kimironko-1",
      branch: "Kimironko",
      rating: 4,
      authorName: "Eric",
      title: "Strong grocery availability",
      comment: "Ibicuruzwa byinshi by'ibanze byari bihari kandi abakozi bateguye itumiza vuba.",
      createdAt: "2026-04-18T10:30:00.000Z",
    },
    {
      id: "review-kacyiru-1",
      branch: "Kacyiru",
      rating: 5,
      authorName: "Aline",
      title: "Best branch for quick collection",
      comment: "Helpful team and no waiting once I arrived for pickup.",
      createdAt: "2026-04-19T12:45:00.000Z",
    },
  ];

  return {
    users,
    inventory,
    storefront: createInitialStorefront(inventory),
    orders: [],
    reviews,
  };
}

export function ensureDemoState() {
  if (!canUseDomStorage()) return createInitialState();

  const current = safeReadState();
  if (current) return current;

  const initial = createInitialState();
  writeState(initial);
  return initial;
}

function readState() {
  return ensureDemoState();
}

function saveState(mutator: (state: DemoState) => DemoState) {
  const next = mutator(readState());
  writeState(next);
  return next;
}

function normalizeCredential(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("250") ? `0${digits.slice(3)}` : digits;
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

function findProduct(productId: number) {
  return PRODUCTS.find((product) => product.id === productId);
}

export function getSessionUser(): SessionUser | null {
  if (!canUseDomStorage()) return null;

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function setSessionUser(user: SessionUser | null) {
  if (!canUseDomStorage()) return;

  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function signOutUser() {
  setSessionUser(null);
}

export function authenticateUser(input: { credential: string; password: string }) {
  const state = readState();
  const credential = normalizeCredential(input.credential);
  const phone = normalizePhone(input.credential);
  const password = input.password.trim();

  const user = state.users.find(
    (candidate) =>
      candidate.password === password &&
      (candidate.email.toLowerCase() === credential || normalizePhone(candidate.phone) === phone),
  );

  if (!user) {
    return { ok: false as const, error: "auth.invalidCredentials" };
  }

  const sessionUser = toSessionUser(user);
  setSessionUser(sessionUser);
  return { ok: true as const, user: sessionUser };
}

export function registerCustomer(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone);
  const password = input.password.trim();

  if (!name || !email || phone.length < 10 || password.length < 6) {
    return { ok: false as const, error: "auth.invalidRegistration" };
  }

  const state = readState();
  const emailExists = state.users.some((user) => user.email.toLowerCase() === email);
  const phoneExists = state.users.some((user) => normalizePhone(user.phone) === phone);

  if (emailExists || phoneExists) {
    return { ok: false as const, error: "auth.accountExists" };
  }

  const user: StoredUser = {
    id: createId("customer"),
    name,
    email,
    phone,
    password,
    role: "customer",
    branches: [],
  };

  saveState((current) => ({ ...current, users: [...current.users, user] }));
  const sessionUser = toSessionUser(user);
  setSessionUser(sessionUser);
  return { ok: true as const, user: sessionUser };
}

export function authenticateGoogleUser(input: {
  email: string;
  name: string;
  googleSubject: string;
}) {
  return authenticateSocialUser({
    email: input.email,
    name: input.name,
    provider: "google",
    subject: input.googleSubject,
  });
}

export function authenticateSocialUser(input: {
  email: string;
  name: string;
  provider: "google" | "facebook";
  subject: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!email || !name) {
    return { ok: false as const, error: "auth.socialInvalidProfile" };
  }

  const state = readState();
  const existingUser = state.users.find((user) => user.email.toLowerCase() === email);

  if (existingUser) {
    const nextUser: StoredUser = {
      ...existingUser,
      name,
    };

    saveState((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === existingUser.id ? nextUser : user)),
    }));

    const sessionUser = toSessionUser(nextUser);
    setSessionUser(sessionUser);
    return { ok: true as const, user: sessionUser };
  }

  const user: StoredUser = {
    id: `${input.provider}-${input.subject}`,
    name,
    email,
    phone: "",
    password: "",
    role: "customer",
    branches: [],
  };

  saveState((current) => ({ ...current, users: [...current.users, user] }));
  const sessionUser = toSessionUser(user);
  setSessionUser(sessionUser);
  return { ok: true as const, user: sessionUser };
}

export function getBranchInventory(branch: BranchName) {
  const state = readState();
  const rows = state.inventory[branch] ?? [];
  const stockMap = new Map(rows.map((row) => [row.productId, row]));

  return PRODUCTS.map((product) => {
    const row = stockMap.get(product.id);
    return {
      ...product,
      branch,
      stock: row?.stock ?? 0,
      updatedAt: row?.updatedAt ?? nowIso(),
    };
  });
}

export function getBranchStock(branch: BranchName, productId: number) {
  const state = readState();
  return state.inventory[branch]?.find((row) => row.productId === productId)?.stock ?? 0;
}

export function getBranchStorefront(branch: BranchName) {
  const state = readState();
  return state.storefront[branch] ?? [];
}

export function isProductPublished(branch: BranchName, productId: number) {
  return getBranchStorefront(branch).find((row) => row.productId === productId)?.isVisible ?? false;
}

export function getBranchSellableStock(branch: BranchName, productId: number) {
  const stock = getBranchStock(branch, productId);
  return stock > 0 && isProductPublished(branch, productId) ? stock : 0;
}

export function getBranchSellableStockMap(branch: BranchName) {
  return Object.fromEntries(
    PRODUCTS.map((product) => [product.id, getBranchSellableStock(branch, product.id)]),
  ) as Record<number, number>;
}

export function getSellableProductsForBranch(branch: BranchName) {
  const sellableStock = getBranchSellableStockMap(branch);
  return PRODUCTS.filter((product) => (sellableStock[product.id] ?? 0) > 0);
}

export function updateBranchStock(branch: BranchName, productId: number, nextStock: number) {
  saveState((current) => ({
    ...current,
    inventory: {
      ...current.inventory,
      [branch]: current.inventory[branch].map((row) =>
        row.productId === productId
          ? { ...row, stock: Math.max(0, Math.round(nextStock)), updatedAt: nowIso() }
          : row,
      ),
    },
  }));
}

export function setBranchProductVisibility(branch: BranchName, productId: number, isVisible: boolean) {
  const stock = getBranchStock(branch, productId);
  if (isVisible && stock <= 0) {
    return { ok: false as const, error: "dashboard.publishRequiresStock" };
  }

  saveState((current) => {
    const rows = current.storefront[branch] ?? [];
    const existing = rows.some((row) => row.productId === productId);
    const nextRow: BranchStorefrontRow = {
      branch,
      productId,
      isVisible,
      updatedAt: nowIso(),
    };

    return {
      ...current,
      storefront: {
        ...current.storefront,
        [branch]: existing
          ? rows.map((row) => (row.productId === productId ? nextRow : row))
          : [...rows, nextRow],
      },
    };
  });

  return { ok: true as const };
}

export function getAdminBranchCatalog(branch: BranchName) {
  const visibility = new Map(getBranchStorefront(branch).map((row) => [row.productId, row.isVisible]));

  return getBranchInventory(branch).map((product) => ({
    ...product,
    isVisible: visibility.get(product.id) ?? false,
    isSellable: product.stock > 0 && (visibility.get(product.id) ?? false),
  }));
}

export function getBranchReviewSummary(branch: BranchName) {
  const reviews = getBranchReviews(branch);
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return {
    count: reviews.length,
    average,
  };
}

export function getBranchReviews(branch: BranchName) {
  return readState()
    .reviews.filter((review) => review.branch === branch)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addBranchReview(input: {
  branch: BranchName;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
}) {
  const review: BranchReview = {
    id: createId("review"),
    branch: input.branch,
    authorName: input.authorName.trim(),
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    title: input.title.trim(),
    comment: input.comment.trim(),
    createdAt: nowIso(),
  };

  if (!review.authorName || !review.title || !review.comment) {
    return { ok: false as const, error: "reviews.invalid" };
  }

  saveState((current) => ({ ...current, reviews: [review, ...current.reviews] }));
  return { ok: true as const, review };
}

export function createPickupOrder(input: {
  user: SessionUser;
  branch: BranchName;
  pickupDate: string;
  pickupSlot: string;
  paymentMethod: PaymentMethod;
  paymentPhone?: string;
  customerPhone: string;
  notes?: string;
  items: Array<{ productId: number; quantity: number }>;
}) {
  const sanitizedItems = input.items
    .map((item) => ({ ...item, quantity: Math.max(0, Math.round(item.quantity)) }))
    .filter((item) => item.quantity > 0);

  if (!sanitizedItems.length) {
    return { ok: false as const, error: "checkout.emptyCart" };
  }

  const state = readState();
  const branchInventory = state.inventory[input.branch] ?? [];
  const inventoryMap = new Map(branchInventory.map((row) => [row.productId, row]));

  for (const item of sanitizedItems) {
    const stock = inventoryMap.get(item.productId)?.stock ?? 0;
    if (stock < item.quantity) {
      const product = findProduct(item.productId);
      return {
        ok: false as const,
        error: "checkout.stockChanged",
        productName: product?.name ?? "Product",
      };
    }
  }

  const items = sanitizedItems.map((item) => {
    const product = findProduct(item.productId);
    if (!product) {
      throw new Error(`Missing product ${item.productId}`);
    }

    return {
      productId: item.productId,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order: OrderRecord = {
    id: `S2-${Date.now().toString().slice(-6)}`,
    branch: input.branch,
    pickupDate: input.pickupDate,
    pickupSlot: input.pickupSlot,
    paymentMethod: input.paymentMethod,
    paymentPhone: input.paymentPhone?.trim(),
    notes: input.notes?.trim(),
    customerId: input.user.id,
    customerName: input.user.name,
    customerEmail: input.user.email,
    customerPhone: normalizePhone(input.customerPhone),
    items,
    subtotal,
    total: subtotal,
    status: "placed",
    createdAt: nowIso(),
  };

  saveState((current) => ({
    ...current,
    orders: [order, ...current.orders],
    inventory: {
      ...current.inventory,
      [input.branch]: current.inventory[input.branch].map((row) => {
        const ordered = sanitizedItems.find((item) => item.productId === row.productId);
        if (!ordered) return row;
        return {
          ...row,
          stock: Math.max(0, row.stock - ordered.quantity),
          updatedAt: nowIso(),
        };
      }),
    },
  }));

  return { ok: true as const, order };
}

export function getOrdersForUser(user: SessionUser) {
  return readState().orders.filter((order) => order.customerId === user.id);
}

export function getOrdersForBranches(branches: BranchName[]) {
  const branchSet = new Set(branches);
  return readState().orders.filter((order) => branchSet.has(order.branch));
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (!ORDER_STATUSES.includes(status)) {
    return { ok: false as const };
  }

  saveState((current) => ({
    ...current,
    orders: current.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
  }));

  return { ok: true as const };
}

export function getDashboardSummary(branches: BranchName[]) {
  const orders = getOrdersForBranches(branches);
  const branchSet = new Set(branches);
  const inventory = readState().inventory;
  const relevantInventory = Object.entries(inventory)
    .filter(([branch]) => branchSet.has(branch as BranchName))
    .flatMap(([, rows]) => rows);

  return {
    orderCount: orders.length,
    readyCount: orders.filter((order) => order.status === "ready").length,
    lowStockCount: relevantInventory.filter((row) => row.stock > 0 && row.stock <= 3).length,
    zeroStockCount: relevantInventory.filter((row) => row.stock === 0).length,
  };
}

function parseSearchIntent(query: string, selectedBranch: BranchName): SearchIntent {
  const lower = query.toLowerCase();
  const branch = PICKUP_BRANCHES.find((candidate) => lower.includes(candidate.toLowerCase()));
  const maxPriceMatch = lower.match(/(?:under|below|less than)\s*(\d[\d,]*)/i);
  const maxPrice = maxPriceMatch ? Number(maxPriceMatch[1].replace(/,/g, "")) : undefined;
  const category = CATEGORY_KEYWORDS.find(({ words }) =>
    words.some((word) => lower.includes(word)),
  )?.category;

  const terms = lower
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term && !STOP_WORDS.has(term));

  return {
    branch: branch ?? selectedBranch,
    maxPrice,
    inStockOnly:
      lower.includes("in stock") ||
      lower.includes("available") ||
      lower.includes("pickup today") ||
      lower.includes("ready now"),
    category,
    searchTerms: terms,
  };
}

function scoreProduct(product: Product, terms: string[]) {
  const haystack = `${product.name} ${product.category}`.toLowerCase();
  return terms.reduce((score, term) => {
    if (product.name.toLowerCase().includes(term)) return score + 5;
    if (haystack.includes(term)) return score + 2;
    return score;
  }, 0);
}

export function conversationalSearch(query: string, selectedBranch: BranchName): ConversationalSearchResult {
  const intent = parseSearchIntent(query, selectedBranch);
  const branch = intent.branch ?? selectedBranch;
  const stockMap = new Map(getBranchInventory(branch).map((product) => [product.id, product.stock]));

  let filtered = PRODUCTS.filter((product) => {
    if (intent.category && product.category !== intent.category) return false;
    if (intent.maxPrice !== undefined && product.price > intent.maxPrice) return false;
    if (intent.inStockOnly && (stockMap.get(product.id) ?? 0) <= 0) return false;

    if (!intent.searchTerms.length) return true;
    return scoreProduct(product, intent.searchTerms) > 0;
  });

  filtered = filtered
    .sort((a, b) => {
      const scoreDiff = scoreProduct(b, intent.searchTerms) - scoreProduct(a, intent.searchTerms);
      if (scoreDiff !== 0) return scoreDiff;

      const stockDiff = (stockMap.get(b.id) ?? 0) - (stockMap.get(a.id) ?? 0);
      if (stockDiff !== 0) return stockDiff;

      return a.price - b.price;
    })
    .slice(0, 36);

  return {
    branch,
    products: filtered,
    explanationParts: {
      branch,
      category: intent.category,
      maxPrice: intent.maxPrice,
      inStockOnly: intent.inStockOnly,
      terms: intent.searchTerms,
    },
  };
}
