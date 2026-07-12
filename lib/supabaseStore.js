const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const path = require("path");
const fsSync = require("fs");
const fs = require("fs/promises");

const seedData = require("../data/mysqlSeed");

const DEFAULT_PHOTO = "/assets/gigconnect.logo.png";

const DATA_CHAT_FILE = path.join(__dirname, "../data/chatMessages.json");
const DATA_DISPUTES_FILE = path.join(__dirname, "../data/disputes.json");
const DATA_COUPONS_FILE = path.join(__dirname, "../data/coupons.json");
const DATA_CMS_FILE = path.join(__dirname, "../data/cmsSettings.json");
const DATA_SERVICES_FILE = path.join(__dirname, "../data/services.json");
const DATA_PARTNERS_FILE = path.join(__dirname, "../data/partners.json");
const DATA_WALLETS_FILE = path.join(__dirname, "../data/wallet_balances.json");
const DATA_EARNINGS_FILE = path.join(__dirname, "../data/earnings.json");
const DATA_WITHDRAWALS_FILE = path.join(__dirname, "../data/withdrawals.json");
const DATA_WORK_REQUIREMENTS_FILE = path.join(__dirname, "../data/work_requirements.json");
const DATA_PROFESSIONALS_FILE = path.join(__dirname, "../data/professionals.json");
const DATA_CLIENTS_FILE = path.join(__dirname, "../data/clients.json");
const DATA_BOOKINGS_FILE = path.join(__dirname, "../data/bookings.json");

// Ensure data files exist
[
  DATA_CHAT_FILE, DATA_DISPUTES_FILE, DATA_COUPONS_FILE, DATA_CMS_FILE, DATA_SERVICES_FILE,
  DATA_PARTNERS_FILE, DATA_WALLETS_FILE, DATA_EARNINGS_FILE, DATA_WITHDRAWALS_FILE, DATA_WORK_REQUIREMENTS_FILE,
  DATA_PROFESSIONALS_FILE, DATA_CLIENTS_FILE, DATA_BOOKINGS_FILE
].forEach(file => {
  if (!fsSync.existsSync(file)) {
    if (!fsSync.existsSync(path.dirname(file))) {
      fsSync.mkdirSync(path.dirname(file), { recursive: true });
    }
    const defaultData = file === DATA_CMS_FILE ? { announcementBanner: "Welcome to GigConnect - India's Verified Manpower & Service Portal!", announcementActive: true } : [];
    fsSync.writeFileSync(file, JSON.stringify(defaultData, null, 2), "utf8");
  }
});

try {
  global.cmsSettingsCache = JSON.parse(fsSync.readFileSync(DATA_CMS_FILE, "utf8"));
} catch (e) {
  global.cmsSettingsCache = { announcementBanner: "Welcome to GigConnect - India's Verified Manpower & Service Portal!", announcementActive: true };
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
}

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    null
  );
}

const dbState = {
  connected: false,
  ready: false,
  lastError: null,
  projectUrl: getSupabaseUrl()
};

let supabase = null;
let supabaseAuth = null;

function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || null;
}

function getClient() {
  if (!supabase) {
    throw new Error("Supabase client is not initialized.");
  }

  return supabase;
}

function getAuthClient() {
  if (!supabaseAuth) {
    throw new Error("Supabase auth client is not initialized.");
  }

  return supabaseAuth;
}

function throwOnError(error, fallbackMessage = "Supabase request failed.") {
  if (!error) return;

  const wrapped = new Error(error.message || fallbackMessage);
  wrapped.code = error.code;
  throw wrapped;
}

function parseSkills(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLimit(limit, fallback = 10) {
  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseProfessionalMetadata(bio, fallbackHourlyRate, fallbackStartingPrice) {
  let cleanBio = bio === "Registered with Google OAuth" ? "" : (bio || "");
  let workModes = ["Part Time", "Full Time"];
  let partTimeRate = Number(fallbackHourlyRate || fallbackStartingPrice || 500);
  let fullTimeRate = 25000;

  if (!cleanBio) {
    return { cleanBio: "", workModes, partTimeRate, fullTimeRate };
  }

  const wmMatch = cleanBio.match(/\[workModes?:([^\]]+)\]/i) || cleanBio.match(/\[Work Type:([^\]]+)\]/i);
  if (wmMatch) {
    const val = wmMatch[1].trim();
    if (val.toLowerCase().includes("both") || (val.toLowerCase().includes("part") && val.toLowerCase().includes("full"))) {
      workModes = ["Part Time", "Full Time"];
    } else if (val.toLowerCase().includes("part")) {
      workModes = ["Part Time"];
    } else if (val.toLowerCase().includes("full")) {
      workModes = ["Full Time"];
    }
  }

  const ptMatch = cleanBio.match(/\[partTimeRate:(\d+)\]/i);
  if (ptMatch) {
    partTimeRate = Number(ptMatch[1]) || partTimeRate;
  }

  const ftMatch = cleanBio.match(/\[fullTimeRate:(\d+)\]/i);
  if (ftMatch) {
    fullTimeRate = Number(ftMatch[1]) || fullTimeRate;
  }

  let pincode = "";
  const pinMatch = cleanBio.match(/\[pincode:([^\]]+)\]/i);
  if (pinMatch) {
    pincode = pinMatch[1].trim();
  }

  let aadhaarPanUrl = "";
  const panMatch = cleanBio.match(/\[aadhaarPanUrl:([^\]]+)\]/i);
  if (panMatch) {
    aadhaarPanUrl = panMatch[1].trim();
  }

  let livePhotoUrl = "";
  const liveMatch = cleanBio.match(/\[livePhotoUrl:([^\]]+)\]/i);
  if (liveMatch) {
    livePhotoUrl = liveMatch[1].trim();
  }

  let customRates = {};
  const ratesMatch = cleanBio.match(/\[customRates:([^\]]+)\]/i);
  if (ratesMatch) {
    try { customRates = JSON.parse(ratesMatch[1]); } catch(e) {}
  }

  let subcategorySkills = [];
  const subMatch = cleanBio.match(/\[subcategories:([^\]]+)\]/i);
  if (subMatch) {
    try { subcategorySkills = JSON.parse(subMatch[1]); } catch(e) {}
  }
  const subskillsMatch = cleanBio.match(/\[subskills:([^\]]+)\]/i);
  if (subskillsMatch && (!subcategorySkills || !subcategorySkills.length)) {
    try {
      if (subskillsMatch[1].trim().startsWith("[")) {
        subcategorySkills = JSON.parse(subskillsMatch[1]);
      } else {
        subcategorySkills = subskillsMatch[1].split(",").map(s => s.trim()).filter(Boolean);
      }
    } catch(e) {}
  }

  cleanBio = cleanBio
    .replace(/\[workModes?:[^\]]+\]/gi, "")
    .replace(/\[Work Type:[^\]]+\]/gi, "")
    .replace(/\[partTimeRate:[^\]]+\]/gi, "")
    .replace(/\[fullTimeRate:[^\]]+\]/gi, "")
    .replace(/\[Price Negotiable[^\]]+\]/gi, "")
    .replace(/\[Skills:[^\]]+\]/gi, "")
    .replace(/\[pincode:[^\]]+\]/gi, "")
    .replace(/\[aadhaarPanUrl:[^\]]+\]/gi, "")
    .replace(/\[livePhotoUrl:[^\]]+\]/gi, "")
    .replace(/\[customRates:[^\]]+\]/gi, "")
    .replace(/\[subcategories:[^\]]+\]/gi, "")
    .replace(/\[subskills:[^\]]+\]/gi, "")
    .trim();

  return { cleanBio, workModes, partTimeRate, fullTimeRate, pincode, aadhaarPanUrl, livePhotoUrl, customRates, subcategorySkills };
}

function normalizeProfessionalRow(row = {}) {
  const phoneVal = (row.phone || "").startsWith("G_") ? "" : (row.phone || "");
  const descVal = row.description === "Registered with Google OAuth" ? "" : (row.description || "");
  const meta = parseProfessionalMetadata(descVal, row.hourlyRateInr, row.startingPriceInr);
  const finalSkills = (meta.subcategorySkills && meta.subcategorySkills.length > 0) ? meta.subcategorySkills : parseSkills(row.skills);
  return {
    id: Number(row.id),
    _id: String(row.id),
    name: row.name,
    ratings: Number(row.ratings || 0),
    experience: Number(row.experience || 0),
    distance: Number(row.distance || 0),
    photo: row.photo || DEFAULT_PHOTO,
    contact: phoneVal || row.contact || row.email || "",
    email: row.email || "",
    phone: phoneVal,
    city: row.city || "",
    area: row.area || "",
    pincode: row.pincode || meta.pincode || "",
    aadhaarPanUrl: row.aadhaarPanUrl || row.aadhaar_pan_url || meta.aadhaarPanUrl || "",
    livePhotoUrl: row.livePhotoUrl || row.live_photo_url || meta.livePhotoUrl || "",
    customRates: meta.customRates || {},
    subcategorySkills: finalSkills,
    skills: finalSkills,
    description: meta.cleanBio,
    workModes: meta.workModes,
    partTimeRate: meta.partTimeRate,
    fullTimeRate: meta.fullTimeRate,
    isVerified: Boolean(row.isVerified),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    startingPrice: Number(row.startingPriceInr || meta.partTimeRate || 0),
    hourlyRateInr: Number(row.hourlyRateInr || meta.partTimeRate || 0),
    totalReviews: Number(row.totalReviews || 0)
  };
}

function getProfessionalSortFn(sortKey = "relevance") {
  switch (sortKey) {
    case "rating":
      return (a, b) =>
        Number(b.isVerified) - Number(a.isVerified) ||
        b.ratings - a.ratings ||
        b.experience - a.experience ||
        a.distance - b.distance;
    case "experience":
      return (a, b) =>
        b.experience - a.experience ||
        b.ratings - a.ratings ||
        Number(b.isVerified) - Number(a.isVerified) ||
        a.distance - b.distance;
    case "distance":
      return (a, b) =>
        a.distance - b.distance || b.ratings - a.ratings || Number(b.isVerified) - Number(a.isVerified);
    case "newest":
      return (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
        Number(b.isVerified) - Number(a.isVerified);
    default:
      return (a, b) =>
        Number(b.isVerified) - Number(a.isVerified) ||
        b.ratings - a.ratings ||
        b.experience - a.experience ||
        a.distance - b.distance;
  }
}

async function seedDatabase() {
  const client = getClient();

  // Clean out any legacy outdated service category names
  try {
    await client.from("services").delete().in("name", [
      "Guard & Security",
      "Hospital Staff",
      "Hotel Staff",
      "Outsourcing & Office",
      "Pandit Ji",
      "Interior Designing",
      "Plumbing",
      "Electricians"
    ]);
  } catch (err) {
    console.error("Warning cleaning old services:", err.message);
  }

  for (const service of seedData.services) {
    let { error } = await client.from("services").upsert(
      {
        name: service.name,
        slug: service.slug,
        icon_path: service.icon,
        description: service.description,
        base_price_inr: service.basePriceInr,
        subskills: JSON.stringify(service.subskills || []),
        is_active: true
      },
      { onConflict: "slug" }
    );
    if (error && (error.message?.includes("subskills") || error.code === "42703")) {
      const res = await client.from("services").upsert(
        {
          name: service.name,
          slug: service.slug,
          icon_path: service.icon,
          description: service.description,
          base_price_inr: service.basePriceInr,
          is_active: true
        },
        { onConflict: "slug" }
      );
      error = res.error;
    }
    if (error && !error.message?.includes("subskills")) {
      throwOnError(error, "Failed to seed services.");
    }
  }

  // Seed a default admin account if the admins table exists
  try {
    const adminPasswordHash = await bcrypt.hash("personnelsv", 10);
    const { error } = await client.from("admins").upsert(
      {
        full_name: "Super Admin",
        email: "personnelsv@gmail.com",
        password_hash: adminPasswordHash
      },
      { onConflict: "email" }
    );
    if (error) {
      console.warn(`Admin seeding skipped (table might not exist yet): ${error.message}`);
    } else {
      console.log("Admin seeded successfully.");
    }
  } catch (err) {
    console.warn(`Admin seeding failed: ${err.message}`);
  }

  // No fake professionals or reviews are seeded.
  // All professionals and clients must register through the real sign-up flow.
}



async function initializeSupabase() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    dbState.connected = false;
    dbState.ready = false;
    dbState.lastError =
      "Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.";
    return dbState;
  }

  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const anonKey = getSupabaseAnonKey();
    if (anonKey) {
      supabaseAuth = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }

    const { error } = await supabase.from("services").select("id").limit(1);

    if (error) {
      if (error.code === "PGRST205" || error.message.includes("does not exist")) {
        throw new Error(
          "Supabase tables are not set up yet. Open the Supabase SQL Editor and run database/schema.sql, then restart the app."
        );
      }

      throw error;
    }

    try {
      await seedDatabase();
    } catch (seedError) {
      console.warn(`Database seeding skipped/failed: ${seedError.message}`);
    }

    dbState.connected = true;
    dbState.ready = true;
    dbState.lastError = null;
    dbState.projectUrl = supabaseUrl;
  } catch (error) {
    dbState.connected = false;
    dbState.ready = false;
    dbState.lastError = error.message;
    supabase = null;
  }

  return dbState;
}

