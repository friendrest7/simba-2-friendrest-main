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
export type FulfillmentMethod = "delivery" | "pickup";
export type PaymentMethod = "momo" | "cash" | "card";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packing"
  | "out-for-delivery"
  | "ready-for-pickup"
  | "completed"
  | "cancelled";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branches: BranchName[];
};

export type CatalogProduct = Product & {
  brand: string;
  description: string;
  tags: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BranchProfile = {
  name: BranchName;
  district: string;
  neighborhood: string;
  address: string;
  phone: string;
  managerName: string;
  deliveryEta: string;
  pickupEta: string;
  coverage: string;
  openHours: string;
  isActive: boolean;
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

export type DeliveryAddress = {
  district: string;
  neighborhood: string;
  streetAddress: string;
  landmark?: string;
  specialInstructions?: string;
};

export type OrderRecord = {
  id: string;
  branch: BranchName;
  fulfillmentMethod: FulfillmentMethod;
  deliveryWindow: string;
  pickupDate?: string;
  pickupSlot?: string;
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
  deliveryFee: number;
  serviceFee: number;
  total: number;
  status: OrderStatus;
  deliveryAddress?: DeliveryAddress;
  assignedTo: string;
  createdAt: string;
};

type DemoState = {
  users: StoredUser[];
  catalog: CatalogProduct[];
  branches: BranchProfile[];
  inventory: Record<BranchName, BranchInventoryRow[]>;
  storefront: Record<BranchName, BranchStorefrontRow[]>;
  orders: OrderRecord[];
  reviews: BranchReview[];
};

type SearchIntent = {
  branch?: BranchName;
  maxPrice?: number;
  minPrice?: number;
  inStockOnly: boolean;
  category?: string;
  searchTerms: string[];
};

export type ConversationalSearchResult = {
  explanationParts: ConversationalSearchExplanation;
  branch: BranchName;
  products: CatalogProduct[];
};

export type ConversationalSearchExplanation = {
  branch: BranchName;
  category?: string;
  maxPrice?: number;
  inStockOnly: boolean;
  terms: string[];
};

const STATE_KEY = "simba.demo.state.v3";
const SESSION_KEY = "simba.demo.session.v3";
const CART_KEY = "simba.cart.v2";
const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "packing",
  "out-for-delivery",
  "ready-for-pickup",
  "completed",
  "cancelled",
];
const LOW_STOCK_THRESHOLD = 6;
const listeners = new Set<() => void>();
let stateVersion = 0;

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
  "delivery",
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
  "for",
  "under",
  "below",
  "less",
  "than",
]);

const CATEGORY_KEYWORDS: Array<{ category: string; words: string[] }> = [
  { category: "Food Products", words: ["food", "groceries", "grocery", "bread", "rice", "milk", "cereal", "snack"] },
  { category: "Alcoholic Drinks", words: ["drink", "drinks", "wine", "beer", "soda", "juice", "oil", "water"] },
  { category: "Cleaning & Sanitary", words: ["clean", "cleaning", "soap", "detergent", "tissue", "sanitary"] },
  { category: "Baby Products", words: ["baby", "diaper", "wipes", "formula", "toy", "kids"] },
  { category: "Cosmetics & Personal Care", words: ["cosmetic", "beauty", "care", "personal", "shampoo", "cream"] },
  { category: "General", words: ["general", "essentials", "everyday", "office", "battery"] },
  { category: "Kitchenware & Electronics", words: ["kitchen", "electronics", "electronic", "fruit", "pan", "appliance"] },
  { category: "Kitchen Storage", words: ["storage", "container", "jar"] },
  { category: "Sports & Wellness", words: ["sports", "wellness", "fitness", "gym"] },
];

