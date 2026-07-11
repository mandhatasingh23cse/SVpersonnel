const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

const seedData = require("../data/mysqlSeed");

const DEFAULT_PHOTO = "/assets/gigconnect.logo.png";

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

  for (const service of seedData.services) {
    const { error } = await client.from("services").upsert(
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
    throwOnError(error, "Failed to seed services.");
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

  const [{ data: services, error: servicesError }, { data: links, error: linksError }] = await Promise.all([
    client.from("services").select("id, name, slug, icon_path, description, base_price_inr").eq("is_active", true),
    client.from("professional_services").select("service_id, professional_id, custom_rate_inr")
  ]);

  throwOnError(servicesError);
  throwOnError(linksError);

  const catalog = (services || []).map((service) => {
    const serviceLinks = (links || []).filter((link) => link.service_id === service.id);
    const professionalIds = new Set(serviceLinks.map((link) => link.professional_id));
    const startingPrices = serviceLinks.map((link) => link.custom_rate_inr ?? service.base_price_inr);

    return {
      id: Number(service.id),
      name: service.name,
      slug: service.slug,
      icon: service.icon_path,
      description: service.description,
      basePriceInr: Number(service.base_price_inr || 0),
      startingPriceInr: startingPrices.length ? Math.min(...startingPrices) : Number(service.base_price_inr || 0),
      professionalCount: professionalIds.size
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

  // 3. Insert profile row with supabase_uid
  const { data: row, error } = await dbClient
    .from("clients")
    .insert({
      supabase_uid: supabaseUid,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      password_hash: passwordHash,
      city: data.city
    })
    .select("id")
    .single();

  if (error) {
    if (supabaseUid) {
      try {
        await dbClient.auth.admin.deleteUser(supabaseUid);
      } catch (err) {
        console.error("Cleanup failed:", err.message);
      }
    }
    throwOnError(error, "Failed to create client database record.");
  }

  return {
    id: row.id,
    name: data.fullName,
    email: data.email,
    phone: data.phone,
    city: data.city,
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
  const { data: row, error } = await dbClient
    .from("clients")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  throwOnError(error);
  if (!row) {
    const err = new Error("Client profile not found in public database.");
    err.statusCode = 404;
    throw err;
  }

  // Update supabase_uid in case it was missing
  if (!row.supabase_uid && authData.user?.id) {
    await dbClient.from("clients").update({ supabase_uid: authData.user.id }).eq("id", row.id);
  }

  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
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
    let clientQuery = dbClient.from("clients").select("*");
    if (inputLower.includes("@")) {
      clientQuery = clientQuery.eq("email", inputLower);
    } else if (input.match(/^\+?[0-9\-\s]{10,20}$/)) {
      clientQuery = clientQuery.eq("phone", input);
    } else {
      clientQuery = clientQuery.eq("username", input);
    }
    const { data: clientRow } = await clientQuery.maybeSingle();
    if (clientRow) {
      if (bcrypt.compareSync(password, clientRow.password_hash)) {
        return {
          id: clientRow.id,
          name: clientRow.full_name,
          email: clientRow.email,
          phone: clientRow.phone,
          city: clientRow.city,
          username: clientRow.username || "",
          role: "client"
        };
      }
    }
  } catch (err) {
    console.error("Client auth check failed:", err.message);
  }

  // 3. Try Partner (email, phone, or username match)
  try {
    let partnerQuery = dbClient.from("partners").select("*");
    if (inputLower.includes("@")) {
      partnerQuery = partnerQuery.eq("email", inputLower);
    } else if (input.match(/^\+?[0-9\-\s]{10,20}$/)) {
      partnerQuery = partnerQuery.eq("phone", input);
    } else {
      partnerQuery = partnerQuery.eq("username", input);
    }
    const { data: partnerRow } = await partnerQuery.maybeSingle();
    if (partnerRow) {
      if (bcrypt.compareSync(password, partnerRow.password_hash)) {
        return {
          id: partnerRow.id,
          name: partnerRow.full_name,
          email: partnerRow.email,
          phone: partnerRow.phone,
          city: partnerRow.city,
          username: partnerRow.username,
          isVerified: partnerRow.is_verified,
          role: "partner"
        };
      }
    }
  } catch (err) {
    console.error("Partner auth check failed:", err.message);
  }

  // 4. Try Professional (email, phone, or username match)
  try {
    let proQuery = dbClient.from("professionals").select("*");
    if (inputLower.includes("@")) {
      proQuery = proQuery.eq("email", inputLower);
    } else if (input.match(/^\+?[0-9\-\s]{10,20}$/)) {
      proQuery = proQuery.eq("phone", input);
    } else {
      proQuery = proQuery.eq("username", input);
    }
    const { data: proRow } = await proQuery.maybeSingle();
    if (proRow) {
      if (bcrypt.compareSync(password, proRow.password_hash)) {
        return {
          id: proRow.id,
          name: proRow.full_name,
          email: proRow.email,
          phone: proRow.phone,
          city: proRow.city,
          area: proRow.area,
          username: proRow.username || "",
          isVerified: proRow.is_verified,
          role: "professional",
          partnerId: proRow.partner_id,
          isPartnerManaged: proRow.is_partner_managed
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
  const { data, error } = await client
    .from("services")
    .select("id, name, slug, base_price_inr")
    .eq("is_active", true)
    .order("name", { ascending: true });

  throwOnError(error);

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    basePriceInr: row.base_price_inr
  }));
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

  // Batch-fetch messages, professionals, partners, withdrawals, platform wallet, earnings, services
  const [
    messagesResult,
    prosResult,
    partnersResult,
    withdrawalsResult,
    platformWalletResult,
    earningsResult,
    allLinksResult,
    allServicesResult
  ] = await Promise.all([
    client.from("contact_messages").select("*").order("created_at", { ascending: false }),
    client.from("professionals").select("*").order("created_at", { ascending: false }),
    client.from("partners").select("*").order("created_at", { ascending: false }),
    client.from("withdrawals").select("*").order("created_at", { ascending: false }),
    client.from("wallet_balances").select("*").eq("owner_type", "platform").eq("owner_id", 1).maybeSingle(),
    client.from("earnings").select("*, bookings(booking_code), professionals(full_name, email)").order("created_at", { ascending: false }),
    client.from("professional_services").select("professional_id, service_id"),
    client.from("services").select("id, name, slug, base_price_inr").eq("is_active", true)
  ]);

  const supportMessages = messagesResult.error ? [] : (messagesResult.data || []);
  const professionals = prosResult.data || [];
  throwOnError(prosResult.error);

  const partners = partnersResult.data || [];
  const withdrawals = withdrawalsResult.data || [];
  const platformWallet = platformWalletResult.data || { available_inr: 0, pending_inr: 0, total_earned_inr: 0 };
  const earnings = earningsResult.data || [];

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

  const services = (allServicesResult.data || []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    basePriceInr: s.base_price_inr
  })).sort((a, b) => a.name.localeCompare(b.name));

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
    earnings
  };
}

async function updateServicePrice(serviceId, newPrice) {
  const client = getClient();
  const { error } = await client
    .from("services")
    .update({ base_price_inr: Number(newPrice) || 0 })
    .eq("id", serviceId);
  throwOnError(error);
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
        phone: null,
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
        phone: null,
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
        phone: null,
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
        phone: null,
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
    city: profileData.city
  };
  const { error } = await client
    .from("clients")
    .update(updatePayload)
    .eq("id", clientId);
  throwOnError(error);
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
    .select("id, full_name, email, phone, city, area, years_experience, hourly_rate_inr, photo_url, bio, is_verified, rating_avg, total_reviews, created_at, aadhaar_pan_url, live_photo_url")
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
    description: meta.cleanBio,
    workModes: meta.workModes,
    partTimeRate: meta.partTimeRate,
    fullTimeRate: meta.fullTimeRate,
    isVerified: data.is_verified,
    ratings: Number(data.rating_avg || 0),
    totalReviews: Number(data.total_reviews || 0),
    createdAt: data.created_at,
    aadhaarPanUrl: data.aadhaar_pan_url || meta.aadhaarPanUrl || "",
    livePhotoUrl: data.live_photo_url || meta.livePhotoUrl || ""
  };
}