function isDatabaseReady() {
  return dbState.connected && dbState.ready && Boolean(supabase);
}

async function getServiceCatalog(limit = 8) {
  const safeLimit = normalizeLimit(limit, 8);
  const client = getClient();

  let { data: services, error: servicesError } = await client
    .from("services")
    .select("id, name, slug, icon_path, description, base_price_inr, subskills")
    .eq("is_active", true);

  if (servicesError && (servicesError.message?.includes("subskills") || servicesError.code === "42703")) {
    const res = await client
      .from("services")
      .select("id, name, slug, icon_path, description, base_price_inr")
      .eq("is_active", true);
    services = res.data;
    servicesError = res.error;
  }

  const { data: links, error: linksError } = await client
    .from("professional_services")
    .select("service_id, professional_id, custom_rate_inr");

  throwOnError(servicesError);
  throwOnError(linksError);

  const catalog = (services || []).map((service) => {
    const serviceLinks = (links || []).filter((link) => link.service_id === service.id);
    const professionalIds = new Set(serviceLinks.map((link) => link.professional_id));
    const startingPrices = serviceLinks.map((link) => link.custom_rate_inr ?? service.base_price_inr);
    let subskills = [];
    try {
      subskills = typeof service.subskills === "string" ? JSON.parse(service.subskills || "[]") : (service.subskills || []);
    } catch (e) {}
    if (!subskills || !subskills.length) {
      const matched = seedData.services.find(s => s.slug === service.slug || s.name === service.name);
      if (matched && matched.subskills) subskills = matched.subskills;
    }

    return {
      id: Number(service.id),
      name: service.name,
      slug: service.slug,
      icon: service.icon_path,
      description: service.description,
      basePriceInr: Number(service.base_price_inr || 0),
      startingPriceInr: startingPrices.length ? Math.min(...startingPrices) : Number(service.base_price_inr || 0),
      professionalCount: professionalIds.size,
      subskills: Array.isArray(subskills) ? subskills : []
    };
  });

  return catalog
    .sort((a, b) => b.professionalCount - a.professionalCount || a.name.localeCompare(b.name))
    .slice(0, safeLimit);
}

async function getHomeStats() {
  const client = getClient();

  // Use DB aggregate for average rating instead of fetching all rows
  const [
    { count: professionalCount, error: professionalError },
    { count: bookingCount, error: bookingError },
    { data: ratingAgg, error: reviewError }
  ] = await Promise.all([
    client.from("professionals").select("*", { count: "exact", head: true }),
    client.from("bookings").select("*", { count: "exact", head: true }),
    client.rpc("get_average_rating").select()
  ]);

  throwOnError(professionalError);
  throwOnError(bookingError);

  // Fallback: if RPC not available, use a count query
  let averageRating = 0;
  if (!reviewError && ratingAgg && ratingAgg[0]?.avg != null) {
    averageRating = Number(ratingAgg[0].avg);
  } else {
    // Lightweight fallback using only rating column with limit
    const { data: reviews } = await client.from("reviews").select("rating").limit(500);
    if (reviews?.length) {
      averageRating = reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0) / reviews.length;
    }
  }

  return [
    { value: `${professionalCount || 0}+`, label: "Active professionals" },
    { value: `${averageRating.toFixed(1)}/5`, label: "Average rating" },
    { value: `${bookingCount || 0}+`, label: "Booking requests" }
  ];
}

async function getDirectoryProfessionals() {
  const client = getClient();
  const { data, error } = await client.from("professional_directory_vw").select("*");
  throwOnError(error);
  return (data || []).map(normalizeProfessionalRow);
}

async function getFeaturedProfessionals(limit = 6) {
  const safeLimit = normalizeLimit(limit, 6);
  const rows = await getDirectoryProfessionals();

  return rows
    .sort(
      (a, b) =>
        Number(b.isVerified) - Number(a.isVerified) ||
        b.ratings - a.ratings ||
        b.experience - a.experience ||
        a.distance - b.distance
    )
    .slice(0, safeLimit);
}

async function getTestimonials(limit = 3) {
  const safeLimit = normalizeLimit(limit, 3);
  const client = getClient();

  const { data, error } = await client
    .from("reviews")
    .select("review_text, reviewer_name, rating, created_at, client_id, professional_id")
    .not("review_text", "is", null)
    .neq("review_text", "")
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  throwOnError(error);
  if (!data?.length) return [];

  // Batch-fetch all needed clients and professionals in 2 queries instead of N*2
  const clientIds = [...new Set(data.map((r) => r.client_id).filter(Boolean))];
  const professionalIds = [...new Set(data.map((r) => r.professional_id).filter(Boolean))];

  const [clientsResult, prosResult] = await Promise.all([
    clientIds.length
      ? client.from("clients").select("id, city").in("id", clientIds)
      : Promise.resolve({ data: [] }),
    professionalIds.length
      ? client.from("professionals").select("id, photo_url").in("id", professionalIds)
      : Promise.resolve({ data: [] })
  ]);

  const cityMap = new Map((clientsResult.data || []).map((c) => [c.id, c.city]));
  const photoMap = new Map((prosResult.data || []).map((p) => [p.id, p.photo_url]));

  return data.map((review) => ({
    quote: review.review_text,
    name: review.reviewer_name,
    role: `Client, ${cityMap.get(review.client_id) || "NCR"}`,
    image: photoMap.get(review.professional_id) || DEFAULT_PHOTO,
    rating: review.rating
  }));
}

async function searchProfessionals({ queryText = "", cityQ = "", sortKey = "relevance", verifiedOnly = false, limit = 48 }) {
  const safeLimit = normalizeLimit(limit, 48);
  let rows = await getDirectoryProfessionals();

  if (queryText) {
    const needle = queryText.toLowerCase();
    rows = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.skills.some((skill) => skill.toLowerCase().includes(needle)) ||
        row.city.toLowerCase().includes(needle) ||
        row.area.toLowerCase().includes(needle) ||
        (row.pincode && String(row.pincode).toLowerCase().includes(needle))
    );
  }

  if (cityQ) {
    const needle = cityQ.toLowerCase();
    rows = rows.filter(
      (row) =>
        row.city.toLowerCase().includes(needle) ||
        row.area.toLowerCase().includes(needle) ||
        (row.pincode && String(row.pincode).toLowerCase().includes(needle))
    );
  }

  if (verifiedOnly) {
    rows = rows.filter((row) => row.isVerified);
  }

  return rows.sort(getProfessionalSortFn(sortKey)).slice(0, safeLimit);
}

async function getProfessionalById(professionalId) {
  const client = getClient();
  const { data, error } = await client
    .from("professional_directory_vw")
    .select("*")
    .eq("id", professionalId)
    .maybeSingle();

  throwOnError(error);
  return data ? normalizeProfessionalRow(data) : null;
}

async function getProfessionalServiceOptions(professionalId) {
  const client = getClient();

  const { data: links, error: linksError } = await client
    .from("professional_services")
    .select("service_id, custom_rate_inr")
    .eq("professional_id", professionalId);

  throwOnError(linksError);
  if (!links?.length) return [];

  const serviceIds = links.map((link) => link.service_id);
  const { data: services, error: servicesError } = await client
    .from("services")
    .select("id, name, slug, base_price_inr")
    .in("id", serviceIds)
    .order("name", { ascending: true });

  throwOnError(servicesError);

  const rateMap = new Map(links.map((link) => [link.service_id, link.custom_rate_inr]));

  return (services || []).map((service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    priceInr: rateMap.get(service.id) ?? service.base_price_inr
  }));
}

async function createContactMessage(data) {
  const client = getClient();
  const { data: row, error } = await client
    .from("contact_messages")
    .insert({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message
    })
    .select("id")
    .single();

  throwOnError(error);
  return row.id;
}

async function getContactMessagesByEmail(email) {
  const client = getClient();
  const { data, error } = await client
    .from("contact_messages")
    .select("id, full_name, email, phone, subject, message, status, admin_reply, replied_at, created_at")
    .eq("email", email.trim().toLowerCase())
    .order("created_at", { ascending: false });

  throwOnError(error);
  return data || [];
}

async function createClientAccount(data, originUrl = null) {
  const authClient = getAuthClient();
  const dbClient = getClient();
  const base = originUrl || process.env.APP_URL || "https://svpersonnel.in";
  const cleanBase = base.replace(/\/$/, "");

  // 1. Sign up user in Supabase Auth
  const { data: authResult, error: authError } = await authClient.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      redirectTo: `${cleanBase}/auth/callback?role=client`
    }
  });
  if (authError) {
    throw authError;
  }

  const supabaseUid = authResult.user?.id || null;
  const emailVerificationRequired = !authResult.session && !authResult.user?.email_confirmed_at;

  // 2. Hash password locally for legacy fallback
  const passwordHash = await bcrypt.hash(data.password, 10);

  const payload = {
    supabase_uid: supabaseUid,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    password_hash: passwordHash,
    city: data.city || "",
    area: data.area || "",
    address: data.address || "",
    pincode: data.pincode || "",
    username: data.username || ""
  };

  let row;
  const { data: dbRow, error } = await dbClient.from("clients").insert(payload).select("id").maybeSingle();

  if (error) {
    if (error.message && (error.message.includes("schema cache") || error.message.includes("does not exist") || error.message.includes("column") || error.message.includes("pincode"))) {
      const list = await getLocalClients();
      const newClient = { id: Date.now(), ...payload };
      list.push(newClient);
      await saveLocalClients(list);
      row = newClient;
    } else {
      if (supabaseUid) {
        try {
          await dbClient.auth.admin.deleteUser(supabaseUid);
        } catch (err) {
          console.error("Cleanup failed:", err.message);
        }
      }
      throwOnError(error, "Failed to create client database record.");
    }
  } else {
    row = dbRow;
  }

  return {
    id: row.id,
    name: data.fullName,
    email: data.email,
    phone: data.phone,
    city: data.city,
    username: data.username || "",
    address: data.address || "",
    area: data.area || "",
    pincode: data.pincode || "",
    role: "client",
    emailVerificationRequired
  };
}

async function deleteClientAccount(clientId) {
  const client = getClient();
  const { data, error } = await client.from("clients").delete().eq("id", clientId).select("id");

  throwOnError(error);

  if (!data?.length) {
    const notFound = new Error("That client profile could not be found.");
    notFound.statusCode = 404;
    throw notFound;
  }

  return true;
}

async function authenticateClient(email, password) {
  const authClient = getAuthClient();
  const dbClient = getClient();

  // 1. Authenticate via Supabase Auth
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    let msg = authError.message;
    if (msg.toLowerCase().includes("email not confirmed") || msg.toLowerCase().includes("email verification required")) {
      msg = "Your email address has not been verified yet. Please check your inbox and click the verification link from Supabase.";
    }
    const err = new Error(msg);
    err.statusCode = authError.status || 400;
    throw err;
  }

  // 2. Retrieve public client profile
  let row;
  const { data: dbRow, error } = await dbClient
    .from("clients")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error || !dbRow) {
    const list = await getLocalClients();
    row = list.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
    if (!row && error) throwOnError(error);
  } else {
    row = dbRow;
  }

  if (!row) {
    const err = new Error("Client profile not found in public database.");
    err.statusCode = 404;
    throw err;
  }

  // Update supabase_uid in case it was missing
  if (row.id && !row.supabase_uid && authData.user?.id) {
    try { await dbClient.from("clients").update({ supabase_uid: authData.user.id }).eq("id", row.id); } catch(e) {}
  }

  return {
    id: row.id,
    name: row.full_name || row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    username: row.username || "",
    address: row.address || "",
    area: row.area || "",
    pincode: row.pincode || "",
    role: "client"
  };
}

async function createProfessionalAccount(data, originUrl = null) {
  const authClient = getAuthClient();
  const dbClient = getClient();
  const base = originUrl || process.env.APP_URL || "https://svpersonnel.in";
  const cleanBase = base.replace(/\/$/, "");

  // 1. Sign up user in Supabase Auth
  const { data: authResult, error: authError } = await authClient.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      redirectTo: `${cleanBase}/auth/callback?role=professional`
    }
  });
  if (authError) {
    throw authError;
  }

  const supabaseUid = authResult.user?.id || null;
  const emailVerificationRequired = !authResult.session && !authResult.user?.email_confirmed_at;

  // 2. Hash password locally
  const passwordHash = await bcrypt.hash(data.password, 10);

  // 3. Insert professional profile
  const insertPayload = {
    supabase_uid: supabaseUid,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    password_hash: passwordHash,
    city: data.city,
    area: data.area,
    pincode: data.pincode || "",
    years_experience: data.experience,
    hourly_rate_inr: 0,
    distance_km: data.distanceKm || 0,
    photo_url: data.photoUrl || DEFAULT_PHOTO,
    bio: data.description || "",
    is_verified: Boolean(data.isVerified)
  };

  let { data: row, error } = await dbClient
    .from("professionals")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error && error.message && error.message.includes("pincode")) {
    delete insertPayload.pincode;
    if (data.pincode) {
      insertPayload.bio = `${insertPayload.bio || ""} [pincode:${data.pincode}]`.trim();
    }
    const fallback = await dbClient
      .from("professionals")
      .insert(insertPayload)
      .select("id")
      .single();
    row = fallback.data;
    error = fallback.error;
  }

  if (error) {
    if (supabaseUid) {
      try {
        await dbClient.auth.admin.deleteUser(supabaseUid);
      } catch (err) {
        console.error("Cleanup failed:", err.message);
      }
    }
    throwOnError(error, "Failed to create professional database record.");
  }

  // 4. Map professional services (custom_rate_inr remains null to fall back to service base price)
  for (const serviceId of data.serviceIds) {
    const { error: linkError } = await dbClient.from("professional_services").insert({
      professional_id: row.id,
      service_id: serviceId,
      custom_rate_inr: null
    });
    if (linkError) {
      await dbClient.from("professionals").delete().eq("id", row.id);
      if (supabaseUid) {
        try {
          await dbClient.auth.admin.deleteUser(supabaseUid);
        } catch (err) {
          console.error("Cleanup failed:", err.message);
        }
      }
      throwOnError(linkError, "Failed to map professional services.");
    }
  }

  return {
    id: row.id,
    name: data.fullName,
    email: data.email,
    phone: data.phone,
    city: data.city,
    role: "professional",
    emailVerificationRequired
  };
}