const DEFAULT_BRANCH_PROFILES: BranchProfile[] = [
  {
    name: "Remera",
    district: "Gasabo",
    neighborhood: "Remera",
    address: "KG 11 Ave, Remera",
    phone: "+250 788 110 101",
    managerName: "Ariane Mukamana",
    deliveryEta: "18-28 min",
    pickupEta: "Ready in 15 min",
    coverage: "Remera, Nyarutarama, Amahoro",
    openHours: "07:00 - 22:00",
    isActive: true,
  },
  {
    name: "Kimironko",
    district: "Gasabo",
    neighborhood: "Kimironko",
    address: "KN 3 Rd, Kimironko",
    phone: "+250 788 110 102",
    managerName: "David Niyonzima",
    deliveryEta: "16-24 min",
    pickupEta: "Ready in 12 min",
    coverage: "Kimironko, Kibagabaga, Kimihurura",
    openHours: "07:00 - 22:00",
    isActive: true,
  },
  {
    name: "Kacyiru",
    district: "Gasabo",
    neighborhood: "Kacyiru",
    address: "KG 7 Ave, Kacyiru",
    phone: "+250 788 110 103",
    managerName: "Bella Uwase",
    deliveryEta: "18-26 min",
    pickupEta: "Ready in 14 min",
    coverage: "Kacyiru, Kigali Heights, Gaculiro",
    openHours: "07:00 - 22:00",
    isActive: true,
  },
  {
    name: "Nyamirambo",
    district: "Nyarugenge",
    neighborhood: "Nyamirambo",
    address: "KN 20 St, Nyamirambo",
    phone: "+250 788 110 104",
    managerName: "Claude Habimana",
    deliveryEta: "20-30 min",
    pickupEta: "Ready in 16 min",
    coverage: "Nyamirambo, Rwezamenyo, City Centre",
    openHours: "07:00 - 22:00",
    isActive: true,
  },
  {
    name: "Gikondo",
    district: "Kicukiro",
    neighborhood: "Gikondo",
    address: "KK 5 Rd, Gikondo",
    phone: "+250 788 110 105",
    managerName: "Grace Umutoni",
    deliveryEta: "19-29 min",
    pickupEta: "Ready in 15 min",
    coverage: "Gikondo, Kicukiro, Sonatubes",
    openHours: "07:00 - 22:00",
    isActive: true,
  },
  {
    name: "Kanombe",
    district: "Kicukiro",
    neighborhood: "Kanombe",
    address: "KK 18 Ave, Kanombe",
    phone: "+250 788 110 106",
    managerName: "Patrick Mugisha",
    deliveryEta: "22-32 min",
    pickupEta: "Ready in 18 min",
    coverage: "Kanombe, Busanza, Kabeza",
    openHours: "07:00 - 22:00",
    isActive: true,
  },
  {
    name: "Kinyinya",
    district: "Gasabo",
    neighborhood: "Kinyinya",
    address: "KG 44 St, Kinyinya",
    phone: "+250 788 110 107",
    managerName: "Nadine Mukeshimana",
    deliveryEta: "21-31 min",
    pickupEta: "Ready in 17 min",
    coverage: "Kinyinya, Rebero ya Kinyinya, Gacuriro",
    openHours: "07:00 - 22:00",
    isActive: true,
  },
  {
    name: "Kibagabaga",
    district: "Gasabo",
    neighborhood: "Kibagabaga",
    address: "KG 9 Ave, Kibagabaga",
    phone: "+250 788 110 108",
    managerName: "Eric Tuyisenge",
    deliveryEta: "18-27 min",
    pickupEta: "Ready in 13 min",
    coverage: "Kibagabaga, Kimironko, Nyarutarama",
    openHours: "07:00 - 22:00",
    isActive: true,
  },
  {
    name: "Nyanza",
    district: "Kicukiro",
    neighborhood: "Nyanza",
    address: "KK 15 Ave, Nyanza",
    phone: "+250 788 110 109",
    managerName: "Jean Bosco Nshimiyimana",
    deliveryEta: "23-34 min",
    pickupEta: "Ready in 20 min",
    coverage: "Nyanza, Rebero, Kicukiro Centre",
    openHours: "07:00 - 22:00",
    isActive: true,
  },
];

function canUseDomStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function emitStateChange() {
  stateVersion += 1;
  listeners.forEach((listener) => listener());
}

