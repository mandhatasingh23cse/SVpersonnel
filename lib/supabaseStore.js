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

function normalizeProfessionalRow(row = {}) {
  return {
    id: Number(row.id),
    _id: String(row.id),
    name: row.name,
    ratings: Number(row.ratings || 0),
    experience: Number(row.experience || 0),
    distance: Number(row.distance || 0),
    photo: row.photo || DEFAULT_PHOTO,
    contact: row.contact || row.phone || row.email || "",
    email: row.email || "",
    phone: row.phone || "",
    city: row.city || "",
    area: row.area || "",
    skills: parseSkills(row.skills),
    description: row.description || "",
    isVerified: Boolean(row.isVerified),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    startingPrice: Number(row.startingPriceInr || 0),
    hourlyRateInr: Number(row.hourlyRateInr || 0),
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
        row.area.toLowerCase().includes(needle)
    );
  }

  if (cityQ) {
    const needle = cityQ.toLowerCase();
    rows = rows.filter((row) => row.city.toLowerCase().includes(needle) || row.area.toLowerCase().includes(needle));
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

async function createClientAccount(data) {
  const authClient = getAuthClient();
  const dbClient = getClient();

  // 1. Sign up user in Supabase Auth
  const { data: authResult, error: authError } = await authClient.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      redirectTo: "http://localhost:3000/auth/callback"
    }
  });
  if (authError) {
    throw authError;
  }

  const supabaseUid = authResult.user?.id || null;

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
    role: "client"
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
    const err = new Error(authError.message);
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

