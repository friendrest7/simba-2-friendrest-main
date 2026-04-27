import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/Storefront";
import { validateShopSearch } from "@/lib/shop-search";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
  validateSearch: validateShopSearch,
  head: () => ({
    meta: [
      { title: "Shop - Simba Supermarket" },
      { name: "description", content: "Browse and checkout groceries from Simba Supermarket." },
    ],
  }),
});

function ShopPage() {
  return <Storefront search={Route.useSearch()} basePath="/shop" titleKey="nav.shop" />;
}
