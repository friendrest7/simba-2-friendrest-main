import data from "@/data/simba_products.json";
import { CURRENCY_RATES, getCurrentCurrency } from "@/lib/currency";
import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Baby,
  Dumbbell,
  Droplets,
  Package,
  PawPrint,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
  Wine,
} from "lucide-react";

export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  subcategoryId: number;
  inStock: boolean;
  image: string;
  unit: string;
};

export const STORE = data.store as {
  name: string;
  tagline: string;
  location: string;
  currency: string;
};

export const PRODUCTS: Product[] = data.products as Product[];

const CATEGORY_META: Record<string, { slug: string; emoji: string; color: string; icon: LucideIcon }> =
  {
    "Alcoholic Drinks": {
      slug: "alcoholic-drinks",
      emoji: "🍷",
      color: "oklch(0.55 0.22 15)",
      icon: Wine,
    },
    "Cosmetics & Personal Care": {
      slug: "cosmetics",
      emoji: "💄",
      color: "oklch(0.7 0.18 350)",
      icon: Sparkles,
    },
    General: {
      slug: "general",
      emoji: "🛒",
      color: "oklch(0.6 0.18 250)",
      icon: ShoppingBasket,
    },
    "Food Products": { slug: "food", emoji: "🍎", color: "oklch(0.65 0.2 60)", icon: Apple },
    "Kitchenware & Electronics": {
      slug: "kitchenware",
      emoji: "🍳",
      color: "oklch(0.6 0.18 200)",
      icon: UtensilsCrossed,
    },
    "Cleaning & Sanitary": {
      slug: "cleaning",
      emoji: "🧴",
      color: "oklch(0.65 0.18 180)",
      icon: Droplets,
    },
    "Baby Products": { slug: "baby", emoji: "🧸", color: "oklch(0.7 0.18 30)", icon: Baby },
    "Pet Care": { slug: "pet", emoji: "🐾", color: "oklch(0.6 0.18 100)", icon: PawPrint },
    "Kitchen Storage": {
      slug: "storage",
      emoji: "📦",
      color: "oklch(0.55 0.15 270)",
      icon: Package,
    },
    "Sports & Wellness": {
      slug: "sports",
      emoji: "⚽",
      color: "oklch(0.6 0.2 140)",
      icon: Dumbbell,
    },
  };

export type CategoryInfo = {
  name: string;
  slug: string;
  emoji: string;
  color: string;
  icon: LucideIcon;
  count: number;
};

export type PriceCategoryInfo = {
  id: string;
  labelKey: string;
  hintKey: string;
  minPrice?: number;
  maxPrice?: number;
};

export const CATEGORIES: CategoryInfo[] = Object.entries(
  PRODUCTS.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {}),
).map(([name, count]) => ({
  name,
  count,
  slug: CATEGORY_META[name]?.slug ?? name.toLowerCase().replace(/\s+/g, "-"),
  emoji: CATEGORY_META[name]?.emoji ?? "🛍️",
  color: CATEGORY_META[name]?.color ?? "oklch(0.5 0.2 295)",
  icon: CATEGORY_META[name]?.icon ?? ShoppingBasket,
}));

export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

export const productsByCategorySlug = (slug: string) => {
  const cat = categoryBySlug(slug);
  if (!cat) return [];
  return PRODUCTS.filter((p) => p.category === cat.name);
};

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  "Alcoholic Drinks": "category.alcoholicDrinks",
  "Cosmetics & Personal Care": "category.cosmetics",
  General: "category.general",
  "Food Products": "category.food",
  "Kitchenware & Electronics": "category.kitchenware",
  "Cleaning & Sanitary": "category.cleaning",
  "Baby Products": "category.baby",
  "Pet Care": "category.pet",
  "Kitchen Storage": "category.storage",
  "Sports & Wellness": "category.sports",
};

export const categoryLabel = (name: string, t: (key: string) => string) =>
  t(CATEGORY_LABEL_KEYS[name] ?? name);

export const PRICE_CATEGORIES: PriceCategoryInfo[] = [
  { id: "all", labelKey: "budget.all", hintKey: "budget.allHint" },
  { id: "cheap", labelKey: "budget.cheap", hintKey: "budget.cheapHint", maxPrice: 3000 },
  { id: "budget", labelKey: "budget.budget", hintKey: "budget.budgetHint", maxPrice: 5000 },
  { id: "value", labelKey: "budget.value", hintKey: "budget.valueHint", maxPrice: 10000 },
  { id: "premium", labelKey: "budget.premium", hintKey: "budget.premiumHint", minPrice: 10000 },
];

export const findPriceCategory = (id?: string) =>
  PRICE_CATEGORIES.find((category) => category.id === id) ?? PRICE_CATEGORIES[0];

export const matchesPriceCategory = (price: number, priceCategoryId?: string) => {
  const category = findPriceCategory(priceCategoryId);
  if (category.minPrice !== undefined && price < category.minPrice) return false;
  if (category.maxPrice !== undefined && price > category.maxPrice) return false;
  return true;
};

export const productById = (id: number) => PRODUCTS.find((p) => p.id === id);

export const productDescription = (product: Product, t?: (key: string) => string) => {
  const fallback =
    "Selected from the Simba Supermarket catalog for fast ordering, reliable pricing, and easy delivery tracking.";
  const intro = t ? t("product.descriptionTemplate") : fallback;
  return `${intro} ${product.name} comes in ${product.unit.toLowerCase()} packaging under ${product.category.toLowerCase()}.`;
};

export const formatRWF = (n: number) => {
  const currency = getCurrentCurrency();
  const converted = n * CURRENCY_RATES[currency];
  const locale =
    currency === "USD" ? "en-US" : currency === "EUR" ? "fr-FR" : currency === "GBP" ? "en-GB" : "en-RW";
  const maximumFractionDigits = currency === "RWF" ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(converted);
};

export const searchProducts = (q: string) => {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.unit.toLowerCase().includes(term) ||
      productDescription(p).toLowerCase().includes(term),
  ).slice(0, 50);
};
