import {
  addBranchReview as addLocalReview,
  createPickupOrder as createLocalOrder,
  getBranchInventory as getLocalBranchInventory,
  getBranchReviewSummary as getLocalBranchReviewSummary,
  getBranchReviews as getLocalBranchReviews,
  getBranchStock as getLocalBranchStock,
  getDashboardSummary as getLocalDashboardSummary,
  getOrdersForBranches as getLocalOrdersForBranches,
  getOrdersForUser as getLocalOrdersForUser,
  updateBranchStock as updateLocalBranchStock,
  updateOrderStatus as updateLocalOrderStatus,
  type BranchName,
  type BranchReview,
  type OrderRecord,
  type OrderStatus,
  type PaymentMethod,
  type SessionUser,
} from "@/lib/demo-store";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { PRODUCTS } from "@/lib/products";

type BranchInventoryProduct = (typeof PRODUCTS)[number] & {
  branch: BranchName;
  stock: number;
  updatedAt: string;
};

async function requireSupabase() {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase client not configured");
  }
  return supabase;
}

function asBranchName(value: string): BranchName {
  return value as BranchName;
}

function productName(productId: number) {
  return PRODUCTS.find((product) => product.id === productId)?.name ?? `Product ${productId}`;
}

export async function getProfile(userId: string) {
  if (!hasSupabaseConfig()) return null;

  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, phone, role, assigned_branches")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertProfile(input: {
  userId: string;
  fullName: string;
  phone: string;
  role?: "customer" | "manager" | "staff";
  assignedBranches?: BranchName[];
}) {
  if (!hasSupabaseConfig()) return null;

  const supabase = await requireSupabase();
  const { error } = await supabase.from("profiles").upsert({
    user_id: input.userId,
    full_name: input.fullName,
    phone: input.phone,
    role: input.role ?? "customer",
    assigned_branches: input.assignedBranches ?? [],
  });

  if (error) throw error;
  return true;
}

export async function getBranchStock(branch: BranchName, productId: number) {
  if (!hasSupabaseConfig()) {
    return getLocalBranchStock(branch, productId);
  }

  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("branch_inventory")
    .select("stock")
    .eq("branch_name", branch)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw error;
  return data?.stock ?? 0;
}

export async function getBranchStockMap(branch: BranchName) {
  if (!hasSupabaseConfig()) {
    return Object.fromEntries(PRODUCTS.map((product) => [product.id, getLocalBranchStock(branch, product.id)]));
  }

  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("branch_inventory")
    .select("product_id, stock")
    .eq("branch_name", branch);

  if (error) throw error;

  const map = Object.fromEntries(PRODUCTS.map((product) => [product.id, 0]));
  for (const row of data ?? []) {
    map[row.product_id] = row.stock ?? 0;
  }

  return map as Record<number, number>;
}

export async function getBranchStockMaps(branches: BranchName[]) {
  const maps = Object.fromEntries(
    branches.map((branch) => [branch, Object.fromEntries(PRODUCTS.map((product) => [product.id, 0]))]),
  ) as Record<BranchName, Record<number, number>>;

  if (!branches.length) {
    return maps;
  }

  if (!hasSupabaseConfig()) {
    for (const branch of branches) {
      maps[branch] = Object.fromEntries(PRODUCTS.map((product) => [product.id, getLocalBranchStock(branch, product.id)]));
    }
    return maps;
  }

  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("branch_inventory")
    .select("branch_name, product_id, stock")
    .in("branch_name", branches);

  if (error) throw error;

  for (const row of data ?? []) {
    const branch = asBranchName(row.branch_name);
    if (maps[branch]) {
      maps[branch][row.product_id] = row.stock ?? 0;
    }
  }

  return maps;
}

export async function getBranchInventory(branch: BranchName): Promise<BranchInventoryProduct[]> {
  if (!hasSupabaseConfig()) {
    return getLocalBranchInventory(branch);
  }

  const stockMap = await getBranchStockMap(branch);
  return PRODUCTS.map((product) => ({
    ...product,
    branch,
    stock: stockMap[product.id] ?? 0,
    updatedAt: new Date().toISOString(),
  }));
}