// --- PARTNERS, WALLET & JOB POSTINGS UPGRADES ---

async function createPartnerAccount(data) {
  const dbClient = getClient();
  const passwordHash = await bcrypt.hash(data.password, 10);
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
  throwOnError(error, "Failed to create partner account.");
  return { id: row.id, ...data, role: "partner" };
}

async function authenticatePartner(login, password) {
  const dbClient = getClient();
  const input = String(login).trim();
  let query = dbClient.from("partners").select("*");
  if (input.includes("@")) {
    query = query.eq("email", input.toLowerCase());
  } else if (input.match(/^\+?[0-9\-\s]{10,20}$/)) {
    query = query.eq("phone", input);
  } else {
    query = query.eq("username", input);
  }
  const { data: row, error } = await query.maybeSingle();
  throwOnError(error);
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
  const client = getClient();
  const { data: partner, error: partnerError } = await client.from("partners").select("*").eq("id", partnerId).maybeSingle();
  throwOnError(partnerError);
  
  let wallet = await getWalletBalance("partner", partnerId);
  
  const { data: pros, error: prosError } = await client.from("professionals").select("*").eq("partner_id", partnerId);
  throwOnError(prosError);
  
  const { data: withdrawals, error: wError } = await client.from("withdrawals").select("*").eq("owner_type", "partner").eq("owner_id", partnerId).order("created_at", { ascending: false });
  throwOnError(wError);
  
  let bookings = [];
  if (pros && pros.length > 0) {
    const proIds = pros.map(p => p.id);
    const { data: bookingsData, error: bError } = await client
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
    throwOnError(bError);
    bookings = bookingsData || [];
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
  const dbClient = getClient();
  const passwordHash = await bcrypt.hash(data.password, 10);
  const insertPayload = {
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    password_hash: passwordHash,
    city: data.city,
    area: data.area || "",
    username: data.username,
    years_experience: Number(data.experience) || 0,
    hourly_rate_inr: 0,
    photo_url: DEFAULT_PHOTO,
    bio: `[Partner Managed Professional] [workModes:Part Time,Full Time] [partTimeRate:${Number(data.hourlyRate) || 500}] [fullTimeRate:${(Number(data.hourlyRate) || 500) * 25}]`,
    partner_id: partnerId,
    is_partner_managed: true,
    is_verified: true, // Auto-verified
    onboarding_complete: true
  };
  const { data: row, error } = await dbClient.from("professionals").insert(insertPayload).select("id").single();
  throwOnError(error, "Failed to create partner-managed professional.");

  if (data.serviceIds && data.serviceIds.length > 0) {
    for (const serviceId of data.serviceIds) {
      await dbClient.from("professional_services").insert({
        professional_id: row.id,
        service_id: Number(serviceId),
        custom_rate_inr: Number(data.hourlyRate) || 500
      });
    }
  }
  return row.id;
}

async function getWalletBalance(ownerType, ownerId) {
  const client = getClient();
  const { data, error } = await client.from("wallet_balances").select("*").eq("owner_type", ownerType).eq("owner_id", ownerId).maybeSingle();
  if (data) return data;
  
  const newWallet = {
    owner_type: ownerType,
    owner_id: ownerId,
    available_inr: 0,
    pending_inr: 0,
    total_earned_inr: 0
  };
  const { data: created, error: createError } = await client.from("wallet_balances").insert(newWallet).select("*").single();
  if (createError) {
    console.error("Failed to create wallet:", createError.message);
    return newWallet;
  }
  return created;
}

async function addEarningRecord(bookingId, professionalId, grossAmount) {
  const client = getClient();
  const gross = Number(grossAmount) || 0;
  const platformFee = Math.round(gross * 0.15);
  const net = gross - platformFee;

  const { data: pro, error: proError } = await client.from("professionals").select("partner_id, is_partner_managed").eq("id", professionalId).maybeSingle();
  throwOnError(proError);

  let recipientType = "professional";
  let recipientId = professionalId;
  if (pro && pro.is_partner_managed && pro.partner_id) {
    recipientType = "partner";
    recipientId = pro.partner_id;
  }

  const { error: earnError } = await client.from("earnings").insert({
    booking_id: bookingId,
    professional_id: professionalId,
    partner_id: pro && pro.is_partner_managed ? pro.partner_id : null,
    gross_amount_inr: gross,
    platform_fee_inr: platformFee,
    net_amount_inr: net,
    recipient_type: recipientType,
    recipient_id: recipientId
  });
  throwOnError(earnError);

  const platformWallet = await getWalletBalance("platform", 1);
  await client
    .from("wallet_balances")
    .update({
      available_inr: platformWallet.available_inr + platformFee,
      total_earned_inr: platformWallet.total_earned_inr + platformFee,
      updated_at: new Date().toISOString()
    })
    .eq("id", platformWallet.id);

  const recipientWallet = await getWalletBalance(recipientType, recipientId);
  await client
    .from("wallet_balances")
    .update({
      available_inr: recipientWallet.available_inr + net,
      total_earned_inr: recipientWallet.total_earned_inr + net,
      updated_at: new Date().toISOString()
    })
    .eq("id", recipientWallet.id);
}

async function requestWithdrawal(ownerType, ownerId, amount, bankDetails) {
  const client = getClient();
  const withdrawAmount = Number(amount) || 0;

  const { data: lastW } = await client
    .from("withdrawals")
    .select("created_at")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastW) {
    const diffMs = new Date() - new Date(lastW.created_at);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 7) {
      const remainingDays = Math.ceil(7 - diffDays);
      throw new Error(`You can only request a withdrawal once a week. Please wait ${remainingDays} more day(s) before requesting.`);
    }
  }

  const wallet = await getWalletBalance(ownerType, ownerId);
  if (wallet.available_inr < withdrawAmount) {
    throw new Error(`Insufficient wallet balance. You only have ₹${wallet.available_inr} available.`);
  }

  const { error: insError } = await client.from("withdrawals").insert({
    owner_type: ownerType,
    owner_id: ownerId,
    amount_inr: withdrawAmount,
    bank_details: bankDetails,
    status: "pending"
  });
  throwOnError(insError);

  await client
    .from("wallet_balances")
    .update({
      available_inr: wallet.available_inr - withdrawAmount,
      pending_inr: wallet.pending_inr + withdrawAmount,
      updated_at: new Date().toISOString()
    })
    .eq("id", wallet.id);
}