export function subscribeDemoState(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDemoStateVersion() {
  return stateVersion;
}

function nowIso() {
  return new Date().toISOString();
}

function daysAgo(days: number, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
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
  emitStateChange();
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
  const seed = ((productId % 97) + 1) * (branchIndex + 5);
  if (seed % 19 === 0) return 0;
  if (seed % 11 === 0) return 2;
  if (seed % 7 === 0) return 5;
  return 8 + (seed % 28);
}

function seededVisibility(productId: number, branchIndex: number, stock: number) {
  if (stock <= 0) return false;
  return ((productId % 17) + branchIndex) % 8 !== 0;
}

function guessBrand(name: string) {
  const token = name
    .split(/\s+/)
    .find((word) => word.length > 2 && /[a-z0-9]/i.test(word));
  return token?.replace(/[^a-z0-9]/gi, "") || "Simba";
}

function createProductDescription(product: Product) {
  const category = product.category.replace(/&/g, "and").toLowerCase();
  return `${product.name} is a branch-ready ${category} item prepared for fast grocery delivery and pickup across Kigali.`;
}

function createProductTags(product: Product) {
  return Array.from(
    new Set(
      [
        guessBrand(product.name).toLowerCase(),
        product.category.toLowerCase(),
        product.unit.toLowerCase(),
        ...product.name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((part) => part.length > 2),
      ].filter(Boolean),
    ),
  );
}

function buildSeedCatalogProducts() {
  return PRODUCTS.map((product, index) => ({
    ...product,
    brand: guessBrand(product.name),
    description: createProductDescription(product),
    tags: createProductTags(product),
    featured: index < 36 || /simba|milk|bread|oil|rice|juice/i.test(product.name),
    createdAt: daysAgo(45 + (index % 21)),
    updatedAt: daysAgo(index % 9),
  }));
}

function buildInventory(catalog: CatalogProduct[]) {
  return Object.fromEntries(
    PICKUP_BRANCHES.map((branch, branchIndex) => [
      branch,
      catalog.map((product) => ({
        productId: product.id,
        stock: seededStock(product.id, branchIndex, product.inStock),
        updatedAt: daysAgo(branchIndex % 4),
      })),
    ]),
  ) as Record<BranchName, BranchInventoryRow[]>;
}

function createInitialStorefront(
  catalog: CatalogProduct[],
  inventory: Record<BranchName, BranchInventoryRow[]>,
) {
  return Object.fromEntries(
    PICKUP_BRANCHES.map((branch, branchIndex) => [
      branch,
      catalog.map((product) => {
        const stock = inventory[branch].find((row) => row.productId === product.id)?.stock ?? 0;
        return {
          branch,
          productId: product.id,
          isVisible: seededVisibility(product.id, branchIndex, stock),
          updatedAt: daysAgo(branchIndex % 3),
        };
      }),
    ]),
  ) as Record<BranchName, BranchStorefrontRow[]>;
}

function createInitialOrders(catalog: CatalogProduct[]): OrderRecord[] {
  const findProduct = (matcher: RegExp, fallbackIndex: number) =>
    catalog.find((product) => matcher.test(product.name)) ?? catalog[fallbackIndex];
  const milk = findProduct(/milk/i, 0);
  const bread = findProduct(/bread|baguette|croissant/i, 1);
  const oil = findProduct(/oil/i, 2);
  const juice = findProduct(/juice|soda|orange/i, 3);
  const wipes = findProduct(/wipes|tissue/i, 4);
  const eggs = findProduct(/egg/i, 5);

  const order = (
    id: string,
    branch: BranchName,
    status: OrderStatus,
    createdAt: string,
    fulfillmentMethod: FulfillmentMethod,
    items: Array<{ product: CatalogProduct; quantity: number }>,
    customerName: string,
    deliveryAddress?: DeliveryAddress,
  ): OrderRecord => {
    const orderItems = items.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
    }));
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = fulfillmentMethod === "delivery" ? 1500 : 0;
    const serviceFee = subtotal >= 20000 ? 0 : 500;
    return {
      id,
      branch,
      fulfillmentMethod,
      deliveryWindow:
        fulfillmentMethod === "delivery" ? "Today, 18:00 - 20:00" : "Collection within 25 min",
      pickupDate: fulfillmentMethod === "pickup" ? createdAt.slice(0, 10) : undefined,
      pickupSlot: fulfillmentMethod === "pickup" ? "16:00 - 18:00" : undefined,
      paymentMethod: fulfillmentMethod === "delivery" ? "momo" : "cash",
      paymentPhone: "0788000100",
      notes: fulfillmentMethod === "delivery" ? "Call on arrival at the gate." : "Pickup from express counter.",
      customerId: `seed-${id.toLowerCase()}`,
      customerName,
      customerEmail: `${customerName.toLowerCase().replace(/\s+/g, ".")}@simba.demo`,
      customerPhone: "0788000100",
      items: orderItems,
      subtotal,
      deliveryFee,
      serviceFee,
      total: subtotal + deliveryFee + serviceFee,
      status,
      deliveryAddress,
      assignedTo:
        fulfillmentMethod === "delivery" ? "Internal rider - Simba Fleet" : "Collection desk",
      createdAt,
    };
  };

  return [
    order(
      "SBA-240091",
      "Kimironko",
      "pending",
      daysAgo(0, 8, 20),
      "delivery",
      [
        { product: milk, quantity: 4 },
        { product: bread, quantity: 3 },
        { product: wipes, quantity: 1 },
      ],
      "Aline Mukamana",
      {
        district: "Gasabo",
        neighborhood: "Kimironko",
        streetAddress: "KN 3 Rd, House 14",
        landmark: "Opposite Kimironko Market",
        specialInstructions: "Use the side gate after calling.",
      },
    ),
    order(
      "SBA-240092",
      "Remera",
      "confirmed",
      daysAgo(0, 9, 40),
      "delivery",
      [
        { product: oil, quantity: 1 },
        { product: juice, quantity: 4 },
      ],
      "Eric Habimana",
      {
        district: "Gasabo",
        neighborhood: "Remera",
        streetAddress: "KG 11 Ave, Plot 88",
      },
    ),
    order(
      "SBA-240093",
      "Kacyiru",
      "packing",
      daysAgo(0, 11, 15),
      "pickup",
      [
        { product: bread, quantity: 6 },
        { product: eggs, quantity: 12 },
      ],
      "Nadine Uwera",
    ),
    order(
      "SBA-240094",
      "Gikondo",
      "out-for-delivery",
      daysAgo(0, 12, 5),
      "delivery",
      [
        { product: milk, quantity: 2 },
        { product: oil, quantity: 1 },
        { product: juice, quantity: 2 },
      ],
      "Patrick Mutabazi",
      {
        district: "Kicukiro",
        neighborhood: "Gikondo",
        streetAddress: "KK 5 Rd, Gate 7",
      },
    ),
    order(
      "SBA-240081",
      "Nyamirambo",
      "ready-for-pickup",
      daysAgo(1, 17, 25),
      "pickup",
      [
        { product: bread, quantity: 4 },
        { product: juice, quantity: 2 },
      ],
      "Jeanne Mukarukundo",
    ),
    order(
      "SBA-240074",
      "Kibagabaga",
      "completed",
      daysAgo(2, 15, 10),
      "delivery",
      [
        { product: oil, quantity: 2 },
        { product: wipes, quantity: 3 },
      ],
      "Diane Ingabire",
      {
        district: "Gasabo",
        neighborhood: "Kibagabaga",
        streetAddress: "KG 9 Ave, Apt 21",
      },
    ),
    order(
      "SBA-240066",
      "Kanombe",
      "completed",
      daysAgo(3, 13, 35),
      "pickup",
      [
        { product: eggs, quantity: 24 },
        { product: bread, quantity: 2 },
      ],
      "Samuel Mugabo",
    ),
    order(
      "SBA-240055",
      "Nyanza",
      "cancelled",
      daysAgo(4, 18, 5),
      "delivery",
      [{ product: milk, quantity: 1 }],
      "Claire Uwimana",
      {
        district: "Kicukiro",
        neighborhood: "Nyanza",
        streetAddress: "KK 15 Ave, House 4",
      },
    ),
  ];
}