async function deleteProfessionalAccount(professionalId) {
  const client = getClient();
  const { data, error } = await client.from("professionals").delete().eq("id", professionalId).select("id");

  throwOnError(error);

  if (!data?.length) {
    const notFound = new Error("That professional profile could not be found.");
    notFound.statusCode = 404;
    throw notFound;
  }

  return true;
}

async function authenticateProfessional(login, password) {
  const authClient = getAuthClient();
  const dbClient = getClient();

  let email = login;
  if (!login.includes("@")) {
    const { data } = await dbClient.from("professionals").select("email").eq("phone", login).maybeSingle();
    if (data) email = data.email;
  }

  // 1. Authenticate via Supabase Auth
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    let msg = authError.message;
    if (msg.toLowerCase().includes("email not confirmed") || msg.toLowerCase().includes("email verification required")) {
      msg = "Your email address has not been verified yet. Please check your inbox and click the verification link from Supabase.";
    }
    const err = new Error(msg);
    err.statusCode = authError.status || 400;
    throw err;
  }

  // 2. Fetch public professional profile
  const { data: row, error } = await dbClient
    .from("professionals")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  throwOnError(error);
  if (!row) {
    const err = new Error("Professional profile not found in public database.");
    err.statusCode = 404;
    throw err;
  }

  // Sync supabase_uid if missing
  if (!row.supabase_uid && authData.user?.id) {
    await dbClient.from("professionals").update({ supabase_uid: authData.user.id }).eq("id", row.id);
  }

  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    role: "professional"
  };
}

async function authenticateUnified(login, password) {
  const dbClient = getClient();
  const input = String(login).trim();
  const inputLower = input.toLowerCase();

  // 1. Try Admin (email match)
  try {
    const { data: adminRow } = await dbClient.from("admins").select("*").eq("email", inputLower).maybeSingle();
    if (adminRow) {
      if (bcrypt.compareSync(password, adminRow.password_hash)) {
        return {
          id: adminRow.id,
          name: adminRow.full_name,
          email: adminRow.email,
          role: "admin"
        };
      }
    }
  } catch (err) {
    console.error("Admin auth check failed:", err.message);
  }

  // 2. Try Client (email, phone, or username match)
  try {
    let clientRow = null;
    let clientQuery = dbClient.from("clients").select("*");
    if (inputLower.includes("@")) {
      clientQuery = clientQuery.eq("email", inputLower);
    } else if (input.match(/^\+?[0-9\-\s]{10,20}$/)) {
      clientQuery = clientQuery.eq("phone", input);
    } else {
      clientQuery = clientQuery.eq("username", input);
    }
    const res = await clientQuery.maybeSingle();
    clientRow = res.data;

    if (!clientRow) {
      const list = await getLocalClients();
      clientRow = list.find(c => 
        (c.email && c.email.toLowerCase() === inputLower) ||
        (c.phone && c.phone === input) ||
        (c.username && c.username.toLowerCase() === inputLower)
      );
    }

    if (clientRow && clientRow.password_hash) {
      if (bcrypt.compareSync(password, clientRow.password_hash)) {
        return {
          id: clientRow.id,
          name: clientRow.full_name || clientRow.name,
          email: clientRow.email,
          phone: clientRow.phone,
          city: clientRow.city,
          username: clientRow.username || "",
          address: clientRow.address || "",
          area: clientRow.area || "",
          pincode: clientRow.pincode || "",
          role: "client"
        };
      }
    }
  } catch (err) {
    console.error("Client auth check failed:", err.message);
  }

  // 3. Try Partner (email, phone, or username match)
  try {
    let partnerRow = null;
    let partnerQuery = dbClient.from("partners").select("*");
    if (inputLower.includes("@")) {
      partnerQuery = partnerQuery.eq("email", inputLower);
    } else if (input.match(/^\+?[0-9\-\s]{10,20}$/)) {
      partnerQuery = partnerQuery.eq("phone", input);
    } else {
      partnerQuery = partnerQuery.eq("username", input);
    }
    const res = await partnerQuery.maybeSingle();
    partnerRow = res.data;

    if (!partnerRow) {
      const list = await getLocalPartners();
      partnerRow = list.find(p => 
        (p.email && p.email.toLowerCase() === inputLower) ||
        (p.phone && p.phone === input) ||
        (p.username && p.username.toLowerCase() === inputLower)
      );
    }

    if (partnerRow && partnerRow.password_hash) {
      if (bcrypt.compareSync(password, partnerRow.password_hash)) {
        return {
          id: partnerRow.id,
          name: partnerRow.full_name || partnerRow.name,
          email: partnerRow.email,
          phone: partnerRow.phone,
          city: partnerRow.city,
          username: partnerRow.username || "",
          isVerified: partnerRow.is_verified || partnerRow.isVerified,
          role: "partner"
        };
      }
    }
  } catch (err) {
    console.error("Partner auth check failed:", err.message);
  }

  // 4. Try Professional (email, phone, or username match)
  try {
    let proRow = null;
    let proQuery = dbClient.from("professionals").select("*");
    if (inputLower.includes("@")) {
      proQuery = proQuery.eq("email", inputLower);
    } else if (input.match(/^\+?[0-9\-\s]{10,20}$/)) {
      proQuery = proQuery.eq("phone", input);
    } else {
      proQuery = proQuery.eq("username", input);
    }
    const res = await proQuery.maybeSingle();
    proRow = res.data;

    if (!proRow) {
      const list = await getLocalProfessionals();
      proRow = list.find(p => 
        (p.email && p.email.toLowerCase() === inputLower) ||
        (p.phone && p.phone === input) ||
        (p.username && p.username.toLowerCase() === inputLower)
      );
    }

    if (proRow && proRow.password_hash) {
      if (bcrypt.compareSync(password, proRow.password_hash)) {
        return {
          id: proRow.id,
          name: proRow.full_name || proRow.name,
          email: proRow.email,
          phone: proRow.phone,
          city: proRow.city,
          area: proRow.area,
          username: proRow.username || "",
          isVerified: proRow.is_verified || proRow.isVerified,
          role: "professional",
          partnerId: proRow.partner_id || proRow.partnerId,
          isPartnerManaged: proRow.is_partner_managed || proRow.isPartnerManaged
        };
      }
    }
  } catch (err) {
    console.error("Professional auth check failed:", err.message);
  }

  throw new Error("Incorrect login ID (email, phone, username) or password.");
}

function createBookingCode() {
  return `GC${Date.now().toString().slice(-7)}`;
}

async function createBooking(data) {
  const client = getClient();
  const bookingCode = createBookingCode();

  const { error } = await client.from("bookings").insert({
    booking_code: bookingCode,
    client_id: data.clientId || null,
    guest_name: data.guestName || null,
    guest_email: data.guestEmail || null,
    guest_phone: data.guestPhone || null,
    professional_id: data.professionalId,
    service_id: data.serviceId,
    preferred_date: data.preferredDate,
    preferred_time_slot: data.preferredTimeSlot,
    address_area: data.addressArea,
    budget_inr: data.budgetInr,
    details: data.details || null
  });

  throwOnError(error);
  return bookingCode;
}

async function createClientReview({ bookingId, clientId, rating, reviewText, reviewerName }) {
  const client = getClient();

  const { data: booking, error: bookingError } = await client
    .from("bookings")
    .select("id, professional_id, status, client_id")
    .eq("id", bookingId)
    .eq("client_id", clientId)
    .maybeSingle();

  throwOnError(bookingError);

  if (!booking) {
    const error = new Error("That completed booking could not be found for your account.");
    error.statusCode = 404;
    throw error;
  }

  if (booking.status !== "completed") {
    const error = new Error("You can only rate a booking after the professional marks it as completed.");
    error.statusCode = 409;
    throw error;
  }

  const { data: existingReview, error: existingReviewError } = await client
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("client_id", clientId)
    .maybeSingle();

  throwOnError(existingReviewError);

  if (existingReview) {
    const error = new Error("You have already submitted a rating for this booking.");
    error.statusCode = 409;
    throw error;
  }

  let resolvedReviewerName = reviewerName;
  if (!resolvedReviewerName) {
    const { data: clientRow } = await client.from("clients").select("full_name").eq("id", clientId).maybeSingle();
    resolvedReviewerName = clientRow?.full_name || "SV Personnels client";
  }

  const { data: row, error } = await client
    .from("reviews")
    .insert({
      booking_id: bookingId,
      client_id: clientId,
      professional_id: booking.professional_id,
      rating,
      review_text: reviewText || null,
      reviewer_name: resolvedReviewerName
    })
    .select("id")
    .single();

  throwOnError(error);
  return row.id;
}

async function updateProfessionalBookingStatus({ bookingId, professionalId, nextStatus }) {
  const allowedTransitions = {
    confirmed: ["pending"],
    completed: ["confirmed"],
    cancelled: ["pending"]
  };

  const validPreviousStates = allowedTransitions[nextStatus];
  if (!validPreviousStates) {
    const error = new Error("That booking action is not allowed.");
    error.statusCode = 400;
    throw error;
  }

  const client = getClient();
  const { data: booking, error: bookingError } = await client
    .from("bookings")
    .select("id, status, budget_inr")
    .eq("id", bookingId)
    .eq("professional_id", professionalId)
    .maybeSingle();

  throwOnError(bookingError);

  if (!booking) {
    const error = new Error("That booking request could not be found.");
    error.statusCode = 404;
    throw error;
  }

  if (!validPreviousStates.includes(booking.status)) {
    const error = new Error(`This booking is already ${booking.status}, so that action is unavailable.`);
    error.statusCode = 409;
    throw error;
  }

  const { error } = await client
    .from("bookings")
    .update({ status: nextStatus })
    .eq("id", bookingId)
    .eq("professional_id", professionalId);

  throwOnError(error);

  if (nextStatus === "completed") {
    try {
      await addEarningRecord(bookingId, professionalId, booking.budget_inr);
    } catch (earnErr) {
      console.error("Failed to add earning record:", earnErr.message);
    }
  }

  return nextStatus;
}