async function createProfessionalAccount(data) {
  const authClient = getAuthClient();
  const dbClient = getClient();

  // 1. Sign up user in Supabase Auth
  const { data: authResult, error: authError } = await authClient.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      redirectTo: "http://localhost:3000/auth/callback"
    }
  });
  if (authError) {
    throw authError;
  }

  const supabaseUid = authResult.user?.id || null;

  // 2. Hash password locally
  const passwordHash = await bcrypt.hash(data.password, 10);

  // 3. Insert professional profile
  const { data: row, error } = await dbClient
    .from("professionals")
    .insert({
      supabase_uid: supabaseUid,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      password_hash: passwordHash,
      city: data.city,
      area: data.area,
      years_experience: data.experience,
      hourly_rate_inr: 0, // Rate set by admin per service, not by professional
      distance_km: data.distanceKm || 0,
      photo_url: data.photoUrl || DEFAULT_PHOTO,
      bio: data.description || "",
      is_verified: Boolean(data.isVerified)
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
    role: "professional"
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
    const err = new Error(authError.message);
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
  const email = String(login).trim().toLowerCase();

  // 1. Try Admin
  try {
    const { data: adminRow } = await dbClient.from("admins").select("id").eq("email", email).maybeSingle();
    if (adminRow) {
      const admin = await authenticateAdmin(email, password);
      if (admin) return admin;
    }
  } catch (err) {
    console.error("Admin auth check failed:", err.message);
  }

  // 2. Try Client
  try {
    const { data: clientRow } = await dbClient.from("clients").select("id").eq("email", email).maybeSingle();
    if (clientRow) {
      const client = await authenticateClient(email, password);
      if (client) return client;
    }
  } catch (err) {
    console.error("Client auth check failed:", err.message);
  }

  // 3. Try Professional
  try {
    let proQuery = dbClient.from("professionals").select("id, email");
    if (email.includes("@")) {
      proQuery = proQuery.eq("email", email);
    } else {
      proQuery = proQuery.eq("phone", email);
    }
    const { data: proRow } = await proQuery.maybeSingle();
    if (proRow) {
      const pro = await authenticateProfessional(proRow.email, password);
      if (pro) return pro;
    }
  } catch (err) {
    console.error("Professional auth check failed:", err.message);
  }

  throw new Error("Incorrect email, phone, or password.");
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
    resolvedReviewerName = clientRow?.full_name || "GigConnect client";
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
    completed: ["confirmed"]
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
    .select("id, status")
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

  // Batch-fetch messages + professionals + all their service links in parallel (3 queries, not N*2+3)
  const [messagesResult, prosResult, allLinksResult, allServicesResult] = await Promise.all([
    client.from("contact_messages").select("*").order("created_at", { ascending: false }),
    client.from("professionals").select("*").order("created_at", { ascending: false }),
    client.from("professional_services").select("professional_id, service_id"),
    client.from("services").select("id, name, slug, base_price_inr").eq("is_active", true)
  ]);

  const supportMessages = messagesResult.error ? [] : (messagesResult.data || []);
  const professionals = prosResult.data || [];
  throwOnError(prosResult.error);

  // Build lookup maps for service names keyed by professional_id
  const serviceNameMap = new Map((allServicesResult.data || []).map((s) => [s.id, s.name]));
  const proSkillsMap = new Map();
  for (const link of allLinksResult.data || []) {
    if (!proSkillsMap.has(link.professional_id)) proSkillsMap.set(link.professional_id, []);
    const name = serviceNameMap.get(link.service_id);
    if (name) proSkillsMap.get(link.professional_id).push(name);
  }

  const normalizedPros = professionals.map((pro) => ({
    id: pro.id,
    name: pro.full_name,
    email: pro.email,
    phone: pro.phone,
    city: pro.city,
    area: pro.area,
    experience: pro.years_experience,
    hourlyRateInr: pro.hourly_rate_inr,
    startingPrice: pro.startingPrice || 0, // Fallback starting price will be calculated in view/query
    photo: pro.photo_url || DEFAULT_PHOTO,
    description: pro.bio || "",
    isVerified: pro.is_verified,
    skills: proSkillsMap.get(pro.id) || [],
    aadhaarPanUrl: pro.aadhaar_pan_url,
    livePhotoUrl: pro.live_photo_url
  }));

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
    services
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
    area: profileData.area,
    years_experience: Number(profileData.experience) || 0,
    bio: profileData.description || ""
  };

  if (profileData.photoUrl) {
    updatePayload.photo_url = profileData.photoUrl;
  }

  const { error } = await client
    .from("professionals")
    .update(updatePayload)
    .eq("id", professionalId);

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
  const tempPhone = "G_" + Date.now().toString().slice(-10) + Math.floor(Math.random() * 100);

  if (requestedRole === "client") {
    const { data: newClient, error: clientErr } = await dbClient
      .from("clients")
      .insert({
        supabase_uid: supabaseUid,
        full_name: fullName,
        email: email,
        phone: tempPhone,
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
        phone: tempPhone,
        password_hash: "",
        city: "Gurugram",
        area: "Main",
        years_experience: 0,
        hourly_rate_inr: 0,
        bio: "Registered with Google OAuth",
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

async function getOAuthSignInUrl(role) {
  const authClient = getAuthClient();
  const { data, error } = await authClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `http://localhost:3000/auth/callback?role=${role}`
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
  const tempPhone = "G_" + Date.now().toString().slice(-10) + Math.floor(Math.random() * 100);

  if (requestedRole === "client") {
    const { data: newClient, error: clientErr } = await dbClient
      .from("clients")
      .insert({
        supabase_uid: supabaseUid,
        full_name: fullName,
        email: email,
        phone: tempPhone,
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
        phone: tempPhone,
        password_hash: "",
        city: "Gurugram",
        area: "Main",
        years_experience: 0,
        hourly_rate_inr: 0,
        bio: "Registered with Google OAuth",
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
  return {
    id: data.id,
    name: data.full_name,
    email: data.email,
    phone: data.phone,
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

async function updateProfessionalServices(professionalId, serviceIds) {
  const client = getClient();
  
  // Delete existing service mappings
  const { error: deleteError } = await client
    .from("professional_services")
    .delete()
    .eq("professional_id", professionalId);
  throwOnError(deleteError);

  // Insert new mappings (custom_rate_inr is always null to fall back to the service base price set by the admin)
  if (serviceIds && serviceIds.length) {
    for (const serviceId of serviceIds) {
      const { error: insertError } = await client
        .from("professional_services")
        .insert({
          professional_id: professionalId,
          service_id: Number(serviceId),
          custom_rate_inr: null
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
  return {
    id: data.id,
    name: data.full_name,
    email: data.email,
    phone: data.phone,
    city: data.city,
    area: data.area,
    experience: data.years_experience,
    hourlyRateInr: data.hourly_rate_inr,
    photo: data.photo_url || DEFAULT_PHOTO,
    description: data.bio || "",
    isVerified: data.is_verified,
    ratings: Number(data.rating_avg || 0),
    totalReviews: Number(data.total_reviews || 0),
    createdAt: data.created_at,
    aadhaarPanUrl: data.aadhaar_pan_url,
    livePhotoUrl: data.live_photo_url
  };
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
  getContactMessagesByEmail
};