function createInitialState(): DemoState {
  const catalog = buildSeedCatalogProducts();
  const inventory = buildInventory(catalog);

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
    {
      id: "customer-demo",
      name: "Simba Customer",
      email: "customer@simba.demo",
      phone: "0788000010",
      password: "simba123",
      role: "customer",
      branches: [],
    },
  ];

  return {
    users,
    catalog,
    branches: DEFAULT_BRANCH_PROFILES,
    inventory,
    storefront: createInitialStorefront(catalog, inventory),
    orders: createInitialOrders(catalog),
    reviews: [
      {
        id: "review-remera-1",
        branch: "Remera",
        rating: 5,
        authorName: "Nadine",
        title: "Fast collection and clean handoff",
        comment: "The order was packed well, ready on time, and the desk team handled pickup in under two minutes.",
        createdAt: daysAgo(2, 11, 20),
      },
      {
        id: "review-kimironko-1",
        branch: "Kimironko",
        rating: 4,
        authorName: "Eric",
        title: "Strong stock availability",
        comment: "Most staple products were available and the branch team confirmed replacements quickly when one item ran low.",
        createdAt: daysAgo(3, 16, 10),
      },
      {
        id: "review-kacyiru-1",
        branch: "Kacyiru",
        rating: 5,
        authorName: "Aline",
        title: "Smooth premium service",
        comment: "The branch felt organized, with clear messaging and a fast handover once I arrived.",
        createdAt: daysAgo(5, 9, 35),
      },
    ],
  };
}

