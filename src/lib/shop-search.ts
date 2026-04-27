export type ShopSearchParams = {
  q?: string;
  cat?: string;
  sort?: string;
  inStock?: string;
  min?: number;
  max?: number;
};

export const validateShopSearch = (search: Record<string, unknown>): ShopSearchParams => ({
  q: typeof search.q === "string" ? search.q : undefined,
  cat: typeof search.cat === "string" ? search.cat : undefined,
  sort: typeof search.sort === "string" ? search.sort : undefined,
  inStock: typeof search.inStock === "string" ? search.inStock : undefined,
  min:
    typeof search.min === "number"
      ? search.min
      : typeof search.min === "string" && !Number.isNaN(Number(search.min))
        ? Number(search.min)
        : undefined,
  max:
    typeof search.max === "number"
      ? search.max
      : typeof search.max === "string" && !Number.isNaN(Number(search.max))
        ? Number(search.max)
        : undefined,
});