export async function updateBranchStock(branch: BranchName, productId: number, nextStock: number) {
  if (!hasSupabaseConfig()) {
    updateLocalBranchStock(branch, productId, nextStock);
    return { ok: true as const };
  }

  const supabase = await requireSupabase();
  const { error } = await supabase.from("branch_inventory").upsert({
    branch_name: branch,
    product_id: productId,
    stock: Math.max(0, Math.round(nextStock)),
  });

  if (error) throw error;
  return { ok: true as const };
}

export async function getBranchReviews(branch: BranchName): Promise<BranchReview[]> {
  if (!hasSupabaseConfig()) {
    return getLocalBranchReviews(branch);
  }

  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("branch_reviews")
    .select("id, branch_name, rating, author_name, title, comment, created_at")
    .eq("branch_name", branch)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((review) => ({
    id: review.id,
    branch: asBranchName(review.branch_name),
    rating: review.rating,
    authorName: review.author_name,
    title: review.title,
    comment: review.comment,
    createdAt: review.created_at,
  }));
}

export async function getBranchReviewSummary(branch: BranchName) {
  const reviews = await getBranchReviews(branch);
  if (!reviews.length) {
    return { count: 0, average: 0 };
  }

  return {
    count: reviews.length,
    average: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length,
  };
}

export async function addBranchReview(input: {
  branch: BranchName;
  authorName: string;
  authorUserId?: string;
  rating: number;
  title: string;
  comment: string;
}) {
  if (!hasSupabaseConfig()) {
    return addLocalReview(input);
  }

  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("branch_reviews")
    .insert({
      branch_name: input.branch,
      author_user_id: input.authorUserId ?? null,
      author_name: input.authorName.trim(),
      rating: Math.max(1, Math.min(5, Math.round(input.rating))),
      title: input.title.trim(),
      comment: input.comment.trim(),
    })
    .select("id, branch_name, rating, author_name, title, comment, created_at")
    .single();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return {
    ok: true as const,
    review: {
      id: data.id,
      branch: asBranchName(data.branch_name),
      rating: data.rating,
      authorName: data.author_name,
      title: data.title,
      comment: data.comment,
      createdAt: data.created_at,
    },
  };
}

export async function createPickupOrder(input: {
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
  if (!hasSupabaseConfig()) {
    return createLocalOrder(input);
  }

  const supabase = await requireSupabase();
  const sanitizedItems = input.items.filter((item) => item.quantity > 0);
  if (!sanitizedItems.length) {
    return { ok: false as const, error: "checkout.emptyCart" };
  }

  const stockMap = await getBranchStockMap(input.branch);
  for (const item of sanitizedItems) {
    const stock = stockMap[item.productId] ?? 0;
    if (stock < item.quantity) {
      return {
        ok: false as const,
        error: "checkout.stockChanged",
        productName: productName(item.productId),
      };
    }
  }

  const items = sanitizedItems.map((item) => {
    const product = PRODUCTS.find((candidate) => candidate.id === item.productId);
    if (!product) {
      throw new Error(`Missing product ${item.productId}`);
    }
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
      name: product.name,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { data: insertedOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: input.user.id,
      customer_name: input.user.name,
      customer_email: input.user.email,
      branch_name: input.branch,
      pickup_date: input.pickupDate,
      pickup_slot: input.pickupSlot,
      payment_method: input.paymentMethod,
      payment_phone: input.paymentPhone ?? null,
      customer_phone: input.customerPhone,
      notes: input.notes ?? null,
      subtotal,
      total: subtotal,
    })
    .select("id, order_number, customer_name, customer_email, branch_name, pickup_date, pickup_slot, payment_method, payment_phone, customer_phone, notes, subtotal, total, status, created_at")
    .single();

  if (orderError) {
    return { ok: false as const, error: orderError.message };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: insertedOrder.id,
      product_id: item.productId,
      product_name: item.name,
      unit_price: item.price,
      quantity: item.quantity,
      line_total: item.price * item.quantity,
    })),
  );

  if (itemsError) {
    return { ok: false as const, error: itemsError.message };
  }

  for (const item of items) {
    await updateBranchStock(input.branch, item.productId, (stockMap[item.productId] ?? 0) - item.quantity);
  }

  return {
    ok: true as const,
    order: {
      id: insertedOrder.order_number,
      branch: asBranchName(insertedOrder.branch_name),
      pickupDate: insertedOrder.pickup_date,
      pickupSlot: insertedOrder.pickup_slot,
      paymentMethod: insertedOrder.payment_method as PaymentMethod,
      paymentPhone: insertedOrder.payment_phone ?? undefined,
      notes: insertedOrder.notes ?? undefined,
      customerId: input.user.id,
      customerName: insertedOrder.customer_name,
      customerEmail: insertedOrder.customer_email,
      customerPhone: insertedOrder.customer_phone,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal: Number(insertedOrder.subtotal),
      total: Number(insertedOrder.total),
      status: insertedOrder.status as OrderStatus,
      createdAt: insertedOrder.created_at,
    },
  };
}

