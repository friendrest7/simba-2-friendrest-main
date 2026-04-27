import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/Storefront";
import { validateShopSearch } from "@/lib/shop-search";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  validateSearch: validateShopSearch,
  head: () => ({
    meta: [
      { title: "All Products - Simba Supermarket" },
      {
        name: "description",
        content: "Search, filter, and order products from Simba Supermarket.",
      },
    ],
  }),
});

function ProductsPage() {
  return (
    <Storefront search={Route.useSearch()} basePath="/products" titleKey="section.allProducts" />
  );
}
