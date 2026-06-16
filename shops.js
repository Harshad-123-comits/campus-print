import { isSupabaseConfigured, requireSupabase } from "./supabase.js";

const fallbackShops = [
  {
    slug: "north-campus-print",
    name: "North Campus Print",
    location: "Library Block",
    description: "Fast document printing near the main reading hall.",
    accent: "blue",
    shopkeeper_email: "north@campusprint.com",
    is_active: true
  },
  {
    slug: "central-copy-hub",
    name: "Central Copy Hub",
    location: "Student Center",
    description: "Handles color work, assignments, and project packets.",
    accent: "gold",
    shopkeeper_email: "central@campusprint.com",
    is_active: true
  },
  {
    slug: "south-gate-prints",
    name: "South Gate Prints",
    location: "South Entrance",
    description: "Quick pickup point for last-minute print jobs.",
    accent: "emerald",
    shopkeeper_email: "south@campusprint.com",
    is_active: true
  }
];

const normalizeShop = (shop) => ({
  ...shop,
  shopkeeperEmail: shop.shopkeeperEmail || shop.shopkeeper_email || "",
  is_active: shop.is_active !== false
});

const sortShops = (shops) => [...shops].sort((a, b) => a.name.localeCompare(b.name));

const listShops = async ({ includeInactive = false } = {}) => {
  if (!isSupabaseConfigured) {
    return sortShops(fallbackShops.map(normalizeShop).filter((shop) => includeInactive || shop.is_active));
  }

  const supabase = requireSupabase();
  let query = supabase
    .from("shops")
    .select("slug, name, location, description, accent, shopkeeper_email, is_active")
    .order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading shops:", error);
    return sortShops(fallbackShops.map(normalizeShop).filter((shop) => includeInactive || shop.is_active));
  }

  return (data || []).map(normalizeShop);
};

const getShopBySlug = async (slug) => {
  if (!slug) return null;

  if (!isSupabaseConfigured) {
    return fallbackShops.map(normalizeShop).find((shop) => shop.slug === slug) || null;
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("shops")
    .select("slug, name, location, description, accent, shopkeeper_email, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Error loading shop by slug:", error);
    return fallbackShops.map(normalizeShop).find((shop) => shop.slug === slug) || null;
  }

  return data ? normalizeShop(data) : null;
};

const getManagedShopsByEmail = async (email) => {
  if (!email) return [];
  const normalizedEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    return fallbackShops
      .map(normalizeShop)
      .filter((shop) => shop.shopkeeperEmail.toLowerCase() === normalizedEmail && shop.is_active);
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("shops")
    .select("slug, name, location, description, accent, shopkeeper_email, is_active")
    .eq("shopkeeper_email", normalizedEmail)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading managed shops:", error);
    return fallbackShops
      .map(normalizeShop)
      .filter((shop) => shop.shopkeeperEmail.toLowerCase() === normalizedEmail && shop.is_active);
  }

  return (data || []).map(normalizeShop);
};

export { listShops, getShopBySlug, getManagedShopsByEmail, fallbackShops };