export async function getOrdersForBranches(branches: BranchName[]): Promise<OrderRecord[]> {
  if (!hasSupabaseConfig()) {
    return getLocalOrdersForBranches(branches);
  }

  const supabase = await requireSupabase();
  if (!branches.length) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      customer_id,
      customer_name,
      customer_email,
      branch_name,
      pickup_date,
      pickup_slot,
      payment_method,
      payment_phone,
      customer_phone,
      notes,
      subtotal,
      total,
      status,
      created_at,
      order_items (
        product_id,
        product_name,
        unit_price,
        quantity
      )
    `)
    .in("branch_name", branches)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((order) => ({
    id: order.order_number,
    branch: asBranchName(order.branch_name),
    pickupDate: order.pickup_date,
    pickupSlot: order.pickup_slot,
    paymentMethod: order.payment_method as PaymentMethod,
    paymentPhone: order.payment_phone ?? undefined,
    notes: order.notes ?? undefined,
    customerId: order.customer_id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    items: (order.order_items ?? []).map((item: any) => ({
      productId: item.product_id,
      name: item.product_name,
      price: Number(item.unit_price),
      quantity: item.quantity,
    })),
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    status: order.status as OrderStatus,
    createdAt: order.created_at,
  }));
}

export async function getOrdersForUser(user: SessionUser): Promise<OrderRecord[]> {
  if (!hasSupabaseConfig()) {
    return getLocalOrdersForUser(user);
  }

  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      customer_id,
      customer_name,
      customer_email,
      branch_name,
      pickup_date,
      pickup_slot,
      payment_method,
      payment_phone,
      customer_phone,
      notes,
      subtotal,
      total,
      status,
      created_at,
      order_items (
        product_id,
        product_name,
        unit_price,
        quantity
      )
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((order) => ({
    id: order.order_number,
    branch: asBranchName(order.branch_name),
    pickupDate: order.pickup_date,
    pickupSlot: order.pickup_slot,
    paymentMethod: order.payment_method as PaymentMethod,
    paymentPhone: order.payment_phone ?? undefined,
    notes: order.notes ?? undefined,
    customerId: order.customer_id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    items: (order.order_items ?? []).map((item: any) => ({
      productId: item.product_id,
      name: item.product_name,
      price: Number(item.unit_price),
      quantity: item.quantity,
    })),
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    status: order.status as OrderStatus,
    createdAt: order.created_at,
  }));
}

export async function updateOrderStatus(orderNumber: string, status: OrderStatus) {
  if (!hasSupabaseConfig()) {
    return updateLocalOrderStatus(orderNumber, status);
  }

  const supabase = await requireSupabase();
  const { error } = await supabase.from("orders").update({ status }).eq("order_number", orderNumber);
  if (error) throw error;
  return { ok: true as const };
}

export async function getDashboardSummary(branches: BranchName[]) {
  if (!hasSupabaseConfig()) {
    return getLocalDashboardSummary(branches);
  }

  const orders = await getOrdersForBranches(branches);
  const inventory = await Promise.all(branches.map((branch) => getBranchInventory(branch)));
  const flatInventory = inventory.flat();

  return {
    orderCount: orders.length,
    readyCount: orders.filter((order) => order.status === "ready").length,
    lowStockCount: flatInventory.filter((row) => row.stock > 0 && row.stock <= 3).length,
    zeroStockCount: flatInventory.filter((row) => row.stock === 0).length,
  };
}