async function getClientDashboardData(clientId) {
  const client = getClient();

  const [{ data: bookings, error: bookingsError }, { data: reviews, error: reviewsError }] = await Promise.all([
    client
      .from("bookings")
      .select(`
        id,
        booking_code,
        status,
        preferred_date,
        preferred_time_slot,
        address_area,
        budget_inr,
        details,
        created_at,
        professionals (
          full_name,
          city,
          area,
          phone,
          email
        ),
        services (
          name
        )
      `)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    client
      .from("reviews")
      .select("id, booking_id, rating, review_text, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
  ]);

  throwOnError(bookingsError);
  throwOnError(reviewsError);

  const summary = (bookings || []).reduce(
    (acc, booking) => {
      acc.totalBookings += 1;
      if (booking.status === "confirmed") acc.confirmedBookings += 1;
      if (booking.status === "pending") acc.pendingBookings += 1;
      return acc;
    },
    { totalBookings: 0, confirmedBookings: 0, pendingBookings: 0 }
  );

  const reviewMap = new Map();
  for (const review of reviews || []) {
    if (!review.booking_id || reviewMap.has(review.booking_id)) continue;

    reviewMap.set(review.booking_id, {
      id: review.id,
      rating: Number(review.rating || 0),
      reviewText: review.review_text || "",
      createdAt: review.created_at
    });
  }

  return {
    summary,
    bookings: (bookings || []).map((booking) => ({
      id: booking.id,
      bookingCode: booking.booking_code,
      professionalName: booking.professionals?.full_name || "Professional",
      professionalCity: booking.professionals?.city || "",
      professionalArea: booking.professionals?.area || "",
      professionalPhone: booking.professionals?.phone || "",
      professionalEmail: booking.professionals?.email || "",
      serviceName: booking.services?.name || "",
      preferredDate: booking.preferred_date,
      preferredTimeSlot: booking.preferred_time_slot,
      addressArea: booking.address_area,
      budgetInr: Number(booking.budget_inr || 0),
      details: booking.details || "",
      status: booking.status,
      createdAt: booking.created_at,
      review: reviewMap.get(booking.id) || null,
      canReview: booking.status === "completed" && !reviewMap.has(booking.id)
    }))
  };
}

async function getProfessionalDashboardData(professionalId) {
  const client = getClient();

  const { data: bookings, error: bookingsError } = await client
    .from("professional_booking_summary_vw")
    .select("*")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  throwOnError(bookingsError);

  const summary = (bookings || []).reduce(
    (acc, booking) => {
      acc.totalRequests += 1;
      if (booking.status === "confirmed") acc.confirmedRequests += 1;
      if (booking.status === "pending") acc.pendingRequests += 1;
      if (booking.status === "completed") acc.completedRequests += 1;
      return acc;
    },
    { totalRequests: 0, confirmedRequests: 0, pendingRequests: 0, completedRequests: 0 }
  );

  const profile = await getProfessionalProfile(professionalId);

  return {
    summary,
    profile,
    bookings: (bookings || []).map((booking) => ({
      id: booking.id,
      bookingCode: booking.booking_code,
      clientName: booking.client_name || "Guest client",
      clientEmail: booking.client_email || "",
      clientPhone: booking.client_phone || "",
      serviceName: booking.service_name,
      preferredDate: booking.preferred_date,
      preferredTimeSlot: booking.preferred_time_slot,
      addressArea: booking.address_area,
      budgetInr: Number(booking.budget_inr || 0),
      details: booking.details || "",
      status: booking.status,
      createdAt: booking.created_at
    }))
  };
}

async function getServiceOptions() {
  const client = getClient();
  let { data, error } = await client
    .from("services")
    .select("id, name, slug, base_price_inr, subskills")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error && (error.message?.includes("subskills") || error.code === "42703")) {
    const res = await client
      .from("services")
      .select("id, name, slug, base_price_inr")
      .eq("is_active", true)
      .order("name", { ascending: true });
    data = res.data;
    error = res.error;
  }

  throwOnError(error);

  return (data || []).map((row) => {
    let subskills = [];
    try {
      subskills = typeof row.subskills === "string" ? JSON.parse(row.subskills || "[]") : (row.subskills || []);
    } catch (e) {}
    if (!subskills || !subskills.length) {
      const matched = seedData.services.find(s => s.slug === row.slug || s.name === row.name);
      if (matched && matched.subskills) subskills = matched.subskills;
    }
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      basePriceInr: row.base_price_inr,
      subskills: Array.isArray(subskills) ? subskills : []
    };
  });
}

async function addCustomServiceOption(name) {
  if (!name || typeof name !== "string") return null;
  const cleanName = name.trim();
  if (!cleanName) return null;
  const slug = cleanName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  try {
    const client = getClient();
    const { data: existing } = await client.from("services").select("id, name").ilike("name", cleanName).maybeSingle();
    if (existing) return existing;
    const { data: inserted, error } = await client.from("services").insert({
      name: cleanName,
      slug: slug || `service-${Date.now()}`,
      base_price_inr: 499,
      is_active: true
    }).select().maybeSingle();
    if (error) console.warn("Failed to insert custom service into DB:", error.message);
    return inserted || { id: Date.now(), name: cleanName, slug };
  } catch (err) {
    console.warn("addCustomServiceOption error:", err.message);
    return { id: Date.now(), name: cleanName, slug };
  }
}

async function authenticateAdmin(email, password) {
  const client = getClient();
  const { data: row, error } = await client.from("admins").select("*").eq("email", email).maybeSingle();
  throwOnError(error);
  if (!row) return null;

  const isMatch = await bcrypt.compare(password, row.password_hash);
  if (!isMatch) return null;

  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: "admin"
  };
}

async function getAdminDashboardData() {
  const client = getClient();

  const [
    { count: totalClients, error: clientsErr },
    { count: totalProfessionals, error: prosErr },
    { count: totalBookings, error: bookingsErr },
    { count: pendingSupport, error: pendingSupportErr }
  ] = await Promise.all([
    client.from("clients").select("*", { count: "exact", head: true }),
    client.from("professionals").select("*", { count: "exact", head: true }),
    client.from("bookings").select("*", { count: "exact", head: true }),
    client.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "pending")
  ]);

  throwOnError(clientsErr);
  throwOnError(prosErr);
  throwOnError(bookingsErr);
  const pendingCount = pendingSupportErr ? 0 : pendingSupport;

  // Batch-fetch messages, professionals, partners, withdrawals, platform wallet, earnings, services, disputes, coupons, cms
  const [
    messagesResult,
    prosResult,
    partnersResult,
    withdrawalsResult,
    platformWalletResult,
    earningsResult,
    allLinksResult,
    allServicesResult,
    disputesResult,
    couponsResult,
    cmsResult
  ] = await Promise.all([
    client.from("contact_messages").select("*").order("created_at", { ascending: false }),
    client.from("professionals").select("*").order("created_at", { ascending: false }),
    client.from("partners").select("*").order("created_at", { ascending: false }),
    client.from("withdrawals").select("*").order("created_at", { ascending: false }),
    client.from("wallet_balances").select("*").eq("owner_type", "platform").eq("owner_id", 1).maybeSingle(),
    client.from("earnings").select("*, bookings(booking_code), professionals(full_name, email)").order("created_at", { ascending: false }),
    client.from("professional_services").select("professional_id, service_id"),
    client.from("services").select("id, name, slug, base_price_inr, is_active, description, icon_path, subskills"),
    client.from("disputes").select("*, bookings(booking_code, gross_amount_inr), clients(full_name, email, phone), professionals(full_name, email, phone)").order("created_at", { ascending: false }),
    client.from("coupons").select("*").order("created_at", { ascending: false }),
    client.from("cms_content").select("*")
  ]);

  const supportMessages = messagesResult.error ? [] : (messagesResult.data || []);
  const professionals = prosResult.data || [];
  throwOnError(prosResult.error);

  const partners = partnersResult.data || [];
  const withdrawals = withdrawalsResult.data || [];
  const platformWallet = platformWalletResult.data || { available_inr: 0, pending_inr: 0, total_earned_inr: 0 };
  const earnings = earningsResult.data || [];

  // Disputes with fallback
  let disputes = disputesResult.error ? [] : (disputesResult.data || []);
  if (!disputes.length) {
    disputes = await getLocalDisputes();
  }

  // Coupons with fallback
  let coupons = couponsResult.error ? [] : (couponsResult.data || []);
  if (!coupons.length) {
    coupons = await getLocalCoupons();
  }

  // CMS Settings with fallback
  let cmsData = cmsResult.error ? [] : (cmsResult.data || []);
  const cmsSettings = await getMergedCmsSettings(cmsData);

  // Build lookup maps for service names keyed by professional_id
  const serviceNameMap = new Map((allServicesResult.data || []).map((s) => [s.id, s.name]));
  const proSkillsMap = new Map();
  for (const link of allLinksResult.data || []) {
    if (!proSkillsMap.has(link.professional_id)) proSkillsMap.set(link.professional_id, []);
    const name = serviceNameMap.get(link.service_id);
    if (name) proSkillsMap.get(link.professional_id).push(name);
  }

  const normalizedPros = professionals.map((pro) => {
    const meta = parseProfessionalMetadata(pro.bio, pro.hourly_rate_inr, pro.startingPrice);
    return {
      id: pro.id,
      name: pro.full_name,
      email: pro.email,
      phone: pro.phone,
      city: pro.city,
      area: pro.area,
      experience: pro.years_experience,
      hourlyRateInr: pro.hourly_rate_inr || meta.partTimeRate,
      startingPrice: pro.startingPrice || meta.partTimeRate || 0,
      photo: pro.photo_url || DEFAULT_PHOTO,
      description: meta.cleanBio,
      workModes: meta.workModes,
      partTimeRate: meta.partTimeRate,
      fullTimeRate: meta.fullTimeRate,
      isVerified: pro.is_verified,
      skills: proSkillsMap.get(pro.id) || [],
      aadhaarPanUrl: pro.aadhaar_pan_url || meta.aadhaarPanUrl || "",
      livePhotoUrl: pro.live_photo_url || meta.livePhotoUrl || ""
    };
  });

  if (allServicesResult.error && (allServicesResult.error.message?.includes("subskills") || allServicesResult.error.code === "42703")) {
    allServicesResult = await client.from("services").select("id, name, slug, base_price_inr, is_active, description, icon_path");
  }

  let rawServices = allServicesResult.error ? [] : (allServicesResult.data || []);
  if (!rawServices.length) {
    rawServices = await getLocalServices();
  }
  const services = rawServices.map((s) => {
    let subskills = [];
    try {
      subskills = typeof s.subskills === "string" ? JSON.parse(s.subskills || "[]") : (s.subskills || []);
    } catch (e) {}
    if (!subskills || !subskills.length) {
      const matched = seedData.services.find(sd => sd.slug === s.slug || sd.name === s.name);
      if (matched && matched.subskills) subskills = matched.subskills;
    }
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      basePriceInr: s.base_price_inr,
      isActive: s.is_active !== false,
      description: s.description || "",
      iconPath: s.icon_path || "/assets/driver.png",
      subskills: Array.isArray(subskills) ? subskills : []
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return {
    metrics: {
      totalClients: totalClients || 0,
      totalProfessionals: totalProfessionals || 0,
      totalBookings: totalBookings || 0,
      pendingSupport: pendingCount || 0
    },
    supportMessages,
    professionals: normalizedPros,
    services,
    partners,
    withdrawals,
    platformWallet,
    earnings,
    disputes,
    coupons,
    cmsSettings
  };
}

async function updateServicePrice(serviceId, newPrice) {
  const client = getClient();
  const { error } = await client
    .from("services")
    .update({ base_price_inr: Number(newPrice) || 0 })
    .eq("id", serviceId);
  if (error && error.message) {
    console.error("updateServicePrice error:", error.message);
  }
  return true;
}

async function verifyProfessional(professionalId, isVerified) {
  const client = getClient();
  const { error } = await client
    .from("professionals")
    .update({ is_verified: isVerified })
    .eq("id", professionalId);
  throwOnError(error);
  return true;
}

async function replyToSupportMessage(messageId, replyText) {
  const client = getClient();
  const { error } = await client
    .from("contact_messages")
    .update({
      status: "resolved",
      admin_reply: replyText,
      replied_at: new Date().toISOString()
    })
    .eq("id", messageId);
  throwOnError(error);
  return true;
}

async function updateProfessionalProfile(professionalId, profileData) {
  const client = getClient();

  const updatePayload = {
    full_name: profileData.fullName,
    city: profileData.city,
    years_experience: Number(profileData.experience) || 0,
    bio: profileData.description || ""
  };

  if (profileData.username !== undefined) {
    updatePayload.username = profileData.username || null;
  }

  if (profileData.area !== undefined) {
    updatePayload.area = profileData.area || "Main";
  } else if (profileData.city) {
    updatePayload.area = profileData.city || "Main";
  }

  if (profileData.pincode !== undefined) {
    updatePayload.pincode = profileData.pincode || "";
  }

  if (profileData.phone !== undefined) {
    updatePayload.phone = profileData.phone || null;
  }

  if (profileData.photoUrl) {
    updatePayload.photo_url = profileData.photoUrl;
  }

  if (profileData.hourlyRateInr !== undefined) {
    updatePayload.hourly_rate_inr = Number(profileData.hourlyRateInr) || 0;
  }

  if (profileData.dailyRateInr !== undefined) {
    updatePayload.daily_rate_inr = Number(profileData.dailyRateInr) || 0;
  }
  if (profileData.projectRateInr !== undefined) {
    updatePayload.project_rate_inr = Number(profileData.projectRateInr) || 0;
  }
  if (profileData.languages !== undefined) {
    updatePayload.languages = profileData.languages || "";
  }
  if (profileData.workingRadiusKm !== undefined) {
    updatePayload.working_radius_km = Number(profileData.workingRadiusKm) || 10;
  }
  if (profileData.bankName !== undefined) {
    updatePayload.bank_name = profileData.bankName || "";
  }
  if (profileData.bankAccountNo !== undefined) {
    updatePayload.bank_account_no = profileData.bankAccountNo || "";
  }
  if (profileData.bankIfsc !== undefined) {
    updatePayload.bank_ifsc = profileData.bankIfsc || "";
  }
  if (profileData.upiHandle !== undefined) {
    updatePayload.upi_handle = profileData.upiHandle || "";
  }
  if (profileData.panNumber !== undefined) {
    updatePayload.pan_number = profileData.panNumber || "";
  }
  if (profileData.gstNumber !== undefined) {
    updatePayload.gst_number = profileData.gstNumber || "";
  }
  if (profileData.portfolioImages !== undefined) {
    updatePayload.portfolio_images = typeof profileData.portfolioImages === 'string' ? JSON.parse(profileData.portfolioImages) : profileData.portfolioImages;
  }
  if (profileData.portfolioVideos !== undefined) {
    updatePayload.portfolio_videos = typeof profileData.portfolioVideos === 'string' ? JSON.parse(profileData.portfolioVideos) : profileData.portfolioVideos;
  }
  if (profileData.certificatesUrls !== undefined) {
    updatePayload.certificates_urls = typeof profileData.certificatesUrls === 'string' ? JSON.parse(profileData.certificatesUrls) : profileData.certificatesUrls;
  }
  if (profileData.aadhaarPanUrl !== undefined) {
    updatePayload.aadhaar_pan_url = profileData.aadhaarPanUrl || "";
  }
  if (profileData.livePhotoUrl !== undefined) {
    updatePayload.live_photo_url = profileData.livePhotoUrl || "";
  }

  let { error } = await client
    .from("professionals")
    .update(updatePayload)
    .eq("id", professionalId);

  if (error && error.message && error.message.includes("pincode")) {
    delete updatePayload.pincode;
    if (profileData.pincode) {
      updatePayload.bio = `${updatePayload.bio || ""} [pincode:${profileData.pincode}]`.trim();
    }
    const fallback = await client
      .from("professionals")
      .update(updatePayload)
      .eq("id", professionalId);
    error = fallback.error;
  }

  throwOnError(error);
  return true;
}

async function resetUserPassword({ role, email, phone, newPassword }) {
  const dbClient = getClient();

  const table = role === "client" ? "clients" : "professionals";
  const { data: userRow, error: queryError } = await dbClient
    .from(table)
    .select("*")
    .eq("email", email)
    .eq("phone", phone)
    .maybeSingle();

  throwOnError(queryError);

  if (!userRow) {
    const error = new Error("No account matches that email and phone number.");
    error.statusCode = 404;
    throw error;
  }

  // Look up/Sync/Create Auth user
  let supabaseUid = userRow.supabase_uid;
  if (!supabaseUid) {
    const { data: listData, error: listError } = await dbClient.auth.admin.listUsers();
    if (listError) throw listError;

    const existingAuthUser = listData?.users?.find(u => u.email === email);
    if (existingAuthUser) {
      supabaseUid = existingAuthUser.id;
    } else {
      const { data: newAuthUser, error: createError } = await dbClient.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true
      });
      if (createError) throw createError;
      supabaseUid = newAuthUser?.user?.id;
    }
  }

  // Update password in Supabase Auth via admin API
  if (supabaseUid) {
    const { error: updateAuthError } = await dbClient.auth.admin.updateUserById(supabaseUid, {
      password: newPassword
    });
    if (updateAuthError) throw updateAuthError;
  } else {
    throw new Error("Could not resolve or map authentication user ID.");
  }

  // Update password hash locally
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error: updateDbError } = await dbClient
    .from(table)
    .update({
      password_hash: passwordHash,
      supabase_uid: supabaseUid
    })
    .eq("id", userRow.id);

  throwOnError(updateDbError);
  return true;
}