function syncCatalog(existing: CatalogProduct[] | undefined, seeds: CatalogProduct[]) {
  const byId = new Map<number, CatalogProduct>();
  for (const product of existing ?? []) {
    byId.set(product.id, product);
  }

  for (const seed of seeds) {
    if (!byId.has(seed.id)) {
      byId.set(seed.id, seed);
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeInventory(
  inventory: Partial<Record<BranchName, BranchInventoryRow[]>> | undefined,
  catalog: CatalogProduct[],
) {
  const seeded = buildInventory(catalog);
  return Object.fromEntries(
    PICKUP_BRANCHES.map((branch) => {
      const existingRows = inventory?.[branch] ?? [];
      const rowMap = new Map(existingRows.map((row) => [row.productId, row]));
      return [
        branch,
        catalog.map((product) => ({
          productId: product.id,
          stock: Math.max(0, Math.round(rowMap.get(product.id)?.stock ?? seeded[branch].find((seed) => seed.productId === product.id)?.stock ?? 0)),
          updatedAt: rowMap.get(product.id)?.updatedAt ?? nowIso(),
        })),
      ];
    }),
  ) as Record<BranchName, BranchInventoryRow[]>;
}

function normalizeStorefront(
  storefront: Partial<Record<BranchName, BranchStorefrontRow[]>> | undefined,
  catalog: CatalogProduct[],
  inventory: Record<BranchName, BranchInventoryRow[]>,
) {
  const seeded = createInitialStorefront(catalog, inventory);
  return Object.fromEntries(
    PICKUP_BRANCHES.map((branch) => {
      const existingRows = storefront?.[branch] ?? [];
      const rowMap = new Map(existingRows.map((row) => [row.productId, row]));
      return [
        branch,
        catalog.map((product) => ({
          branch,
          productId: product.id,
          isVisible: rowMap.get(product.id)?.isVisible ?? seeded[branch].find((seed) => seed.productId === product.id)?.isVisible ?? false,
          updatedAt: rowMap.get(product.id)?.updatedAt ?? nowIso(),
        })),
      ];
    }),
  ) as Record<BranchName, BranchStorefrontRow[]>;
}

function normalizeBranches(branches: BranchProfile[] | undefined) {
  const branchMap = new Map((branches ?? []).map((branch) => [branch.name, branch]));
  return DEFAULT_BRANCH_PROFILES.map((seed) => ({
    ...seed,
    ...branchMap.get(seed.name),
  }));
}

function normalizeState(state: Partial<DemoState>): DemoState {
  const initial = createInitialState();
  const catalog = syncCatalog(state.catalog, initial.catalog);
  const inventory = normalizeInventory(state.inventory, catalog);
  const storefront = normalizeStorefront(state.storefront, catalog, inventory);

  return {
    users: state.users ?? initial.users,
    catalog,
    branches: normalizeBranches(state.branches),
    inventory,
    storefront,
    orders: state.orders ?? initial.orders,
    reviews: state.reviews ?? initial.reviews,
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
  const next = normalizeState(mutator(readState()));
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

function findCatalogProduct(productId: number, state = readState()) {
  return state.catalog.find((product) => product.id === productId);
}

function getStockRow(branch: BranchName, productId: number, state = readState()) {
  return state.inventory[branch]?.find((row) => row.productId === productId);
}

function getDeliveryFee(fulfillmentMethod: FulfillmentMethod, subtotal: number) {
  if (fulfillmentMethod === "pickup") return 0;
  return subtotal >= 30000 ? 1000 : 1500;
}

function getServiceFee(subtotal: number) {
  return subtotal >= 20000 ? 0 : 500;
}

function cleanStoredCart(productId: number) {
  if (!canUseDomStorage()) return;
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return;
    const items = JSON.parse(raw) as Array<{ product: { id: number }; qty: number }>;
    const nextItems = items.filter((item) => item.product.id !== productId);
    localStorage.setItem(CART_KEY, JSON.stringify(nextItems));
  } catch {
    // Ignore invalid cart payloads.
  }
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

export function getCatalogProducts() {
  return [...readState().catalog].sort((a, b) => {
    if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
    return a.name.localeCompare(b.name);
  });
}

export function getCatalogProduct(productId: number) {
  return findCatalogProduct(productId);
}

export function createCatalogProduct(input: {
  name: string;
  price: number;
  category: string;
  unit: string;
  image?: string;
  brand?: string;
  description?: string;
  featured?: boolean;
}) {
  const name = input.name.trim();
  const category = input.category.trim();
  const unit = input.unit.trim() || "Pcs";
  const brand = input.brand?.trim() || guessBrand(name);
  const description = input.description?.trim() || `Freshly listed by Simba for Kigali customers.`;
  const price = Math.max(0, Math.round(input.price));

  if (!name || !category || !unit || !price) {
    return { ok: false as const, error: "dashboard.productInvalid" };
  }

  const state = readState();
  const nextId = Math.max(...state.catalog.map((product) => product.id), 100000) + 1;
  const product: CatalogProduct = {
    id: nextId,
    name,
    price,
    category,
    subcategoryId: state.catalog.at(-1)?.subcategoryId ?? 9999,
    inStock: true,
    image:
      input.image?.trim() ||
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    unit,
    brand,
    description,
    tags: createProductTags({ id: nextId, name, price, category, subcategoryId: 9999, inStock: true, image: input.image?.trim() || "", unit }),
    featured: Boolean(input.featured),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  saveState((current) => ({
    ...current,
    catalog: [...current.catalog, product],
    inventory: Object.fromEntries(
      PICKUP_BRANCHES.map((branch) => [
        branch,
        [
          ...current.inventory[branch],
          {
            productId: product.id,
            stock: 0,
            updatedAt: nowIso(),
          },
        ],
      ]),
    ) as Record<BranchName, BranchInventoryRow[]>,
    storefront: Object.fromEntries(
      PICKUP_BRANCHES.map((branch) => [
        branch,
        [
          ...current.storefront[branch],
          {
            branch,
            productId: product.id,
            isVisible: false,
            updatedAt: nowIso(),
          },
        ],
      ]),
    ) as Record<BranchName, BranchStorefrontRow[]>,
  }));

  return { ok: true as const, product };
}

export function updateCatalogProduct(
  productId: number,
  input: Partial<Pick<CatalogProduct, "name" | "price" | "category" | "unit" | "image" | "brand" | "description" | "featured">>,
) {
  const existing = findCatalogProduct(productId);
  if (!existing) {
    return { ok: false as const, error: "dashboard.productNotFound" };
  }

  const nextProduct: CatalogProduct = {
    ...existing,
    ...input,
    name: input.name?.trim() || existing.name,
    category: input.category?.trim() || existing.category,
    unit: input.unit?.trim() || existing.unit,
    brand: input.brand?.trim() || existing.brand,
    description: input.description?.trim() || existing.description,
    price: input.price === undefined ? existing.price : Math.max(0, Math.round(input.price)),
    updatedAt: nowIso(),
  };

  saveState((current) => ({
    ...current,
    catalog: current.catalog.map((product) => (product.id === productId ? nextProduct : product)),
  }));

  return { ok: true as const, product: nextProduct };
}

export function deleteCatalogProduct(productId: number) {
  const existing = findCatalogProduct(productId);
  if (!existing) {
    return { ok: false as const, error: "dashboard.productNotFound" };
  }

  cleanStoredCart(productId);
  saveState((current) => ({
    ...current,
    catalog: current.catalog.filter((product) => product.id !== productId),
    inventory: Object.fromEntries(
      PICKUP_BRANCHES.map((branch) => [
        branch,
        current.inventory[branch].filter((row) => row.productId !== productId),
      ]),
    ) as Record<BranchName, BranchInventoryRow[]>,
    storefront: Object.fromEntries(
      PICKUP_BRANCHES.map((branch) => [
        branch,
        current.storefront[branch].filter((row) => row.productId !== productId),
      ]),
    ) as Record<BranchName, BranchStorefrontRow[]>,
  }));

  return { ok: true as const };
}

export function getBranchProfiles() {
  return [...readState().branches];
}

export function updateBranchProfile(
  branchName: BranchName,
  input: Partial<Omit<BranchProfile, "name">>,
) {
  saveState((current) => ({
    ...current,
    branches: current.branches.map((branch) =>
      branch.name === branchName
        ? {
            ...branch,
            ...input,
            district: input.district?.trim() || branch.district,
            neighborhood: input.neighborhood?.trim() || branch.neighborhood,
            address: input.address?.trim() || branch.address,
            phone: input.phone?.trim() || branch.phone,
            managerName: input.managerName?.trim() || branch.managerName,
            deliveryEta: input.deliveryEta?.trim() || branch.deliveryEta,
            pickupEta: input.pickupEta?.trim() || branch.pickupEta,
            coverage: input.coverage?.trim() || branch.coverage,
            openHours: input.openHours?.trim() || branch.openHours,
          }
        : branch,
    ),
  }));

  return { ok: true as const };
}

export function getBranchInventory(branch: BranchName) {
  const state = readState();
  const stockMap = new Map((state.inventory[branch] ?? []).map((row) => [row.productId, row]));
  const visibilityMap = new Map((state.storefront[branch] ?? []).map((row) => [row.productId, row.isVisible]));

  return state.catalog.map((product) => {
    const stockRow = stockMap.get(product.id);
    const isVisible = visibilityMap.get(product.id) ?? false;
    const stock = stockRow?.stock ?? 0;
    return {
      ...product,
      branch,
      stock,
      updatedAt: stockRow?.updatedAt ?? nowIso(),
      isVisible,
      isSellable: isVisible && stock > 0,
    };
  });
}

export function getBranchStock(branch: BranchName, productId: number) {
  return getStockRow(branch, productId)?.stock ?? 0;
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
    getCatalogProducts().map((product) => [product.id, getBranchSellableStock(branch, product.id)]),
  ) as Record<number, number>;
}

export function getSellableProductsForBranch(branch: BranchName) {
  return getCatalogProducts().filter((product) => getBranchSellableStock(branch, product.id) > 0);
}

export function updateBranchStock(branch: BranchName, productId: number, nextStock: number) {
  saveState((current) => ({
    ...current,
    inventory: {
      ...current.inventory,
      [branch]: current.inventory[branch].map((row) =>
        row.productId === productId
          ? {
              ...row,
              stock: Math.max(0, Math.round(nextStock)),
              updatedAt: nowIso(),
            }
          : row,
      ),
    },
  }));

  return { ok: true as const };
}

export function setBranchProductVisibility(branch: BranchName, productId: number, isVisible: boolean) {
  const stock = getBranchStock(branch, productId);
  if (isVisible && stock <= 0) {
    return { ok: false as const, error: "dashboard.publishRequiresStock" };
  }

  saveState((current) => ({
    ...current,
    storefront: {
      ...current.storefront,
      [branch]: current.storefront[branch].map((row) =>
        row.productId === productId
          ? {
              ...row,
              isVisible,
              updatedAt: nowIso(),
            }
          : row,
      ),
    },
  }));

  return { ok: true as const };
}

export function getAdminBranchCatalog(branch: BranchName) {
  return getBranchInventory(branch);
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
  fulfillmentMethod?: FulfillmentMethod;
  deliveryWindow?: string;
  pickupDate?: string;
  pickupSlot?: string;
  paymentMethod: PaymentMethod;
  paymentPhone?: string;
  customerPhone: string;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
  deliveryAddress?: DeliveryAddress;
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
      const product = findCatalogProduct(item.productId, state);
      return {
        ok: false as const,
        error: "checkout.stockChanged",
        productName: product?.name ?? "Product",
      };
    }
  }

  const items = sanitizedItems.map((item) => {
    const product = findCatalogProduct(item.productId, state);
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
  const fulfillmentMethod = input.fulfillmentMethod ?? (input.deliveryAddress ? "delivery" : "pickup");
  const deliveryFee = getDeliveryFee(fulfillmentMethod, subtotal);
  const serviceFee = getServiceFee(subtotal);
  const order: OrderRecord = {
    id: `SBA-${Date.now().toString().slice(-6)}`,
    branch: input.branch,
    fulfillmentMethod,
    deliveryWindow:
      fulfillmentMethod === "delivery"
        ? input.deliveryWindow?.trim() || "Today, 18:00 - 20:00"
        : "Collection within 25 min",
    pickupDate: fulfillmentMethod === "pickup" ? input.pickupDate : undefined,
    pickupSlot: fulfillmentMethod === "pickup" ? input.pickupSlot : undefined,
    paymentMethod: input.paymentMethod,
    paymentPhone: input.paymentPhone?.trim(),
    notes: input.notes?.trim(),
    customerId: input.user.id,
    customerName: input.customerName?.trim() || input.user.name,
    customerEmail: input.customerEmail?.trim() || input.user.email,
    customerPhone: normalizePhone(input.customerPhone),
    items,
    subtotal,
    deliveryFee,
    serviceFee,
    total: subtotal + deliveryFee + serviceFee,
    status: "pending",
    deliveryAddress: input.deliveryAddress,
    assignedTo: fulfillmentMethod === "delivery" ? "Dispatch queue" : "Collection desk",
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
  return readState()
    .orders.filter((order) => order.customerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrdersForBranches(branches: BranchName[]) {
  const branchSet = new Set(branches);
  return readState()
    .orders.filter((order) => branchSet.has(order.branch))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

export function updateOrderAssignment(orderId: string, nextBranch: BranchName, assignedTo?: string) {
  const state = readState();
  const order = state.orders.find((current) => current.id === orderId);
  if (!order) {
    return { ok: false as const, error: "dashboard.orderNotFound" };
  }

  if (order.branch === nextBranch) {
    saveState((current) => ({
      ...current,
      orders: current.orders.map((currentOrder) =>
        currentOrder.id === orderId
          ? { ...currentOrder, assignedTo: assignedTo?.trim() || currentOrder.assignedTo }
          : currentOrder,
      ),
    }));
    return { ok: true as const };
  }

  const nextInventory = state.inventory[nextBranch] ?? [];
  const nextInventoryMap = new Map(nextInventory.map((row) => [row.productId, row.stock]));
  for (const item of order.items) {
    if ((nextInventoryMap.get(item.productId) ?? 0) < item.quantity) {
      return { ok: false as const, error: "dashboard.reassignNoStock" };
    }
  }

  saveState((current) => ({
    ...current,
    orders: current.orders.map((currentOrder) =>
      currentOrder.id === orderId
        ? {
            ...currentOrder,
            branch: nextBranch,
            assignedTo: assignedTo?.trim() || currentOrder.assignedTo,
          }
        : currentOrder,
    ),
    inventory: {
      ...current.inventory,
      [order.branch]: current.inventory[order.branch].map((row) => {
        const line = order.items.find((item) => item.productId === row.productId);
        if (!line) return row;
        return {
          ...row,
          stock: row.stock + line.quantity,
          updatedAt: nowIso(),
        };
      }),
      [nextBranch]: current.inventory[nextBranch].map((row) => {
        const line = order.items.find((item) => item.productId === row.productId);
        if (!line) return row;
        return {
          ...row,
          stock: Math.max(0, row.stock - line.quantity),
          updatedAt: nowIso(),
        };
      }),
    },
  }));

  return { ok: true as const };
}

export function getLowStockProducts(branches: BranchName[]) {
  const branchSet = new Set(branches);
  return readState()
    .branches.filter((branch) => branchSet.has(branch.name))
    .flatMap((branch) =>
      getBranchInventory(branch.name)
        .filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD)
        .map((product) => ({
          branch: branch.name,
          productId: product.id,
          name: product.name,
          stock: product.stock,
          price: product.price,
          updatedAt: product.updatedAt,
        })),
    )
    .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name));
}

export function getDashboardSummary(branches: BranchName[]) {
  const orders = getOrdersForBranches(branches);
  const branchSet = new Set(branches);
  const state = readState();
  const inventory = state.branches
    .filter((branch) => branchSet.has(branch.name))
    .flatMap((branch) => getBranchInventory(branch.name));
  const today = new Date().toISOString().slice(0, 10);

  return {
    totalProducts: state.catalog.length,
    lowStockCount: inventory.filter((row) => row.stock > 0 && row.stock <= LOW_STOCK_THRESHOLD).length,
    todayOrders: orders.filter((order) => order.createdAt.slice(0, 10) === today).length,
    pendingOrders: orders.filter((order) =>
      ["pending", "confirmed", "packing", "out-for-delivery", "ready-for-pickup"].includes(order.status),
    ).length,
    completedOrders: orders.filter((order) => order.status === "completed").length,
    orderCount: orders.length,
    readyCount: orders.filter((order) => order.status === "ready-for-pickup").length,
    zeroStockCount: inventory.filter((row) => row.stock === 0).length,
  };
}

function parseSearchIntent(query: string, selectedBranch: BranchName): SearchIntent {
  const lower = query.toLowerCase();
  const branch = PICKUP_BRANCHES.find((candidate) => lower.includes(candidate.toLowerCase()));
  const maxPriceMatch = lower.match(/(?:under|below|less than)\s*(\d[\d,]*)/i);
  const minPriceMatch = lower.match(/(?:above|over|from)\s*(\d[\d,]*)/i);
  const maxPrice = maxPriceMatch ? Number(maxPriceMatch[1].replace(/,/g, "")) : undefined;
  const minPrice = minPriceMatch ? Number(minPriceMatch[1].replace(/,/g, "")) : undefined;
  const category = CATEGORY_KEYWORDS.find(({ words }) => words.some((word) => lower.includes(word)))?.category;

  const terms = lower
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term && !STOP_WORDS.has(term));

  return {
    branch: branch ?? selectedBranch,
    maxPrice,
    minPrice,
    inStockOnly:
      lower.includes("in stock") ||
      lower.includes("available") ||
      lower.includes("delivery today") ||
      lower.includes("pickup today") ||
      lower.includes("ready now"),
    category,
    searchTerms: terms,
  };
}

function scoreProduct(product: CatalogProduct, terms: string[]) {
  const haystack = `${product.name} ${product.category} ${product.description} ${product.brand} ${product.tags.join(" ")}`.toLowerCase();
  return terms.reduce((score, term) => {
    if (product.name.toLowerCase().includes(term)) return score + 7;
    if (product.brand.toLowerCase().includes(term)) return score + 4;
    if (haystack.includes(term)) return score + 2;
    return score;
  }, 0);
}

export function conversationalSearch(query: string, selectedBranch: BranchName): ConversationalSearchResult {
  const intent = parseSearchIntent(query, selectedBranch);
  const branch = intent.branch ?? selectedBranch;
  const products = getSellableProductsForBranch(branch);
  const stockMap = new Map(getBranchInventory(branch).map((product) => [product.id, product.stock]));

  let filtered = products.filter((product) => {
    if (intent.category && product.category !== intent.category) return false;
    if (intent.maxPrice !== undefined && product.price > intent.maxPrice) return false;
    if (intent.minPrice !== undefined && product.price < intent.minPrice) return false;
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

      if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
      return a.price - b.price;
    })
    .slice(0, 60);

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
