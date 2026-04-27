import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
loadEnvFile(join(root, ".env.local"));
loadEnvFile(join(root, ".env"));

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Add them to .env.local, then run npm run backend:seed again.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const productData = JSON.parse(
  readFileSync(join(root, "src", "data", "simba_products.json"), "utf8"),
);
const products = productData.products.map((product) => ({
  id: product.id,
  name: product.name,
  price: product.price,
  category: product.category,
  subcategory_id: product.subcategoryId,
  in_stock: product.inStock,
  image: product.image,
  unit: product.unit,
}));

const branches = [
  "Remera",
  "Kimironko",
  "Kacyiru",
  "Nyamirambo",
  "Gikondo",
  "Kanombe",
  "Kinyinya",
  "Kibagabaga",
  "Nyanza",
];

const reviews = [
  {
    branch_name: "Remera",
    author_name: "Nadine",
    rating: 5,
    title: "Pickup was ready on time",
    comment: "Clear handoff, good packing, and the branch confirmed my order quickly.",
    created_at: "2026-04-15T08:00:00.000Z",
  },
  {
    branch_name: "Kimironko",
    author_name: "Eric",
    rating: 4,
    title: "Strong grocery availability",
    comment: "Most staples were in stock and the staff moved the order to ready status fast.",
    created_at: "2026-04-18T10:30:00.000Z",
  },
  {
    branch_name: "Kacyiru",
    author_name: "Aline",
    rating: 5,
    title: "Best branch for quick collection",
    comment: "Helpful team and no waiting once I arrived for pickup.",
    created_at: "2026-04-19T12:45:00.000Z",
  },
];

await upsertInChunks("products", products, { onConflict: "id" });
await upsertInChunks(
  "branches",
  branches.map((name) => ({ name })),
  { onConflict: "name" },
);
await upsertInChunks(
  "branch_inventory",
  branches.flatMap((branch, branchIndex) =>
    productData.products.map((product) => ({
      branch_name: branch,
      product_id: product.id,
      stock: seededStock(product.id, branchIndex, product.inStock),
    })),
  ),
  { onConflict: "branch_name,product_id" },
);

const { error: reviewError } = await supabase.from("branch_reviews").insert(reviews);
if (reviewError && !reviewError.message.includes("duplicate")) {
  throw reviewError;
}

console.log(`Seeded ${products.length} products across ${branches.length} branches.`);

async function upsertInChunks(table, rows, options) {
  const size = 500;
  for (let start = 0; start < rows.length; start += size) {
    const chunk = rows.slice(start, start + size);
    const { error } = await supabase.from(table).upsert(chunk, options);
    if (error) {
      throw error;
    }
  }
}

function seededStock(productId, branchIndex, available) {
  if (!available) return 0;

  const seed = ((productId % 97) + 1) * (branchIndex + 3);
  if (seed % 11 === 0) return 0;
  if (seed % 5 === 0) return 2;
  return 4 + (seed % 18);
}

function loadEnvFile(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}