async function exchangeAuthCode(code, requestedRole = "client") {
  const authClient = getAuthClient();
  const dbClient = getClient();

  const { data, error } = await authClient.auth.exchangeCodeForSession(code);
  if (error) throw error;

  const email = data.user?.email;
  if (!email) throw new Error("Email not found in verification metadata.");

  // Check clients
  const { data: clientRow } = await dbClient.from("clients").select("*").eq("email", email).maybeSingle();
  if (clientRow) {
    if (!clientRow.supabase_uid && data.user?.id) {
      await dbClient.from("clients").update({ supabase_uid: data.user.id }).eq("id", clientRow.id);
    }
    return {
      id: clientRow.id,
      name: clientRow.full_name,
      email: clientRow.email,
      phone: clientRow.phone,
      city: clientRow.city,
      role: "client"
    };
  }

  // Check professionals
  const { data: proRow } = await dbClient.from("professionals").select("*").eq("email", email).maybeSingle();
  if (proRow) {
    if (!proRow.supabase_uid && data.user?.id) {
      await dbClient.from("professionals").update({ supabase_uid: data.user.id }).eq("id", proRow.id);
    }
    return {
      id: proRow.id,
      name: proRow.full_name,
      email: proRow.email,
      phone: proRow.phone,
      city: proRow.city,
      role: "professional"
    };
  }

  // Auto-signup if profile not found!
  const fullName = data.user?.user_metadata?.full_name || data.user?.user_metadata?.name || "Google User";
  const supabaseUid = data.user?.id || null;

  if (requestedRole === "client") {
    const { data: newClient, error: clientErr } = await dbClient
      .from("clients")
      .insert({
        supabase_uid: supabaseUid,
        full_name: fullName,
        email: email,
        phone: data.user?.user_metadata?.phone || "G_" + (supabaseUid || Date.now()),
        password_hash: "",
        city: "Gurugram"
      })
      .select("id")
      .single();

    if (clientErr) throw clientErr;

    return {
      id: newClient.id,
      name: fullName,
      email: email,
      phone: "",
      city: "Gurugram",
      role: "client"
    };
  } else {
    // Register as professional
    const { data: newPro, error: proErr } = await dbClient
      .from("professionals")
      .insert({
        supabase_uid: supabaseUid,
        full_name: fullName,
        email: email,
        phone: data.user?.user_metadata?.phone || "G_" + (supabaseUid || Date.now()),
        password_hash: "",
        city: "Gurugram",
        area: "Main",
        years_experience: 0,
        hourly_rate_inr: 0,
        bio: null,
        is_verified: false
      })
      .select("id")
      .single();

    if (proErr) throw proErr;

    // Map a default category (ID 1: Plumbing) so profile directory views don't break
    const { error: serviceLinkErr } = await dbClient.from("professional_services").insert({
      professional_id: newPro.id,
      service_id: 1,
      custom_rate_inr: null
    });
    if (serviceLinkErr) console.error("OAuth service mapping error:", serviceLinkErr.message);

    return {
      id: newPro.id,
      name: fullName,
      email: email,
      phone: "",
      city: "Gurugram",
      role: "professional"
    };
  }
}