async function getWithdrawals(ownerType, ownerId) {
  const client = getClient();
  const { data, error } = await client.from("withdrawals").select("*").eq("owner_type", ownerType).eq("owner_id", ownerId).order("created_at", { ascending: false });
  throwOnError(error);
  return data || [];
}

async function getEarnings(ownerType, ownerId) {
  const client = getClient();
  const colName = ownerType === "partner" ? "partner_id" : "professional_id";
  const { data, error } = await client.from("earnings").select("*, bookings(booking_code)").eq(colName, ownerId).order("created_at", { ascending: false });
  throwOnError(error);
  return data || [];
}

async function createWorkRequirement(clientId, data) {
  const client = getClient();
  const { error } = await client.from("work_requirements").insert({
    client_id: clientId,
    client_name: data.clientName,
    client_contact: data.clientContact,
    category: data.category,
    sub_category: data.subCategory || "",
    location: data.location,
    budget_inr: Number(data.budget) || 0,
    job_type: data.jobType || "Full Time",
    description: data.description || ""
  });
  throwOnError(error);
}

async function getOpenWorkRequirements(category) {
  const client = getClient();
  let query = client.from("work_requirements").select("*").eq("status", "open");
  if (category) {
    query = query.eq("category", category);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  throwOnError(error);
  return data || [];
}

async function getWorkRequirementsByClient(clientId) {
  const client = getClient();
  const { data, error } = await client.from("work_requirements").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
  throwOnError(error);
  return data || [];
}

async function verifyPartner(partnerId, isVerified) {
  const client = getClient();
  const { error } = await client.from("partners").update({ is_verified: isVerified }).eq("id", partnerId);
  throwOnError(error);
}

async function getAdminWithdrawals() {
  const client = getClient();
  const { data, error } = await client.from("withdrawals").select("*").order("created_at", { ascending: false });
  throwOnError(error);
  return data || [];
}

async function approveWithdrawal(withdrawalId) {
  const client = getClient();
  const { data: w, error: wError } = await client.from("withdrawals").select("*").eq("id", withdrawalId).maybeSingle();
  throwOnError(wError);
  if (!w) throw new Error("Withdrawal request not found.");
  if (w.status !== "pending") throw new Error("Withdrawal request is already processed.");

  const { error: updError } = await client.from("withdrawals").update({
    status: "completed",
    processed_at: new Date().toISOString()
  }).eq("id", withdrawalId);
  throwOnError(updError);

  const wallet = await getWalletBalance(w.owner_type, w.owner_id);
  await client.from("wallet_balances").update({
    pending_inr: Math.max(0, wallet.pending_inr - w.amount_inr),
    updated_at: new Date().toISOString()
  }).eq("id", wallet.id);
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
  approveWithdrawal
};