async function getOAuthSignInUrl(role, originUrl = null) {
  const authClient = getAuthClient();
  const base = originUrl || process.env.APP_URL || "https://svpersonnel.in";
  const cleanBase = base.replace(/\/$/, "");
  const { data, error } = await authClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${cleanBase}/auth/callback?role=${role}`
    }
  });
  if (error) throw error;
  return data.url;
}

async function exchangeAccessToken(accessToken, refreshToken, requestedRole = "client") {
  const authClient = getAuthClient();
  const dbClient = getClient();

  const { data, error } = await authClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || ""
  });
  if (error) throw error;

  const email = data.user?.email;
  if (!email) throw new Error("Email not found in verification metadata.");

  // Check clients
  const { data: clientRow } = await dbClient.from("clients").select("*").eq("email", email).maybeSingle();
  if (clientRow) {
    if (!clientRow.supabase_uid && data.user?.id) {
      await dbClient.from("clients").update({ supabase_uid: data.user.id }).eq("id", clientRow.id);
    }
    return {
      id: clientRow.id,
      name: clientRow.full_name,
      email: clientRow.email,
      phone: clientRow.phone,
      city: clientRow.city,
      role: "client"
    };
  }

  // Check professionals
  const { data: proRow } = await dbClient.from("professionals").select("*").eq("email", email).maybeSingle();
  if (proRow) {
    if (!proRow.supabase_uid && data.user?.id) {
      await dbClient.from("professionals").update({ supabase_uid: data.user.id }).eq("id", proRow.id);
    }
    return {
      id: proRow.id,
      name: proRow.full_name,
      email: proRow.email,
      phone: proRow.phone,
      city: proRow.city,
      role: "professional"
    };
  }

  // Auto-signup if profile not found!
  const fullName = data.user?.user_metadata?.full_name || data.user?.user_metadata?.name || "Google User";
  const supabaseUid = data.user?.id || null;

  if (requestedRole === "client") {
    const { data: newClient, error: clientErr } = await dbClient
      .from("clients")
      .insert({
        supabase_uid: supabaseUid,
        full_name: fullName,
        email: email,
        phone: data.user?.user_metadata?.phone || "G_" + (supabaseUid || Date.now()),
        password_hash: "",
        city: "Gurugram"
      })
      .select("id")
      .single();

    if (clientErr) throw clientErr;

    return {
      id: newClient.id,
      name: fullName,
      email: email,
      phone: "",
      city: "Gurugram",
      role: "client"
    };
  } else {
    // Register as professional
    const { data: newPro, error: proErr } = await dbClient
      .from("professionals")
      .insert({
        supabase_uid: supabaseUid,
        full_name: fullName,
        email: email,
        phone: data.user?.user_metadata?.phone || "G_" + (supabaseUid || Date.now()),
        password_hash: "",
        city: "Gurugram",
        area: "Main",
        years_experience: 0,
        hourly_rate_inr: 0,
        bio: null,
        is_verified: false
      })
      .select("id")
      .single();

    if (proErr) throw proErr;

    // Map a default category (ID 1: Plumbing) so profile directory views don't break
    const { error: serviceLinkErr } = await dbClient.from("professional_services").insert({
      professional_id: newPro.id,
      service_id: 1,
      custom_rate_inr: 0
    });
    if (serviceLinkErr) console.error("OAuth service mapping error:", serviceLinkErr.message);

    return {
      id: newPro.id,
      name: fullName,
      email: email,
      phone: "",
      city: "Gurugram",
      role: "professional"
    };
  }
}

async function getClientProfile(clientId) {
  const client = getClient();
  const { data, error } = await client
    .from("clients")
    .select("id, full_name, email, phone, city, created_at")
    .eq("id", clientId)
    .maybeSingle();
  throwOnError(error);
  if (!data) return null;
  const phoneVal = (data.phone || "").startsWith("G_") ? "" : (data.phone || "");
  return {
    id: data.id,
    name: data.full_name,
    email: data.email,
    phone: phoneVal,
    city: data.city,
    createdAt: data.created_at
  };
}

async function updateClientProfile(clientId, profileData) {
  const client = getClient();
  const updatePayload = {
    full_name: profileData.fullName,
    phone: profileData.phone,
    city: profileData.city,
    area: profileData.area || "",
    address: profileData.address || "",
    pincode: profileData.pincode || "",
    username: profileData.username || ""
  };
  const { error } = await client
    .from("clients")
    .update(updatePayload)
    .eq("id", clientId);
  if (error) {
    if (error.message && (error.message.includes("schema cache") || error.message.includes("does not exist") || error.message.includes("column"))) {
      const list = await getLocalClients();
      const idx = list.findIndex(c => c.id === Number(clientId));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updatePayload };
        await saveLocalClients(list);
      }
      return true;
    }
    throwOnError(error);
  }
  return true;
}

async function getAdminProfile(adminId) {
  const client = getClient();
  const { data, error } = await client
    .from("admins")
    .select("id, full_name, email, created_at")
    .eq("id", adminId)
    .maybeSingle();
  throwOnError(error);
  if (!data) return null;
  return {
    id: data.id,
    name: data.full_name,
    email: data.email,
    createdAt: data.created_at
  };
}

async function updateAdminProfile(adminId, profileData) {
  const client = getClient();
  const updatePayload = {
    full_name: profileData.fullName,
    email: profileData.email
  };
  const { error } = await client
    .from("admins")
    .update(updatePayload)
    .eq("id", adminId);
  throwOnError(error);
  return true;
}

async function changeAdminPassword(adminId, newPassword) {
  const client = getClient();
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error } = await client
    .from("admins")
    .update({ password_hash: passwordHash })
    .eq("id", adminId);
  throwOnError(error);
  return true;
}

async function updateProfessionalServices(professionalId, serviceIds, customRates = null) {
  const client = getClient();
  
  // Delete existing service mappings
  const { error: deleteError } = await client
    .from("professional_services")
    .delete()
    .eq("professional_id", professionalId);
  throwOnError(deleteError);

  if (serviceIds && serviceIds.length) {
    for (const serviceId of serviceIds) {
      let rateVal = null;
      if (customRates && typeof customRates === "object" && !Array.isArray(customRates)) {
        rateVal = customRates[serviceId] !== undefined && customRates[serviceId] !== "" ? Number(customRates[serviceId]) : null;
      } else if (typeof customRates === "number" && !isNaN(customRates) && customRates > 0) {
        rateVal = customRates;
      }
      const { error: insertError } = await client
        .from("professional_services")
        .insert({
          professional_id: professionalId,
          service_id: Number(serviceId),
          custom_rate_inr: rateVal
        });
      throwOnError(insertError);
    }
  }
  return true;
}

async function getProfessionalProfile(professionalId) {
  const client = getClient();
  const { data, error } = await client
    .from("professionals")
    .select("id, full_name, email, phone, city, area, years_experience, hourly_rate_inr, photo_url, bio, is_verified, rating_avg, total_reviews, created_at, aadhaar_pan_url, live_photo_url, daily_rate_inr, project_rate_inr, languages, working_radius_km, bank_name, bank_account_no, bank_ifsc, upi_handle, pan_number, gst_number, portfolio_images, portfolio_videos, certificates_urls")
    .eq("id", professionalId)
    .maybeSingle();
  throwOnError(error);
  if (!data) return null;
  const phoneVal = (data.phone || "").startsWith("G_") ? "" : (data.phone || "");
  const descVal = data.bio === "Registered with Google OAuth" ? "" : (data.bio || "");
  const meta = parseProfessionalMetadata(descVal, data.hourly_rate_inr, 0);
  return {
    id: data.id,
    name: data.full_name,
    email: data.email,
    phone: phoneVal,
    city: data.city,
    area: data.area,
    experience: data.years_experience,
    hourlyRateInr: data.hourly_rate_inr || meta.partTimeRate,
    photo: data.photo_url || DEFAULT_PHOTO,
    description: meta.cleanBio || descVal,
    workModes: meta.workModes,
    partTimeRate: data.daily_rate_inr || data.hourly_rate_inr || meta.partTimeRate,
    fullTimeRate: data.project_rate_inr || meta.fullTimeRate,
    isVerified: data.is_verified,
    ratings: Number(data.rating_avg || 0),
    totalReviews: Number(data.total_reviews || 0),
    createdAt: data.created_at,
    aadhaarPanUrl: data.aadhaar_pan_url || meta.aadhaarPanUrl || "",
    livePhotoUrl: data.live_photo_url || meta.livePhotoUrl || "",
    dailyRateInr: data.daily_rate_inr || 0,
    projectRateInr: data.project_rate_inr || 0,
    languages: data.languages || "",
    workingRadiusKm: data.working_radius_km || 10,
    bankName: data.bank_name || "",
    bankAccountNo: data.bank_account_no || "",
    bankIfsc: data.bank_ifsc || "",
    upiHandle: data.upi_handle || "",
    panNumber: data.pan_number || "",
    gstNumber: data.gst_number || "",
    portfolioImages: data.portfolio_images || [],
    portfolioVideos: data.portfolio_videos || [],
    certificatesUrls: data.certificates_urls || []
  };
}

// --- PARTNERS, WALLET & JOB POSTINGS UPGRADES ---

async function getLocalProfessionals() {
  try { return JSON.parse(await fs.readFile(DATA_PROFESSIONALS_FILE, "utf8") || "[]"); } catch (e) { return []; }
}
async function saveLocalProfessionals(list) {
  try { await fs.writeFile(DATA_PROFESSIONALS_FILE, JSON.stringify(list, null, 2), "utf8"); } catch (e) {}
}
async function getLocalBookings() {
  try { return JSON.parse(await fs.readFile(DATA_BOOKINGS_FILE, "utf8") || "[]"); } catch (e) { return []; }
}
async function saveLocalBookings(list) {
  try { await fs.writeFile(DATA_BOOKINGS_FILE, JSON.stringify(list, null, 2), "utf8"); } catch (e) {}
}
async function getLocalClients() {
  try { return JSON.parse(await fs.readFile(DATA_CLIENTS_FILE, "utf8") || "[]"); } catch (e) { return []; }
}
async function saveLocalClients(list) {
  try { await fs.writeFile(DATA_CLIENTS_FILE, JSON.stringify(list, null, 2), "utf8"); } catch (e) {}
}

async function getLocalPartners() {
  try { return JSON.parse(await fs.readFile(DATA_PARTNERS_FILE, "utf8") || "[]"); } catch (e) { return []; }
}
async function saveLocalPartners(list) {
  try { await fs.writeFile(DATA_PARTNERS_FILE, JSON.stringify(list, null, 2), "utf8"); } catch (e) {}
}
async function getLocalWallets() {
  try { return JSON.parse(await fs.readFile(DATA_WALLETS_FILE, "utf8") || "[]"); } catch (e) { return []; }
}
async function saveLocalWallets(list) {
  try { await fs.writeFile(DATA_WALLETS_FILE, JSON.stringify(list, null, 2), "utf8"); } catch (e) {}
}
async function getLocalEarnings() {
  try { return JSON.parse(await fs.readFile(DATA_EARNINGS_FILE, "utf8") || "[]"); } catch (e) { return []; }
}
async function saveLocalEarnings(list) {
  try { await fs.writeFile(DATA_EARNINGS_FILE, JSON.stringify(list, null, 2), "utf8"); } catch (e) {}
}
async function getLocalWithdrawals() {
  try { return JSON.parse(await fs.readFile(DATA_WITHDRAWALS_FILE, "utf8") || "[]"); } catch (e) { return []; }
}
async function saveLocalWithdrawals(list) {
  try { await fs.writeFile(DATA_WITHDRAWALS_FILE, JSON.stringify(list, null, 2), "utf8"); } catch (e) {}
}
async function getLocalWorkRequirements() {
  try { return JSON.parse(await fs.readFile(DATA_WORK_REQUIREMENTS_FILE, "utf8") || "[]"); } catch (e) { return []; }
}
async function saveLocalWorkRequirements(list) {
  try { await fs.writeFile(DATA_WORK_REQUIREMENTS_FILE, JSON.stringify(list, null, 2), "utf8"); } catch (e) {}
}

async function createPartnerAccount(data) {
  const dbClient = getClient();
  const passwordHash = await bcrypt.hash(data.password, 10);
  const newPartner = {
    id: Date.now(),
    username: data.username,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    password_hash: passwordHash,
    business_name: data.businessName,
    city: data.city,
    area: data.area || "",
    is_verified: false,
    created_at: new Date().toISOString()
  };

  try {
    if (dbClient) {
      const { data: row, error } = await dbClient
        .from("partners")
        .insert({
          username: data.username,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          password_hash: passwordHash,
          business_name: data.businessName,
          city: data.city,
          area: data.area || ""
        })
        .select("id")
        .single();
      if (!error && row) {
        newPartner.id = row.id;
        const local = await getLocalPartners();
        local.push(newPartner);
        await saveLocalPartners(local);
        return { id: row.id, ...data, role: "partner" };
      }
    }
  } catch (e) {}

  const local = await getLocalPartners();
  if (local.some(p => p.email === data.email || p.username === data.username)) {
    throw new Error("Partner with this email or username already exists.");
  }
  local.push(newPartner);
  await saveLocalPartners(local);
  return { id: newPartner.id, ...data, role: "partner" };
}

async function authenticatePartner(login, password) {
  const dbClient = getClient();
  const input = String(login).trim();
  let row = null;

  try {
    if (dbClient) {
      let query = dbClient.from("partners").select("*");
      if (input.includes("@")) {
        query = query.eq("email", input.toLowerCase());
      } else if (input.match(/^\+?[0-9\-\s]{10,20}$/)) {
        query = query.eq("phone", input);
      } else {
        query = query.eq("username", input);
      }
      const { data } = await query.maybeSingle();
      if (data) row = data;
    }
  } catch (e) {}

  if (!row) {
    const local = await getLocalPartners();
    row = local.find(p => p.email === input.toLowerCase() || p.username === input || p.phone === input);
  }

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    throw new Error("Incorrect login or password.");
  }
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    username: row.username,
    isVerified: row.is_verified,
    role: "partner"
  };
}

async function getPartnerDashboardData(partnerId) {
  const nid = Number(partnerId);
  const client = getClient();
  let partner = null;

  try {
    if (client) {
      const { data } = await client.from("partners").select("*").eq("id", nid).maybeSingle();
      if (data) partner = data;
    }
  } catch (e) {}

  if (!partner) {
    const localPartners = await getLocalPartners();
    partner = localPartners.find(p => Number(p.id) === nid);
  }

  if (!partner) {
    throw new Error("Partner account not found.");
  }

  let wallet = await getWalletBalance("partner", nid);

  let pros = [];
  try {
    if (client) {
      const { data } = await client.from("professionals").select("*").eq("partner_id", nid);
      if (data) pros = data;
    }
  } catch (e) {}

  if (!pros.length) {
    const localPros = await getLocalProfessionals();
    pros = localPros.filter(p => Number(p.partner_id) === nid);
  }

  const withdrawals = await getWithdrawals("partner", nid);

  let bookings = [];
  if (pros && pros.length > 0) {
    const proIds = pros.map(p => Number(p.id));
    try {
      if (client) {
        const { data: bookingsData } = await client
          .from("bookings")
          .select(`
            id,
            booking_code,
            status,
            preferred_date,
            preferred_time_slot,
            budget_inr,
            details,
            created_at,
            professional_id,
            services (name),
            clients (full_name, email, phone)
          `)
          .in("professional_id", proIds)
          .order("created_at", { ascending: false });
        if (bookingsData) bookings = bookingsData;
      }
    } catch (e) {}

    if (!bookings.length) {
      const localBookings = await getLocalBookings();
      bookings = localBookings.filter(b => proIds.includes(Number(b.professional_id)));
    }
  }

  return {
    partner,
    wallet,
    professionals: pros || [],
    withdrawals: withdrawals || [],
    bookings
  };
}

async function createPartnerManagedProfessional(partnerId, data) {
  const nid = Number(partnerId);
  const dbClient = getClient();
  const passwordHash = await bcrypt.hash(data.password, 10);

  const finalEmail = (data.email && data.email.trim())
    ? data.email.trim().toLowerCase()
    : `${(data.username || "staff").trim().toLowerCase()}_${Date.now()}@agency.internal`;

  const workModes = (Array.isArray(data.workSchedule) && data.workSchedule.length)
    ? data.workSchedule
    : ["Part Time", "Full Time"];

  let ptRate = Number(data.partTimeRate) || 0;
  let ftRate = Number(data.fullTimeRate) || 0;

  let assignedList = Array.isArray(data.assignedSkills) ? data.assignedSkills : [];
  let allSubskills = Array.isArray(data.selectedSubskills) ? [...data.selectedSubskills] : [];
  let sIds = Array.isArray(data.serviceIds) ? [...data.serviceIds] : [];

  if (assignedList.length > 0) {
    assignedList.forEach(item => {
      if (item.categoryId && !sIds.includes(Number(item.categoryId))) sIds.push(Number(item.categoryId));
      if (Array.isArray(item.subskills)) {
        item.subskills.forEach(sub => {
          if (!allSubskills.includes(sub)) allSubskills.push(sub);
        });
      }
      if (!ptRate && Number(item.rate) > 0) ptRate = Number(item.rate);
    });
  }

  if (!ptRate) ptRate = 500;
  if (!ftRate) ftRate = ptRate * 25;

  const bioTags = `[Partner Managed Professional] [workModes:${workModes.join(",")}] [partTimeRate:${ptRate}] [fullTimeRate:${ftRate}]${allSubskills.length ? ` [subskills:${allSubskills.join(", ")}]` : ""}${assignedList.length ? ` [assignedSkillsJson:${JSON.stringify(assignedList)}]` : ""}`;

  const newPro = {
    id: Date.now(),
    full_name: data.fullName,
    email: finalEmail,
    phone: data.phone,
    password_hash: passwordHash,
    city: data.city,
    area: data.area || "",
    username: data.username,
    years_experience: Number(data.experience) || 0,
    photo_url: DEFAULT_PHOTO,
    bio: bioTags,
    partner_id: nid,
    is_partner_managed: true,
    is_verified: true,
    onboarding_complete: true,
    created_at: new Date().toISOString()
  };

  try {
    if (dbClient) {
      const { data: row, error } = await dbClient.from("professionals").insert({
        full_name: newPro.full_name,
        email: newPro.email,
        phone: newPro.phone,
        password_hash: newPro.password_hash,
        city: newPro.city,
        area: newPro.area,
        username: newPro.username,
        years_experience: newPro.years_experience,
        photo_url: newPro.photo_url,
        bio: newPro.bio,
        partner_id: newPro.partner_id,
        is_partner_managed: true,
        is_verified: true,
        onboarding_complete: true
      }).select("id").single();

      if (!error && row) {
        newPro.id = row.id;
        if (assignedList.length > 0) {
          for (const item of assignedList) {
            await dbClient.from("professional_services").insert({
              professional_id: row.id,
              service_id: Number(item.categoryId),
              custom_rate_inr: Number(item.rate) || ptRate
            });
          }
        } else if (sIds && sIds.length > 0) {
          for (const serviceId of sIds) {
            await dbClient.from("professional_services").insert({
              professional_id: row.id,
              service_id: Number(serviceId),
              custom_rate_inr: ptRate
            });
          }
        }
      }
    }
  } catch (e) {}

  const local = await getLocalProfessionals();
  local.push(newPro);
  await saveLocalProfessionals(local);
  return newPro.id;
}

async function getWalletBalance(ownerType, ownerId) {
  const nid = Number(ownerId);
  const client = getClient();
  let wallet = null;

  try {
    if (client) {
      const { data } = await client.from("wallet_balances").select("*").eq("owner_type", ownerType).eq("owner_id", nid).maybeSingle();
      if (data) wallet = data;
    }
  } catch (e) {}

  if (!wallet) {
    const localWallets = await getLocalWallets();
    wallet = localWallets.find(w => w.owner_type === ownerType && Number(w.owner_id) === nid);
  }

  if (wallet) return wallet;

  const newWallet = {
    id: Date.now(),
    owner_type: ownerType,
    owner_id: nid,
    available_inr: 0,
    pending_inr: 0,
    total_earned_inr: 0,
    created_at: new Date().toISOString()
  };

  try {
    if (client) {
      const { data } = await client.from("wallet_balances").insert({
        owner_type: newWallet.owner_type,
        owner_id: newWallet.owner_id,
        available_inr: 0,
        pending_inr: 0,
        total_earned_inr: 0
      }).select("*").single();
      if (data) {
        newWallet.id = data.id;
      }
    }
  } catch (e) {}

  const localWallets = await getLocalWallets();
  localWallets.push(newWallet);
  await saveLocalWallets(localWallets);
  return newWallet;
}

async function addEarningRecord(bookingId, professionalId, grossAmount) {
  const client = getClient();
  const gross = Number(grossAmount) || 0;
  const platformFee = Math.round(gross * 0.15);
  const net = gross - platformFee;
  const nid = Number(professionalId);

  let pro = null;
  try {
    if (client) {
      const { data } = await client.from("professionals").select("partner_id, is_partner_managed").eq("id", nid).maybeSingle();
      if (data) pro = data;
    }
  } catch (e) {}

  if (!pro) {
    const localPros = await getLocalProfessionals();
    pro = localPros.find(p => Number(p.id) === nid);
  }

  let recipientType = "professional";
  let recipientId = nid;
  if (pro && pro.is_partner_managed && pro.partner_id) {
    recipientType = "partner";
    recipientId = Number(pro.partner_id);
  }

  const newEarning = {
    id: Date.now(),
    booking_id: Number(bookingId),
    professional_id: nid,
    partner_id: pro && pro.is_partner_managed ? Number(pro.partner_id) : null,
    gross_amount_inr: gross,
    platform_fee_inr: platformFee,
    net_amount_inr: net,
    recipient_type: recipientType,
    recipient_id: recipientId,
    created_at: new Date().toISOString()
  };

  try {
    if (client) {
      await client.from("earnings").insert({
        booking_id: newEarning.booking_id,
        professional_id: newEarning.professional_id,
        partner_id: newEarning.partner_id,
        gross_amount_inr: newEarning.gross_amount_inr,
        platform_fee_inr: newEarning.platform_fee_inr,
        net_amount_inr: newEarning.net_amount_inr,
        recipient_type: newEarning.recipient_type,
        recipient_id: newEarning.recipient_id
      });
    }
  } catch (e) {}

  const localEarnings = await getLocalEarnings();
  localEarnings.push(newEarning);
  await saveLocalEarnings(localEarnings);

  const platformWallet = await getWalletBalance("platform", 1);
  try {
    if (client) {
      await client.from("wallet_balances").update({
        available_inr: platformWallet.available_inr + platformFee,
        total_earned_inr: platformWallet.total_earned_inr + platformFee,
        updated_at: new Date().toISOString()
      }).eq("id", platformWallet.id);
    }
  } catch (e) {}
  const localWallets = await getLocalWallets();
  const pIdx = localWallets.findIndex(w => w.owner_type === "platform" && Number(w.owner_id) === 1);
  if (pIdx !== -1) {
    localWallets[pIdx].available_inr += platformFee;
    localWallets[pIdx].total_earned_inr += platformFee;
    await saveLocalWallets(localWallets);
  }

  const recipientWallet = await getWalletBalance(recipientType, recipientId);
  try {
    if (client) {
      await client.from("wallet_balances").update({
        available_inr: recipientWallet.available_inr + net,
        total_earned_inr: recipientWallet.total_earned_inr + net,
        updated_at: new Date().toISOString()
      }).eq("id", recipientWallet.id);
    }
  } catch (e) {}
  const rIdx = localWallets.findIndex(w => w.owner_type === recipientType && Number(w.owner_id) === Number(recipientId));
  if (rIdx !== -1) {
    localWallets[rIdx].available_inr += net;
    localWallets[rIdx].total_earned_inr += net;
    await saveLocalWallets(localWallets);
  }
}

async function requestWithdrawal(ownerType, ownerId, amount, bankDetails) {
  const client = getClient();
  const withdrawAmount = Number(amount) || 0;
  const nid = Number(ownerId);

  const withdrawals = await getWithdrawals(ownerType, nid);
  const lastW = withdrawals[0];

  if (lastW && lastW.created_at) {
    const diffMs = new Date() - new Date(lastW.created_at);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 7) {
      const remainingDays = Math.ceil(7 - diffDays);
      throw new Error(`You can only request a withdrawal once a week. Please wait ${remainingDays} more day(s) before requesting.`);
    }
  }

  const wallet = await getWalletBalance(ownerType, nid);
  if (wallet.available_inr < withdrawAmount) {
    throw new Error(`Insufficient wallet balance. You only have ₹${wallet.available_inr} available.`);
  }

  const newWithdrawal = {
    id: Date.now(),
    owner_type: ownerType,
    owner_id: nid,
    amount_inr: withdrawAmount,
    bank_details: bankDetails,
    status: "pending",
    created_at: new Date().toISOString()
  };

  try {
    if (client) {
      await client.from("withdrawals").insert({
        owner_type: ownerType,
        owner_id: nid,
        amount_inr: withdrawAmount,
        bank_details: bankDetails,
        status: "pending"
      });
    }
  } catch (e) {}

  const localW = await getLocalWithdrawals();
  localW.push(newWithdrawal);
  await saveLocalWithdrawals(localW);

  try {
    if (client) {
      await client.from("wallet_balances").update({
        available_inr: wallet.available_inr - withdrawAmount,
        pending_inr: wallet.pending_inr + withdrawAmount,
        updated_at: new Date().toISOString()
      }).eq("id", wallet.id);
    }
  } catch (e) {}

  const localWallets = await getLocalWallets();
  const wIdx = localWallets.findIndex(w => w.owner_type === ownerType && Number(w.owner_id) === nid);
  if (wIdx !== -1) {
    localWallets[wIdx].available_inr -= withdrawAmount;
    localWallets[wIdx].pending_inr += withdrawAmount;
    await saveLocalWallets(localWallets);
  }
}

async function getWithdrawals(ownerType, ownerId) {
  const nid = Number(ownerId);
  const client = getClient();
  let list = [];

  try {
    if (client) {
      const { data } = await client.from("withdrawals").select("*").eq("owner_type", ownerType).eq("owner_id", nid).order("created_at", { ascending: false });
      if (data && data.length > 0) list = data;
    }
  } catch (e) {}

  if (!list.length) {
    const local = await getLocalWithdrawals();
    list = local.filter(w => w.owner_type === ownerType && Number(w.owner_id) === nid).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return list;
}

async function getEarnings(ownerType, ownerId) {
  const nid = Number(ownerId);
  const client = getClient();
  const colName = ownerType === "partner" ? "partner_id" : "professional_id";
  let list = [];

  try {
    if (client) {
      const { data } = await client.from("earnings").select("*, bookings(booking_code)").eq(colName, nid).order("created_at", { ascending: false });
      if (data && data.length > 0) list = data;
    }
  } catch (e) {}

  if (!list.length) {
    const local = await getLocalEarnings();
    list = local.filter(e => Number(e[colName]) === nid).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return list;
}

async function createWorkRequirement(clientId, data) {
  const nid = Number(clientId);
  const client = getClient();
  const newReq = {
    id: Date.now(),
    client_id: nid,
    client_name: data.clientName,
    client_contact: data.clientContact,
    category: data.category,
    sub_category: data.subCategory || "",
    location: data.location,
    budget_inr: Number(data.budget) || 0,
    job_type: data.jobType || "Full Time",
    description: data.description || "",
    status: "open",
    created_at: new Date().toISOString()
  };

  try {
    if (client) {
      await client.from("work_requirements").insert({
        client_id: newReq.client_id,
        client_name: newReq.client_name,
        client_contact: newReq.client_contact,
        category: newReq.category,
        sub_category: newReq.sub_category,
        location: newReq.location,
        budget_inr: newReq.budget_inr,
        job_type: newReq.job_type,
        description: newReq.description,
        status: "open"
      });
    }
  } catch (e) {}

  const localReqs = await getLocalWorkRequirements();
  localReqs.push(newReq);
  await saveLocalWorkRequirements(localReqs);
  return newReq;
}

async function getOpenWorkRequirements(category) {
  const client = getClient();
  let list = [];

  try {
    if (client) {
      let query = client.from("work_requirements").select("*").eq("status", "open");
      if (category) query = query.eq("category", category);
      const { data } = await query.order("created_at", { ascending: false });
      if (data && data.length > 0) list = data;
    }
  } catch (e) {}

  if (!list.length) {
    const local = await getLocalWorkRequirements();
    list = local.filter(r => r.status === "open" && (!category || r.category === category)).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return list;
}

async function getWorkRequirementsByClient(clientId) {
  const nid = Number(clientId);
  const client = getClient();
  let list = [];

  try {
    if (client) {
      const { data } = await client.from("work_requirements").select("*").eq("client_id", nid).order("created_at", { ascending: false });
      if (data && data.length > 0) list = data;
    }
  } catch (e) {}

  if (!list.length) {
    const local = await getLocalWorkRequirements();
    list = local.filter(r => Number(r.client_id) === nid).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return list;
}

async function verifyPartner(partnerId, isVerified) {
  const nid = Number(partnerId);
  const client = getClient();
  try {
    if (client) {
      await client.from("partners").update({ is_verified: isVerified }).eq("id", nid);
    }
  } catch (e) {}

  const local = await getLocalPartners();
  const idx = local.findIndex(p => Number(p.id) === nid);
  if (idx !== -1) {
    local[idx].is_verified = isVerified;
    await saveLocalPartners(local);
  }
}

async function getAdminWithdrawals() {
  const client = getClient();
  let list = [];

  try {
    if (client) {
      const { data } = await client.from("withdrawals").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) list = data;
    }
  } catch (e) {}

  if (!list.length) {
    list = await getLocalWithdrawals();
  }
  return list;
}

async function approveWithdrawal(withdrawalId) {
  const nid = Number(withdrawalId);
  const client = getClient();
  let w = null;

  try {
    if (client) {
      const { data } = await client.from("withdrawals").select("*").eq("id", nid).maybeSingle();
      if (data) w = data;
    }
  } catch (e) {}

  if (!w) {
    const localW = await getLocalWithdrawals();
    w = localW.find(item => Number(item.id) === nid);
  }

  if (!w) throw new Error("Withdrawal request not found.");
  if (w.status !== "pending") throw new Error("Withdrawal request is already processed.");

  try {
    if (client) {
      await client.from("withdrawals").update({
        status: "completed",
        processed_at: new Date().toISOString()
      }).eq("id", nid);
    }
  } catch (e) {}

  const localW = await getLocalWithdrawals();
  const idx = localW.findIndex(item => Number(item.id) === nid);
  if (idx !== -1) {
    localW[idx].status = "completed";
    localW[idx].processed_at = new Date().toISOString();
    await saveLocalWithdrawals(localW);
  }

  const wallet = await getWalletBalance(w.owner_type, w.owner_id);
  try {
    if (client) {
      await client.from("wallet_balances").update({
        pending_inr: Math.max(0, wallet.pending_inr - w.amount_inr),
        updated_at: new Date().toISOString()
      }).eq("id", wallet.id);
    }
  } catch (e) {}

  const localWallets = await getLocalWallets();
  const wIdx = localWallets.findIndex(item => item.owner_type === w.owner_type && Number(item.owner_id) === Number(w.owner_id));
  if (wIdx !== -1) {
    localWallets[wIdx].pending_inr = Math.max(0, localWallets[wIdx].pending_inr - w.amount_inr);
    await saveLocalWallets(localWallets);
  }
}



async function getLocalChats() {
  try {
    const raw = await fs.readFile(DATA_CHAT_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    return [];
  }
}

async function saveLocalChats(list) {
  try {
    await fs.writeFile(DATA_CHAT_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save local chats:", err.message);
  }
}

async function saveChatMessage(senderRole, senderId, receiverRole, receiverId, message, imageUrl = null) {
  const newMsg = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    sender_role: senderRole,
    sender_id: Number(senderId),
    receiver_role: receiverRole,
    receiver_id: Number(receiverId),
    message: message,
    image_url: imageUrl,
    is_read: false,
    created_at: new Date().toISOString()
  };

  try {
    const client = getClient();
    if (client) {
      const { data, error } = await client
        .from("chat_messages")
        .insert(newMsg)
        .select()
        .maybeSingle();
      if (!error && data) {
        const local = await getLocalChats();
        local.push(data);
        await saveLocalChats(local);
        return data;
      }
    }
  } catch (e) {
    // Ignore and fallback
  }

  const local = await getLocalChats();
  local.push(newMsg);
  await saveLocalChats(local);
  return newMsg;
}

async function getChatHistory(roleA, idA, roleB, idB) {
  const nidA = Number(idA);
  const nidB = Number(idB);

  try {
    const client = getClient();
    if (client) {
      const { data, error } = await client
        .from("chat_messages")
        .select("*")
        .or(`and(sender_role.eq.${roleA},sender_id.eq.${nidA},receiver_role.eq.${roleB},receiver_id.eq.${nidB}),and(sender_role.eq.${roleB},sender_id.eq.${nidB},receiver_role.eq.${roleA},receiver_id.eq.${nidA})`)
        .order("created_at", { ascending: true });
      if (!error && data) {
        return data;
      }
    }
  } catch (e) {
    // Fallback
  }

  const local = await getLocalChats();
  return local.filter(m => 
    (m.sender_role === roleA && m.sender_id === nidA && m.receiver_role === roleB && m.receiver_id === nidB) ||
    (m.sender_role === roleB && m.sender_id === nidB && m.receiver_role === roleA && m.receiver_id === nidA)
  ).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
}

async function markChatAsRead(roleA, idA, roleB, idB) {
  const nidA = Number(idA); // receiver
  const nidB = Number(idB); // sender

  try {
    const client = getClient();
    if (client) {
      await client
        .from("chat_messages")
        .update({ is_read: true })
        .eq("sender_role", roleB)
        .eq("sender_id", nidB)
        .eq("receiver_role", roleA)
        .eq("receiver_id", nidA);
    }
  } catch (e) {
    // Fallback
  }

  const local = await getLocalChats();
  local.forEach(m => {
    if (m.sender_role === roleB && m.sender_id === nidB && m.receiver_role === roleA && m.receiver_id === nidA) {
      m.is_read = true;
    }
  });
  await saveLocalChats(local);
  return true;
}

async function getUnreadChatCount(role, id) {
  const nid = Number(id);

  try {
    const client = getClient();
    if (client) {
      const { data, error } = await client
        .from("chat_messages")
        .select("*")
        .eq("receiver_role", role)
        .eq("receiver_id", nid)
        .eq("is_read", false);
      if (!error && data) {
        const counts = {};
        data.forEach(m => {
          const key = `${m.sender_role}_${m.sender_id}`;
          counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
      }
    }
  } catch (e) {
    // Fallback
  }

  const local = await getLocalChats();
  const unread = local.filter(m => m.receiver_role === role && m.receiver_id === nid && !m.is_read);
  const counts = {};
  unread.forEach(m => {
    const key = `${m.sender_role}_${m.sender_id}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

// --- PHASE 4: EXTENDED ADMIN DASHBOARD HELPER FUNCTIONS ---

// 1. Disputes Helpers
async function getLocalDisputes() {
  try {
    const raw = await fs.readFile(DATA_DISPUTES_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    return [];
  }
}

async function saveLocalDisputes(list) {
  try {
    await fs.writeFile(DATA_DISPUTES_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save local disputes:", err.message);
  }
}

async function resolveDispute(disputeId, action, adminNotes = "", refundAmount = 0) {
  const nid = Number(disputeId);
  const status = action === "refund" ? "resolved_refunded" : "dismissed";
  const now = new Date().toISOString();

  try {
    const client = getClient();
    if (client) {
      const { data: dispute } = await client.from("disputes").select("*").eq("id", nid).maybeSingle();
      if (dispute) {
        await client.from("disputes").update({
          status,
          admin_notes: adminNotes,
          refund_amount_inr: Number(refundAmount) || 0,
          resolved_at: now
        }).eq("id", nid);

        const bookingStatus = action === "refund" ? "cancelled" : "confirmed";
        await client.from("bookings").update({
          status: bookingStatus,
          details: `[Dispute Resolved by Admin: ${status.toUpperCase()}] ${adminNotes}`
        }).eq("id", dispute.booking_id);

        return true;
      }
    }
  } catch (e) {}

  const local = await getLocalDisputes();
  const index = local.findIndex(d => Number(d.id) === nid);
  if (index !== -1) {
    local[index].status = status;
    local[index].admin_notes = adminNotes;
    local[index].refund_amount_inr = Number(refundAmount) || 0;
    local[index].resolved_at = now;
    await saveLocalDisputes(local);
  }
  return true;
}

// 2. Coupons Helpers
async function getLocalCoupons() {
  try {
    const raw = await fs.readFile(DATA_COUPONS_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    return [];
  }
}

async function saveLocalCoupons(list) {
  try {
    await fs.writeFile(DATA_COUPONS_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save local coupons:", err.message);
  }
}

async function createCoupon({ code, discount_type, discount_value, min_booking_amount_inr, max_discount_inr, is_active, expiry_date }) {
  const newCoupon = {
    id: Date.now(),
    code: code.trim().toUpperCase(),
    discount_type: discount_type || "percentage",
    discount_value: Number(discount_value) || 10,
    min_booking_amount_inr: Number(min_booking_amount_inr) || 0,
    max_discount_inr: Number(max_discount_inr) || 0,
    is_active: is_active !== false,
    expiry_date: expiry_date || null,
    created_at: new Date().toISOString()
  };

  try {
    const client = getClient();
    if (client) {
      const { data, error } = await client.from("coupons").insert({
        code: newCoupon.code,
        discount_type: newCoupon.discount_type,
        discount_value: newCoupon.discount_value,
        min_booking_amount_inr: newCoupon.min_booking_amount_inr,
        max_discount_inr: newCoupon.max_discount_inr,
        is_active: newCoupon.is_active,
        expiry_date: newCoupon.expiry_date
      }).select().maybeSingle();
      if (!error && data) {
        const local = await getLocalCoupons();
        local.push(data);
        await saveLocalCoupons(local);
        return data;
      }
    }
  } catch (e) {}

  const local = await getLocalCoupons();
  local.push(newCoupon);
  await saveLocalCoupons(local);
  return newCoupon;
}

async function toggleCoupon(couponId, isActive) {
  const nid = Number(couponId);
  try {
    const client = getClient();
    if (client) {
      await client.from("coupons").update({ is_active: Boolean(isActive) }).eq("id", nid);
    }
  } catch (e) {}

  const local = await getLocalCoupons();
  const idx = local.findIndex(c => Number(c.id) === nid);
  if (idx !== -1) {
    local[idx].is_active = Boolean(isActive);
    await saveLocalCoupons(local);
  }
  return true;
}

async function deleteCoupon(couponId) {
  const nid = Number(couponId);
  try {
    const client = getClient();
    if (client) {
      await client.from("coupons").delete().eq("id", nid);
    }
  } catch (e) {}

  const local = await getLocalCoupons();
  const filtered = local.filter(c => Number(c.id) !== nid);
  await saveLocalCoupons(filtered);
  return true;
}

async function validateCoupon(code, bookingAmount = 0) {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) return { valid: false, message: "Please enter a coupon code." };

  let coupon = null;
  try {
    const client = getClient();
    if (client) {
      const { data } = await client.from("coupons").select("*").eq("code", cleanCode).maybeSingle();
      if (data) coupon = data;
    }
  } catch (e) {}

  if (!coupon) {
    const local = await getLocalCoupons();
    coupon = local.find(c => c.code.toUpperCase() === cleanCode);
  }

  if (!coupon) return { valid: false, message: "Invalid coupon code." };
  if (!coupon.is_active) return { valid: false, message: "This coupon is currently inactive or expired." };
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) return { valid: false, message: "This coupon has expired." };
  if (Number(bookingAmount) < Number(coupon.min_booking_amount_inr || 0)) {
    return { valid: false, message: `Minimum order amount of ₹${coupon.min_booking_amount_inr} required.` };
  }

  let discount = 0;
  if (coupon.discount_type === "flat") {
    discount = Number(coupon.discount_value || 0);
  } else {
    discount = Math.round((Number(bookingAmount) * Number(coupon.discount_value || 0)) / 100);
    if (coupon.max_discount_inr && Number(coupon.max_discount_inr) > 0 && discount > Number(coupon.max_discount_inr)) {
      discount = Number(coupon.max_discount_inr);
    }
  }

  return { valid: true, discountAmount: discount, coupon };
}

// 3. CMS Helpers
async function getLocalCmsSettings() {
  try {
    const raw = await fs.readFile(DATA_CMS_FILE, "utf8");
    return JSON.parse(raw || "{}");
  } catch (err) {
    return { announcementBanner: "Welcome to GigConnect - India's Verified Manpower & Service Portal!", announcementActive: true };
  }
}

async function saveLocalCmsSettings(data) {
  try {
    await fs.writeFile(DATA_CMS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save local CMS settings:", err.message);
  }
}

async function getMergedCmsSettings(dbRows = []) {
  const local = await getLocalCmsSettings();
  const merged = {
    announcementBanner: local.announcementBanner || "Welcome to GigConnect - India's Verified Manpower & Service Portal!",
    announcementActive: local.announcementActive !== false,
    heroTitle: local.heroTitle || "India's #1 Verified Manpower & Service Portal",
    heroSubtitle: local.heroSubtitle || "Hire verified security guards, hospital staff, corporate assistants, electricians, and tradesmen directly.",
    supportEmail: local.supportEmail || "support@svpersonnel.com",
    supportPhone: local.supportPhone || "+91 98765 43210"
  };

  if (Array.isArray(dbRows)) {
    dbRows.forEach(row => {
      if (row.key === "announcementBanner") merged.announcementBanner = row.content;
      if (row.key === "announcementActive") merged.announcementActive = row.content === "true";
      if (row.key === "heroTitle") merged.heroTitle = row.content;
      if (row.key === "heroSubtitle") merged.heroSubtitle = row.content;
      if (row.key === "supportEmail") merged.supportEmail = row.content;
      if (row.key === "supportPhone") merged.supportPhone = row.content;
    });
  }
  global.cmsSettingsCache = merged;
  return merged;
}

async function updateCmsSettings(updates = {}) {
  const local = await getLocalCmsSettings();
  const newSettings = { ...local, ...updates };
  global.cmsSettingsCache = newSettings;
  await saveLocalCmsSettings(newSettings);

  try {
    const client = getClient();
    if (client) {
      for (const [key, val] of Object.entries(updates)) {
        await client.from("cms_content").upsert({
          key,
          title: key,
          content: String(val),
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });
      }
    }
  } catch (e) {}

  return newSettings;
}

// 4. Dynamic Categories (Services) Helpers
async function getLocalServices() {
  try {
    const raw = await fs.readFile(DATA_SERVICES_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    return [];
  }
}

async function saveLocalServices(list) {
  try {
    await fs.writeFile(DATA_SERVICES_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save local services:", err.message);
  }
}

async function createServiceCategory({ name, slug, description, base_price_inr, icon_path }) {
  const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const newService = {
    id: Date.now(),
    name: name.trim(),
    slug: cleanSlug,
    description: description || "",
    base_price_inr: Number(base_price_inr) || 499,
    icon_path: icon_path || "/assets/driver.png",
    is_active: true
  };

  try {
    const client = getClient();
    if (client) {
      const { data, error } = await client.from("services").insert({
        name: newService.name,
        slug: newService.slug,
        description: newService.description,
        base_price_inr: newService.base_price_inr,
        icon_path: newService.icon_path,
        is_active: true
      }).select().maybeSingle();
      if (!error && data) {
        const local = await getLocalServices();
        local.push(data);
        await saveLocalServices(local);
        return data;
      }
    }
  } catch (e) {}

  const local = await getLocalServices();
  local.push(newService);
  await saveLocalServices(local);
  return newService;
}

async function updateServiceCategory(serviceId, { name, base_price_inr, is_active, description }) {
  const nid = Number(serviceId);
  const updates = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name.trim();
  if (base_price_inr !== undefined) updates.base_price_inr = Number(base_price_inr) || 0;
  if (is_active !== undefined) updates.is_active = Boolean(is_active);
  if (description !== undefined) updates.description = description.trim();

  try {
    const client = getClient();
    if (client) {
      await client.from("services").update(updates).eq("id", nid);
    }
  } catch (e) {}

  const local = await getLocalServices();
  const index = local.findIndex(s => Number(s.id) === nid);
  if (index !== -1) {
    local[index] = { ...local[index], ...updates };
    await saveLocalServices(local);
  }
  return true;
}

async function deleteServiceCategory(serviceId) {
  const nid = Number(serviceId);
  try {
    const client = getClient();
    if (client) {
      await client.from("services").update({ is_active: false }).eq("id", nid);
    }
  } catch (e) {}

  const local = await getLocalServices();
  const index = local.findIndex(s => Number(s.id) === nid);
  if (index !== -1) {
    local[index].is_active = false;
    await saveLocalServices(local);
  }
  return true;
}

module.exports = {
  dbState,
  initializeSupabase,
  isDatabaseReady,
  getServiceCatalog,
  getHomeStats,
  getFeaturedProfessionals,
  getTestimonials,
  searchProfessionals,
  getProfessionalById,
  getProfessionalServiceOptions,
  getClient,
  createContactMessage,
  createClientAccount,
  deleteClientAccount,
  authenticateClient,
  createProfessionalAccount,
  deleteProfessionalAccount,
  authenticateProfessional,
  createBooking,
  createClientReview,
  updateProfessionalBookingStatus,
  getClientDashboardData,
  getProfessionalDashboardData,
  getServiceOptions,
  normalizeProfessionalRow,
  authenticateAdmin,
  getAdminDashboardData,
  verifyProfessional,
  replyToSupportMessage,
  updateProfessionalProfile,
  resetUserPassword,
  exchangeAuthCode,
  getOAuthSignInUrl,
  exchangeAccessToken,
  getClientProfile,
  updateClientProfile,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  updateProfessionalServices,
  getProfessionalProfile,
  updateServicePrice,
  authenticateUnified,
  getContactMessagesByEmail,
  addCustomServiceOption,

  createPartnerAccount,
  authenticatePartner,
  getPartnerDashboardData,
  createPartnerManagedProfessional,
  getWalletBalance,
  addEarningRecord,
  requestWithdrawal,
  getWithdrawals,
  getEarnings,
  createWorkRequirement,
  getOpenWorkRequirements,
  getWorkRequirementsByClient,
  verifyPartner,
  getAdminWithdrawals,
  approveWithdrawal,

  saveChatMessage,
  getChatHistory,
  markChatAsRead,
  getUnreadChatCount,

  resolveDispute,
  createCoupon,
  toggleCoupon,
  deleteCoupon,
  validateCoupon,
  updateCmsSettings,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory
};
