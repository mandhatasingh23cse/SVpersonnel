require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const session = require("express-session");
const FileStore = require("./lib/fileSessionStore")(session);
const expressLayouts = require("express-ejs-layouts");
const { body, param, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");

const siteContent = require("./data/siteContent");
const seedData = require("./data/mysqlSeed");

const {
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
} = require("./lib/supabaseStore");

const multer = require("multer");
const fsSync = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fsSync.existsSync(uploadDir)) {
  fsSync.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, gif) and PDFs are allowed."));
  }
});

const app = express();

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "gigconnect-demo-secret";
const FALLBACK_WORKERS_PATH = path.join(__dirname, "public", "workers_data.json");
const DEFAULT_PHOTO = "/assets/gigconnect.logo.png";
const runtimeWorkers = [];

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new FileStore(),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.locals.currentYear = new Date().getFullYear();
app.locals.formatCurrency = formatCurrency;
app.locals.formatShortDate = formatShortDate;
app.locals.formatStatusLabel = formatStatusLabel;
app.locals.formatTimeSlot = formatTimeSlot;

app.use((req, res, next) => {
  res.locals.brand = siteContent.brand;
  res.locals.navigation = siteContent.navigation;
  res.locals.footerContent = siteContent.footer;
  res.locals.currentPath = req.path;
  res.locals.sessionUser = req.session.user || null;
  res.locals.databaseConnected = isDatabaseReady();
  res.locals.demoCredentials = seedData.demoCredentials;
  res.locals.formatCurrency = formatCurrency;
  res.locals.formatShortDate = formatShortDate;
  res.locals.formatStatusLabel = formatStatusLabel;
  res.locals.formatTimeSlot = formatTimeSlot;
  next();
});

function sanitizeText(value = "") {
  return sanitizeHtml(String(value).trim(), {
    allowedTags: [],
    allowedAttributes: {}
  });
}

function normalizeSkills(skills) {
  if (Array.isArray(skills)) {
    return skills.map((skill) => sanitizeText(skill)).filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => sanitizeText(skill))
      .filter(Boolean);
  }

  return [];
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function formatShortDate(value) {
  if (!value) return "Not set";

  const rawValue = String(value).trim();
  const normalizedDate =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
        ? new Date(`${rawValue}T00:00:00`)
        : new Date(rawValue);

  if (Number.isNaN(normalizedDate.getTime())) {
    return sanitizeText(rawValue);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(normalizedDate);
}

function formatStatusLabel(value = "") {
  const safeValue = sanitizeText(value);
  if (!safeValue) return "Unknown";

  return safeValue.charAt(0).toUpperCase() + safeValue.slice(1);
}

function formatTimeSlot(value = "") {
  const safeValue = sanitizeText(value);
  if (!safeValue) return "Not set";

  return safeValue
    .replace(/\s*-\s*/g, " - ")
    .replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());
}

function createFormNotice(type, text) {
  return { type, text };
}

function consumeSessionNotice(req, key) {
  const notice = req.session[key] || null;
  delete req.session[key];
  return notice;
}

function destroySessionAndRedirect(req, res, redirectPath = "/") {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect(redirectPath);
  });
}

function createSearchDefaults(query = {}) {
  return {
    queryText: sanitizeText(query.skill || query.name || ""),
    city: sanitizeText(query.city || ""),
    sort: sanitizeText(query.sort || "relevance"),
    verifiedOnly: String(query.verified || "").toLowerCase() === "true"
  };
}

function getAuthBridgeNote() {
  if (isDatabaseReady()) {
    return "";
  }

  return "Supabase is not connected yet. Add your Supabase credentials in .env to enable live accounts and bookings.";
}

function cloneHomeContent() {
  return {
    ...siteContent.home,
    hero: {
      ...siteContent.home.hero,
      stats: [...siteContent.home.hero.stats]
    },
    services: [...siteContent.home.services],
    testimonials: [...siteContent.home.testimonials]
  };
}

function normalizeFallbackWorker(worker = {}) {
  return {
    _id: worker._id || worker.id || `worker-${Date.now()}`,
    id: worker._id || worker.id || `worker-${Date.now()}`,
    name: sanitizeText(worker.name || "Professional"),
    ratings: Number(worker.ratings) || 0,
    experience: Number(worker.experience) || 0,
    distance: Number(worker.distance) || 0,
    photo: worker.photo ? sanitizeText(worker.photo) : "/assets/gigconnect.logo.png",
    contact: sanitizeText(worker.contact || ""),
    email: sanitizeText(worker.contact || ""),
    phone: sanitizeText(worker.contact || ""),
    city: sanitizeText(worker.city || "Gurugram"),
    area: sanitizeText(worker.city || "Gurugram"),
    skills: normalizeSkills(worker.skills),
    description: sanitizeText(worker.description || ""),
    isVerified: Boolean(worker.isVerified),
    createdAt: worker.createdAt || new Date().toISOString(),
    startingPrice: Number(worker.startingPrice || 499),
    hourlyRateInr: Number(worker.hourlyRateInr || worker.startingPrice || 499),
    totalReviews: Number(worker.totalReviews || 0)
  };
}

async function getFallbackWorkers() {
  try {
    const file = await fs.readFile(FALLBACK_WORKERS_PATH, "utf8");
    const parsed = JSON.parse(file);
    const fileWorkers = Array.isArray(parsed) ? parsed.map(normalizeFallbackWorker) : [];
    return [...runtimeWorkers, ...fileWorkers];
  } catch (error) {
    console.error("Could not read fallback workers:", error.message);
    return [...runtimeWorkers];
  }
}

function sortFallbackWorkers(workers, sortKey = "relevance") {
  const sorted = [...workers];

  sorted.sort((left, right) => {
    const leftVerified = left.isVerified ? 1 : 0;
    const rightVerified = right.isVerified ? 1 : 0;

    switch (sortKey) {
      case "rating":
        return (right.ratings - left.ratings) || (right.experience - left.experience);
      case "experience":
        return (right.experience - left.experience) || (right.ratings - left.ratings);
      case "distance":
        return (left.distance - right.distance) || (right.ratings - left.ratings);
      case "newest":
        return new Date(right.createdAt) - new Date(left.createdAt);
      default:
        return (
          (rightVerified - leftVerified) ||
          (right.ratings - left.ratings) ||
          (right.experience - left.experience) ||
          (left.distance - right.distance)
        );
    }
  });

  return sorted;
}

async function getWorkers({ queryText = "", cityQ = "", sortKey = "relevance", verifiedOnly = false }) {
  if (isDatabaseReady()) {
    return searchProfessionals({ queryText, cityQ, sortKey, verifiedOnly });
  }

  const fallbackWorkers = await getFallbackWorkers();
  const query = queryText.trim().toLowerCase();
  const city = cityQ.trim().toLowerCase();

  const filtered = fallbackWorkers.filter((worker) => {
    const matchesQuery =
      !query ||
      worker.name.toLowerCase().includes(query) ||
      worker.skills.some((skill) => skill.toLowerCase().includes(query));
    const matchesCity =
      !city ||
      worker.city.toLowerCase().includes(city) ||
      worker.area.toLowerCase().includes(city);
    const matchesVerified = !verifiedOnly || worker.isVerified;

    return matchesQuery && matchesCity && matchesVerified;
  });

  return sortFallbackWorkers(filtered, sortKey);
}

async function getWorkerCardOptions() {
  if (isDatabaseReady()) {
    const services = await getServiceCatalog(8);
    return services.map((service) => ({
      name: service.name,
      icon: service.icon,
      description: service.description,
      priceLabel: `From ${formatCurrency(service.startingPriceInr)}`,
      meta: `${service.professionalCount} professionals`
    }));
  }

  return siteContent.home.services.map((service) => ({
    ...service,
    priceLabel: "From ₹499",
    meta: "Demo data"
  }));
}

async function buildHomePageContent() {
  const homeContent = cloneHomeContent();

  if (isDatabaseReady()) {
    // Fire all DB calls in parallel — no sequential awaits
    const [featuredWorkers, dynamicServices, stats, testimonials] = await Promise.all([
      getWorkers({ sortKey: "rating" }).then((workers) => workers.slice(0, 6)),
      getWorkerCardOptions(),
      getHomeStats(),
      getTestimonials(3)
    ]);

    homeContent.services = dynamicServices;
    homeContent.hero.stats = stats;
    if (testimonials.length) {
      homeContent.testimonials = testimonials;
    }

    return { homeContent, featuredWorkers };
  }

  // Fallback path (no DB) — still parallel
  const [featuredWorkers, dynamicServices] = await Promise.all([
    getWorkers({ sortKey: "rating" }).then((workers) => workers.slice(0, 6)),
    getWorkerCardOptions()
  ]);

  homeContent.services = dynamicServices;
  return { homeContent, featuredWorkers };
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      if (role === "client") return res.redirect("/clientlogin");
      if (role === "admin") return res.redirect("/admin/login");
      return res.redirect("/professionallogin");
    }

    next();
  };
}

async function resolveServiceIdsFromInput(primarySkill, secondarySkills) {
  if (!isDatabaseReady()) return [];

  const skills = normalizeSkills([primarySkill, secondarySkills].filter(Boolean));
  if (!skills.length) return [];

  const serviceOptions = await getServiceOptions();
  const lowerSkills = skills.map((skill) => skill.toLowerCase());
  const matchedIds = [];

  for (const skill of lowerSkills) {
    const matchedService = serviceOptions.find((service) => {
      const serviceName = service.name.toLowerCase();
      const serviceSlug = String(service.slug || "").toLowerCase();

      return (
        serviceName === skill ||
        serviceSlug === skill ||
        serviceName.includes(skill) ||
        skill.includes(serviceName) ||
        (serviceSlug && (serviceSlug.includes(skill) || skill.includes(serviceSlug)))
      );
    });

    if (matchedService && !matchedIds.includes(matchedService.id)) {
      matchedIds.push(matchedService.id);
    }
  }

  return matchedIds;
}

async function getRegistrationServiceOptions() {
  if (isDatabaseReady()) {
    const liveServices = await getServiceOptions();
    if (liveServices.length) {
      return liveServices.map((service) => ({
        id: Number(service.id),
        name: sanitizeText(service.name),
        slug: sanitizeText(service.slug),
        basePriceInr: Number(service.basePriceInr || 0)
      }));
    }
  }

  return siteContent.home.services.map((service, index) => ({
    id: index + 1,
    name: sanitizeText(service.name),
    slug: sanitizeText(service.name.toLowerCase().replace(/\s+/g, "-")),
    basePriceInr: 0
  }));
}

function renderContactPage(res, overrides = {}) {
  return res.render("contactus", {
    title: "Contact SV Personnels",
    pageClass: "page-contact",
    contactContent: siteContent.contact,
    formData: {
      fullname: "",
      email: "",
      phone: "",
      subject: "",
      message: ""
    },
    formNotice: null,
    ...overrides
  });
}

function renderSignupPage(res, overrides = {}) {
  return res.render("signup", {
    title: "Create your client account | SV Personnels",
    pageClass: "page-signup",
    authContent: siteContent.auth.client,
    bridgeNote: getAuthBridgeNote(),
    formNotice: null,
    formData: {
      fullname: "",
      email: "",
      phone: "",
      city: ""
    },
    ...overrides
  });
}

function renderClientLoginPage(req, res, overrides = {}) {
  return res.render("clientlogin", {
    title: "Client login | SV Personnels",
    pageClass: "page-login",
    authContent: siteContent.auth.clientLogin,
    bridgeNote: getAuthBridgeNote(),
    formNotice: consumeSessionNotice(req, "loginNotice"),
    formData: {
      email: ""
    },
    ...overrides
  });
}

function renderProfessionalLoginPage(req, res, overrides = {}) {
  return res.render("professionallogin", {
    title: "Professional login | SV Personnels",
    pageClass: "page-login",
    authContent: siteContent.auth.proLogin,
    bridgeNote: getAuthBridgeNote(),
    formNotice: consumeSessionNotice(req, "loginNotice"),
    formData: {
      email: ""
    },
    ...overrides
  });
}

async function renderRegisterPage(res, overrides = {}) {
  const platformServices = await getRegistrationServiceOptions();

  return res.render("register", {
    title: "Register as a professional | SV Personnels",
    pageClass: "page-register",
    authContent: siteContent.auth.professional,
    bridgeNote: getAuthBridgeNote(),
    formNotice: null,
    registerFormData: {
      name: "",
      email: "",
      phone: "",
      primarySkill: "",
      secondarySkills: [],
      city: "",
      area: "",
      experience: "",
      hourlyRate: "",
      photo: "",
      description: ""
    },
    platformServices,
    ...overrides
  });
}

function renderBookingPage(res, overrides = {}) {
  return res.render("bookService", {
    title: "Book a professional | SV Personnels",
    pageClass: "page-booking",
    professional: null,
    serviceOptions: [],
    formNotice: null,
    formData: {
      fullName: "",
      email: "",
      phone: "",
      preferredDate: "",
      preferredTimeSlot: "",
      addressArea: "",
      budget: "",
      serviceId: "",
      details: ""
    },
    ...overrides
  });
}

app.get("/", async (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === "client") {
      return res.redirect("/client/dashboard");
    }
    if (req.session.user.role === "professional") {
      return res.redirect("/professional/dashboard");
    }
    if (req.session.user.role === "admin") {
      return res.redirect("/admin/dashboard");
    }
  }

  const { homeContent, featuredWorkers } = await buildHomePageContent();

  res.render("index", {
    title: "SV Personnels | Govt. Authorized Professional Job & Hiring Provider across India",
    pageClass: "page-home",
    homeContent,
    featuredWorkers
  });
});

app.get("/howitworks", (req, res) =>
  res.render("howitworks", {
    title: "How SV Personnels works",
    pageClass: "page-how-it-works",
    howItWorksContent: siteContent.howItWorks,
    homeSteps: siteContent.home.steps
  })
);

app.get("/terms", (req, res) =>
  res.render("terms", {
    title: "Terms & Conditions | SV Personnels",
    pageClass: "page-terms"
  })
);

app.get("/findHelpNow", (req, res) => {
  if (req.session.user && req.session.user.role === "professional") {
    req.session.professionalDashboardNotice = createFormNotice(
      "error",
      "As a registered professional, you cannot search or book other professionals."
    );
    return res.redirect("/professional/dashboard");
  }
  return res.render("findHelpNow", {
    title: "Find trusted professionals | SV Personnels",
    pageClass: "page-discover",
    discoverContent: siteContent.discover,
    searchDefaults: createSearchDefaults(req.query),
    scripts: ["/javascript/findhelpnow.js"]
  });
});

app.get("/contactus", (req, res) => renderContactPage(res));

app.get("/contact/status", async (req, res) => {
  const email = req.query.email ? String(req.query.email).trim() : "";
  let messages = [];
  let searched = false;
  let errorMsg = "";

  if (email) {
    searched = true;
    try {
      if (!isDatabaseReady()) {
        errorMsg = "Database is not connected. Please try again later.";
      } else {
        messages = await getContactMessagesByEmail(email);
      }
    } catch (err) {
      errorMsg = err.message || "Failed to retrieve messages.";
    }
  }

  res.render("checkSupport", {
    title: "Check Message Status | SV Personnels",
    pageClass: "page-support-status",
    email,
    messages,
    searched,
    errorMsg
  });
});

app.post(
  "/contactus",
  [
    body("fullname").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your full name."),
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("phone")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 10, max: 20 })
      .withMessage("Please enter a valid phone number."),
    body("subject")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 120 })
      .withMessage("Subject should stay under 120 characters."),
    body("message")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Please enter a message with at least 10 characters.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const formData = {
      fullname: sanitizeText(req.body.fullname),
      email: sanitizeText(req.body.email),
      phone: sanitizeText(req.body.phone),
      subject: sanitizeText(req.body.subject),
      message: sanitizeText(req.body.message)
    };

    if (!errors.isEmpty()) {
      return renderContactPage(res.status(422), {
        formNotice: createFormNotice("error", errors.array()[0].msg),
        formData
      });
    }

    if (!isDatabaseReady()) {
      return renderContactPage(res.status(503), {
        formNotice: createFormNotice("error", "Supabase is not connected yet, so contact messages cannot be saved right now."),
        formData
      });
    }

    await createContactMessage({
      fullName: formData.fullname,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message
    });

    return renderContactPage(res, {
      formNotice: createFormNotice(
        "success",
        "Thanks for reaching out. Your message has been saved in the SV Personnels support inbox."
      )
    });
  }
);

app.get("/signup", (req, res) => renderSignupPage(res));

app.post(
  "/signup",
  [
    body("fullname").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your full name."),
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("phone").trim().isLength({ min: 10, max: 20 }).withMessage("Please enter a valid phone number."),
    body("city").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your city."),
    body("password")
      .trim()
      .isLength({ min: 8 }).withMessage("Password should be at least 8 characters.")
      .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
      .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter.")
      .matches(/[0-9]/).withMessage("Password must contain at least one number.")
      .matches(/[\W_]/).withMessage("Password must contain at least one special character or symbol."),
    body("agree-terms").custom((value) => Boolean(value)).withMessage("Please accept the terms to continue."),
    body("confirm-password")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const formData = {
      fullname: sanitizeText(req.body.fullname),
      email: sanitizeText(req.body.email),
      phone: sanitizeText(req.body.phone),
      city: sanitizeText(req.body.city)
    };

    if (!errors.isEmpty()) {
      return renderSignupPage(res.status(422), {
        formNotice: createFormNotice("error", errors.array()[0].msg),
        formData
      });
    }

    if (!isDatabaseReady()) {
      return renderSignupPage(res.status(503), {
        formNotice: createFormNotice("error", "Supabase is not connected yet, so account creation is unavailable."),
        formData
      });
    }

    try {
      const user = await createClientAccount({
        fullName: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        password: req.body.password
      });

      req.session.user = user;
      return res.redirect("/client/dashboard");
    } catch (error) {
      return renderSignupPage(res.status(error.statusCode || 500), {
        formNotice: createFormNotice("error", error.message || "Could not create the client account right now."),
        formData
      });
    }
  }
);

app.get("/clientlogin", (req, res) => res.redirect("/login"));
app.get("/professionallogin", (req, res) => res.redirect("/login"));

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Log in | SV Personnels",
    pageClass: "page-login",
    bridgeNote: null,
    formNotice: consumeSessionNotice(req, "loginNotice"),
    formData: { login: "" }
  });
});

app.post(
  "/login",
  [
    body("login").trim().isLength({ min: 3 }).withMessage("Please enter your email or phone number."),
    body("password").trim().isLength({ min: 6 }).withMessage("Please enter your password.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const formData = { login: sanitizeText(req.body.login) };

    if (!errors.isEmpty()) {
      return res.status(422).render("login", {
        title: "Log in | SV Personnels",
        pageClass: "page-login",
        bridgeNote: null,
        formNotice: createFormNotice("error", errors.array()[0].msg),
        formData
      });
    }

    if (!isDatabaseReady()) {
      return res.status(503).render("login", {
        title: "Log in | SV Personnels",
        pageClass: "page-login",
        bridgeNote: null,
        formNotice: createFormNotice("error", "Supabase is not connected yet, so login is unavailable."),
        formData
      });
    }

    try {
      const user = await authenticateUnified(formData.login, req.body.password);

      // Check if client is blocked (has >= 10 cancellations)
      if (user.role === "client") {
        const dbClient = getClient();
        const { count: cancelCount } = await dbClient
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("client_id", user.id)
          .eq("status", "cancelled");

        if (cancelCount >= 10) {
          return res.status(403).render("login", {
            title: "Account Blocked | SV Personnels",
            pageClass: "page-login",
            bridgeNote: null,
            formNotice: createFormNotice("error", "Your account has been permanently blocked due to exceeding 10 cancellations."),
            formData: { login: "" }
          });
        }
      }

      req.session.user = user;

      if (user.role === "admin") {
        return res.redirect("/admin/dashboard");
      } else if (user.role === "professional") {
        return res.redirect("/professional/dashboard");
      } else {
        return res.redirect("/client/dashboard");
      }
    } catch (error) {
      return res.status(401).render("login", {
        title: "Log in | SV Personnels",
        pageClass: "page-login",
        bridgeNote: null,
        formNotice: createFormNotice("error", error.message || "Incorrect credentials."),
        formData
      });
    }
  }
);

app.get("/register", (req, res) => {
  res.render("registerSelect", {
    title: "Join SV Personnels",
    pageClass: "page-register"
  });
});

app.get("/register/professional", async (req, res) => {
  await renderRegisterPage(res);
});

app.post(
  "/register/professional",
  upload.single("photo"),
  [
    body("fullname").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your full name."),
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("phone").trim().isLength({ min: 10, max: 20 }).withMessage("Please enter a valid phone number."),
    body("primary-skill").trim().isLength({ min: 2, max: 120 }).withMessage("Please choose your primary service."),
    body("city").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your city."),
    body("area").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your service area."),
    body("experience").isInt({ min: 0, max: 60 }).withMessage("Please enter valid years of experience."),
    body("password")
      .trim()
      .isLength({ min: 8 }).withMessage("Password should be at least 8 characters.")
      .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
      .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter.")
      .matches(/[0-9]/).withMessage("Password must contain at least one number.")
      .matches(/[\W_]/).withMessage("Password must contain at least one special character or symbol."),
    body("agree-terms").custom((value) => Boolean(value)).withMessage("Please accept the terms to continue."),
    body("confirm-password")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const photoPath = req.file ? `/uploads/${req.file.filename}` : "/assets/gigconnect.logo.png";
    const formData = {
      name: sanitizeText(req.body.fullname),
      email: sanitizeText(req.body.email),
      phone: sanitizeText(req.body.phone),
      primarySkill: sanitizeText(req.body["primary-skill"]),
      secondarySkills: normalizeSkills(req.body["secondary-skills"]),
      city: sanitizeText(req.body.city),
      area: sanitizeText(req.body.area),
      experience: sanitizeText(req.body.experience),
      photo: photoPath,
      description: sanitizeText(req.body.description)
    };

    if (!errors.isEmpty()) {
      if (req.file) {
        fsSync.unlink(req.file.path, () => {});
      }
      return await renderRegisterPage(res.status(422), {
        formNotice: createFormNotice("error", errors.array()[0].msg),
        registerFormData: formData
      });
    }

    if (!isDatabaseReady()) {
      return await renderRegisterPage(res.status(503), {
        formNotice: createFormNotice("error", "Supabase is not connected yet, so professional registration is unavailable."),
        registerFormData: formData
      });
    }

    const serviceIds = await resolveServiceIdsFromInput(formData.primarySkill, formData.secondarySkills);
    if (!serviceIds.length) {
      return await renderRegisterPage(res.status(422), {
        formNotice: createFormNotice("error", "Please enter a skill that matches one of the platform service categories."),
        registerFormData: formData
      });
    }

    try {
      const user = await createProfessionalAccount({
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        area: formData.area,
        experience: Number(formData.experience),
        photoUrl: formData.photo || undefined,
        description: formData.description || undefined,
        password: req.body.password,
        serviceIds
      });

      req.session.user = user;
      return res.redirect("/professional/dashboard");
    } catch (error) {
      return await renderRegisterPage(res.status(error.statusCode || 500), {
        formNotice: createFormNotice("error", error.message || "Could not create the professional profile right now."),
        registerFormData: formData
      });
    }
  }
);

app.get("/client/dashboard", requireRole("client"), async (req, res) => {
  if (!isDatabaseReady()) {
    return res.redirect("/clientlogin");
  }

  // Check if client is blocked (has >= 10 cancellations)
  try {
    const dbClient = getClient();
    const { count: cancelCount } = await dbClient
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("client_id", req.session.user.id)
      .eq("status", "cancelled");

    if (cancelCount >= 10) {
      req.session.destroy();
      res.clearCookie("connect.sid");
      return res.status(403).render("login", {
        title: "Account Blocked | SV Personnels",
        pageClass: "page-login",
        bridgeNote: null,
        formNotice: createFormNotice("error", "Your account has been permanently blocked due to exceeding 10 cancellations."),
        formData: { login: "" }
      });
    }
  } catch (err) {
    console.error("Block check error:", err.message);
  }

  const dashboardData = await getClientDashboardData(req.session.user.id);
  return res.render("clientDashboard", {
    title: "Client dashboard | SV Personnels",
    pageClass: "page-dashboard",
    dashboardData,
    formNotice: consumeSessionNotice(req, "clientDashboardNotice")
  });
});

app.post(
  "/client/bookings/:bookingId/review",
  requireRole("client"),
  [
    param("bookingId").isInt({ min: 1 }).withMessage("Please choose a valid completed booking."),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Please choose a rating between 1 and 5."),
    body("reviewText")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 600 })
      .withMessage("Please keep your review under 600 characters.")
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty() && !isDatabaseReady()) {
      req.session.clientDashboardNotice = createFormNotice(
        "error",
        "Supabase is not connected right now, so ratings are temporarily unavailable."
      );
      return res.redirect("/client/dashboard");
    }

    if (!errors.isEmpty()) {
      req.session.clientDashboardNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/client/dashboard");
    }

    try {
      await createClientReview({
        bookingId: Number(req.params.bookingId),
        clientId: req.session.user.id,
        rating: Number(req.body.rating),
        reviewText: sanitizeText(req.body.reviewText),
        reviewerName: req.session.user.name
      });

      req.session.clientDashboardNotice = createFormNotice(
        "success",
        "Thanks for your feedback. Your rating has been saved and the professional score is updated."
      );
    } catch (error) {
      req.session.clientDashboardNotice = createFormNotice(
        "error",
        error.message || "Could not save your rating right now."
      );
    }

    return res.redirect("/client/dashboard");
  }
);

app.post(
  "/client/delete-profile",
  requireRole("client"),
  [body("confirmDelete").custom((value) => Boolean(value)).withMessage("Please confirm before deleting your client profile.")],
  async (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty() && !isDatabaseReady()) {
      req.session.clientDashboardNotice = createFormNotice(
        "error",
        "Supabase is not connected right now, so profile deletion is temporarily unavailable."
      );
      return res.redirect("/client/dashboard");
    }

    if (!errors.isEmpty()) {
      req.session.clientDashboardNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/client/dashboard");
    }

    try {
      await deleteClientAccount(req.session.user.id);
      return destroySessionAndRedirect(req, res, "/");
    } catch (error) {
      req.session.clientSettingsNotice = createFormNotice(
        "error",
        error.message || "Could not delete the client profile right now."
      );
      return res.redirect("/client/settings");
    }
  }
);

app.get("/client/settings", requireRole("client"), async (req, res) => {
  if (!isDatabaseReady()) {
    return res.redirect("/login");
  }
  try {
    const messages = await getContactMessagesByEmail(req.session.user.email);
    return res.render("clientSettings", {
      title: "Settings | SV Personnels",
      pageClass: "page-settings",
      messages,
      formNotice: consumeSessionNotice(req, "clientSettingsNotice")
    });
  } catch (error) {
    req.session.clientDashboardNotice = createFormNotice("error", `Settings load error: ${error.message}`);
    return res.redirect("/client/dashboard");
  }
});

app.get("/client/profile", requireRole("client"), async (req, res) => {
  if (!isDatabaseReady()) {
    return res.redirect("/clientlogin");
  }

  try {
    const profile = await getClientProfile(req.session.user.id);
    return res.render("clientProfile", {
      title: "My Profile | SV Personnels",
      pageClass: "page-profile",
      profile,
      formNotice: consumeSessionNotice(req, "clientProfileNotice")
    });
  } catch (error) {
    req.session.clientDashboardNotice = createFormNotice("error", `Profile load error: ${error.message}`);
    return res.redirect("/client/dashboard");
  }
});

app.post(
  "/client/profile",
  requireRole("client"),
  [
    body("fullname").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your full name."),
    body("phone").trim().isLength({ min: 10, max: 15 }).withMessage("Please enter a valid phone number."),
    body("city").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your city.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.session.clientProfileNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/client/profile");
    }

    if (!isDatabaseReady()) {
      req.session.clientProfileNotice = createFormNotice("error", "Database connection offline.");
      return res.redirect("/client/profile");
    }

    try {
      const profileData = {
        fullName: sanitizeText(req.body.fullname),
        phone: sanitizeText(req.body.phone),
        city: sanitizeText(req.body.city)
      };

      await updateClientProfile(req.session.user.id, profileData);

      // Sync session details
      req.session.user.name = profileData.fullName;
      req.session.user.city = profileData.city;
      req.session.user.phone = profileData.phone;

      req.session.clientProfileNotice = createFormNotice("success", "Profile updated successfully!");
    } catch (error) {
      req.session.clientProfileNotice = createFormNotice("error", `Failed to update profile: ${error.message}`);
    }

    return res.redirect("/client/profile");
  }
);

app.post(
  "/client/change-password",
  requireRole("client"),
  [
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.session.clientProfileNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/client/profile");
    }

    try {
      await resetUserPassword({
        role: "client",
        email: req.session.user.email,
        phone: req.session.user.phone,
        newPassword: req.body.newPassword
      });
      req.session.clientProfileNotice = createFormNotice("success", "Password updated successfully!");
    } catch (error) {
      req.session.clientProfileNotice = createFormNotice("error", `Failed to change password: ${error.message}`);
    }
    return res.redirect("/client/profile");
  }
);

app.get("/professional/dashboard", requireRole("professional"), async (req, res) => {
  if (!isDatabaseReady()) {
    return res.redirect("/professionallogin");
  }

  const dashboardData = await getProfessionalDashboardData(req.session.user.id);
  return res.render("professionalDashboard", {
    title: "Professional dashboard | SV Personnels",
    pageClass: "page-dashboard",
    dashboardData,
    formNotice: consumeSessionNotice(req, "professionalDashboardNotice")
  });
});

app.get("/professional/profile", requireRole("professional"), async (req, res) => {
  if (!isDatabaseReady()) {
    return res.redirect("/professionallogin");
  }

  try {
    const dashboardData = await getProfessionalDashboardData(req.session.user.id);
    const services = await getServiceOptions();
    const mappedServices = await getProfessionalServiceOptions(req.session.user.id);
    const mappedServiceIds = mappedServices.map((s) => s.id);

    return res.render("professionalProfile", {
      title: "My Profile | SV Personnels",
      pageClass: "page-profile",
      profile: dashboardData.profile,
      services,
      mappedServiceIds,
      formNotice: consumeSessionNotice(req, "professionalProfileNotice")
    });
  } catch (error) {
    req.session.professionalDashboardNotice = createFormNotice("error", `Profile load error: ${error.message}`);
    return res.redirect("/professional/dashboard");
  }
});

app.post(
  "/professional/profile",
  requireRole("professional"),
  upload.single("photo"),
  [
    body("fullname").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your full name."),
    body("city").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your city."),
    body("area").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your service area."),
    body("experience").isInt({ min: 0, max: 60 }).withMessage("Please enter valid years of experience.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fsSync.unlink(req.file.path, () => {});
      }
      req.session.professionalProfileNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/professional/profile");
    }

    if (!isDatabaseReady()) {
      if (req.file) {
        fsSync.unlink(req.file.path, () => {});
      }
      req.session.professionalProfileNotice = createFormNotice("error", "Database is offline, cannot update profile.");
      return res.redirect("/professional/profile");
    }

    try {
      const profileData = {
        fullName: sanitizeText(req.body.fullname),
        city: sanitizeText(req.body.city),
        area: sanitizeText(req.body.area),
        experience: Number(req.body.experience) || 0,
        description: sanitizeText(req.body.description || "")
      };

      if (req.file) {
        profileData.photoUrl = `/uploads/${req.file.filename}`;
      }

      await updateProfessionalProfile(req.session.user.id, profileData);

      // Update service mappings
      const rawServiceIds = req.body.serviceIds;
      const serviceIds = rawServiceIds ? (Array.isArray(rawServiceIds) ? rawServiceIds : [rawServiceIds]) : [];
      await updateProfessionalServices(req.session.user.id, serviceIds);

      // Update session details
      req.session.user.name = profileData.fullName;
      req.session.user.city = profileData.city;

      req.session.professionalProfileNotice = createFormNotice("success", "Profile updated successfully!");
    } catch (error) {
      req.session.professionalProfileNotice = createFormNotice("error", `Failed to update profile: ${error.message}`);
    }

    return res.redirect("/professional/profile");
  }
);

app.post(
  "/professional/change-password",
  requireRole("professional"),
  [
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.session.professionalProfileNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/professional/profile");
    }

    try {
      await resetUserPassword({
        role: "professional",
        email: req.session.user.email,
        phone: req.session.user.phone,
        newPassword: req.body.newPassword
      });
      req.session.professionalProfileNotice = createFormNotice("success", "Password updated successfully!");
    } catch (error) {
      req.session.professionalProfileNotice = createFormNotice("error", `Failed to change password: ${error.message}`);
    }
    return res.redirect("/professional/profile");
  }
);

app.post(
  "/professional/delete-profile",
  requireRole("professional"),
  [body("confirmDelete").custom((value) => Boolean(value)).withMessage("Please confirm before deleting your professional profile.")],
  async (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty() && !isDatabaseReady()) {
      req.session.professionalDashboardNotice = createFormNotice(
        "error",
        "Supabase is not connected right now, so profile deletion is temporarily unavailable."
      );
      return res.redirect("/professional/dashboard");
    }

    if (!errors.isEmpty()) {
      req.session.professionalDashboardNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/professional/dashboard");
    }

    try {
      await deleteProfessionalAccount(req.session.user.id);
      return destroySessionAndRedirect(req, res, "/");
    } catch (error) {
      req.session.professionalSettingsNotice = createFormNotice(
        "error",
        error.message || "Could not delete the professional profile right now."
      );
      return res.redirect("/professional/settings");
    }
  }
);

app.get("/professional/settings", requireRole("professional"), async (req, res) => {
  if (!isDatabaseReady()) {
    return res.redirect("/login");
  }
  try {
    const messages = await getContactMessagesByEmail(req.session.user.email);
    return res.render("professionalSettings", {
      title: "Settings | SV Personnels",
      pageClass: "page-settings",
      messages,
      formNotice: consumeSessionNotice(req, "professionalSettingsNotice")
    });
  } catch (error) {
    req.session.professionalDashboardNotice = createFormNotice("error", `Settings load error: ${error.message}`);
    return res.redirect("/professional/dashboard");
  }
});

app.post(
  "/professional/upload-verification",
  requireRole("professional"),
  upload.fields([
    { name: "idDocument", maxCount: 1 },
    { name: "livePhoto", maxCount: 1 }
  ]),
  async (req, res) => {
    if (!isDatabaseReady()) {
      if (req.files) {
        if (req.files.idDocument) fsSync.unlink(req.files.idDocument[0].path, () => {});
        if (req.files.livePhoto) fsSync.unlink(req.files.livePhoto[0].path, () => {});
      }
      req.session.professionalDashboardNotice = createFormNotice("error", "Database is offline, cannot submit verification.");
      return res.redirect("/professional/dashboard");
    }

    try {
      const idFile = req.files && req.files.idDocument ? req.files.idDocument[0] : null;
      const liveFile = req.files && req.files.livePhoto ? req.files.livePhoto[0] : null;

      if (!idFile || !liveFile) {
        if (idFile) fsSync.unlink(idFile.path, () => {});
        if (liveFile) fsSync.unlink(liveFile.path, () => {});
        
        req.session.professionalDashboardNotice = createFormNotice("error", "Please upload both your Aadhaar/PAN Card and a Live Photo.");
        return res.redirect("/professional/dashboard");
      }

      const idDocumentUrl = `/uploads/${idFile.filename}`;
      const livePhotoUrl = `/uploads/${liveFile.filename}`;

      const dbClient = getClient();
      const { error } = await dbClient
        .from("professionals")
        .update({
          aadhaar_pan_url: idDocumentUrl,
          live_photo_url: livePhotoUrl
        })
        .eq("id", req.session.user.id);

      if (error) {
        throw error;
      }

      req.session.professionalDashboardNotice = createFormNotice(
        "success",
        "Verification documents submitted successfully! Our administrators will review and verify your account shortly."
      );
    } catch (error) {
      if (req.files) {
        if (req.files.idDocument) fsSync.unlink(req.files.idDocument[0].path, () => {});
        if (req.files.livePhoto) fsSync.unlink(req.files.livePhoto[0].path, () => {});
      }
      req.session.professionalDashboardNotice = createFormNotice("error", `Failed to submit verification: ${error.message}`);
    }

    return res.redirect("/professional/dashboard");
  }
);

app.post(
  "/professional/bookings/:bookingId/status",
  requireRole("professional"),
  [
    param("bookingId").isInt({ min: 1 }).withMessage("Please choose a valid booking request."),
    body("status").trim().isIn(["confirmed", "completed"]).withMessage("Please choose a valid booking action.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty() && !isDatabaseReady()) {
      req.session.professionalDashboardNotice = createFormNotice(
        "error",
        "Supabase is not connected right now, so booking actions are temporarily unavailable."
      );
      return res.redirect("/professionallogin");
    }

    if (!errors.isEmpty()) {
      req.session.professionalDashboardNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/professional/dashboard");
    }

    const bookingId = Number(req.params.bookingId);
    const nextStatus = sanitizeText(req.body.status);

    try {
      const updatedStatus = await updateProfessionalBookingStatus({
        bookingId,
        professionalId: req.session.user.id,
        nextStatus
      });

      const successMessage =
        updatedStatus === "confirmed"
          ? "Booking request accepted successfully."
          : "Booking marked as completed successfully.";

      req.session.professionalDashboardNotice = createFormNotice("success", successMessage);
    } catch (error) {
      req.session.professionalDashboardNotice = createFormNotice(
        "error",
        error.message || "Could not update that booking request right now."
      );
    }

    return res.redirect("/professional/dashboard");
  }
);

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

function renderResetPasswordPage(res, overrides = {}) {
  return res.render("forgotPassword", {
    title: "Reset Password | SV Personnels",
    pageClass: "page-login",
    formData: { email: "", phone: "" },
    formNotice: null,
    ...overrides
  });
}

app.get("/reset-password", (req, res) => renderResetPasswordPage(res));

app.post(
  "/reset-password",
  [
    body("role").trim().isIn(["client", "professional"]).withMessage("Invalid account role."),
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("phone").trim().isLength({ min: 10, max: 20 }).withMessage("Please enter a valid phone number."),
    body("password")
      .trim()
      .isLength({ min: 8 }).withMessage("Password should be at least 8 characters.")
      .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
      .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter.")
      .matches(/[0-9]/).withMessage("Password must contain at least one number.")
      .matches(/[\W_]/).withMessage("Password must contain at least one special character or symbol."),
    body("confirm-password")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const formData = {
      email: sanitizeText(req.body.email),
      phone: sanitizeText(req.body.phone),
      role: req.body.role
    };

    if (!errors.isEmpty()) {
      return renderResetPasswordPage(res.status(422), {
        formNotice: createFormNotice("error", errors.array()[0].msg),
        formData
      });
    }

    if (!isDatabaseReady()) {
      return renderResetPasswordPage(res.status(503), {
        formNotice: createFormNotice("error", "Database is offline, cannot recover password."),
        formData
      });
    }

    try {
      await resetUserPassword({
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        newPassword: req.body.password
      });

      const redirectUrl = formData.role === "client" ? "/clientlogin" : "/professionallogin";
      req.session.loginNotice = createFormNotice("success", "Password updated successfully! You can now log in with your new password.");
      return res.redirect(redirectUrl);
    } catch (error) {
      return renderResetPasswordPage(res.status(error.statusCode || 500), {
        formNotice: createFormNotice("error", error.message || "Failed to update password."),
        formData
      });
    }
  }
);

app.get("/auth/google", async (req, res) => {
  const role = req.query.role === "professional" ? "professional" : "client";
  if (!isDatabaseReady()) {
    req.session.loginNotice = createFormNotice("error", "Database is offline, cannot authenticate session.");
    return res.redirect(role === "client" ? "/clientlogin" : "/professionallogin");
  }

  try {
    const redirectUrl = await getOAuthSignInUrl(role);
    return res.redirect(redirectUrl);
  } catch (error) {
    req.session.loginNotice = createFormNotice("error", `Google Auth failed: ${error.message}`);
    return res.redirect(role === "client" ? "/clientlogin" : "/professionallogin");
  }
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  const accessToken = req.query.access_token;
  const refreshToken = req.query.refresh_token;
  const role = req.query.role === "professional" ? "professional" : "client";

  if (!code && !accessToken) {
    return res.render("authCallbackParser", {
      title: "Verifying Authentication | SV Personnels",
      pageClass: "page-login",
      role
    });
  }

  if (!isDatabaseReady()) {
    req.session.loginNotice = createFormNotice("error", "Database is offline, cannot authenticate session.");
    return res.redirect(role === "client" ? "/clientlogin" : "/professionallogin");
  }

  try {
    let userProfile;
    if (code) {
      userProfile = await exchangeAuthCode(code, role);
    } else {
      userProfile = await exchangeAccessToken(accessToken, refreshToken, role);
    }

    req.session.user = userProfile;
    const redirectUrl = userProfile.role === "client" ? "/client/dashboard" : "/professional/dashboard";
    return res.redirect(redirectUrl);
  } catch (error) {
    req.session.loginNotice = createFormNotice("error", `Authentication failed: ${error.message}`);
    return res.redirect(role === "client" ? "/clientlogin" : "/professionallogin");
  }
});

app.get("/book-service/:professionalId", requireRole("client"), async (req, res) => {
  if (!isDatabaseReady()) {
    return renderBookingPage(res.status(503), {
      formNotice: createFormNotice("error", "Supabase is not connected yet, so booking is unavailable.")
    });
  }

  const professionalId = Number(req.params.professionalId);
  if (Number.isNaN(professionalId)) {
    return renderBookingPage(res.status(400), {
      formNotice: createFormNotice("error", "Invalid professional ID format.")
    });
  }

  const professional = await getProfessionalById(professionalId);
  if (!professional) {
    return renderBookingPage(res.status(404), {
      formNotice: createFormNotice("error", "That professional could not be found.")
    });
  }

  const serviceOptions = await getProfessionalServiceOptions(professionalId);
  const user = req.session.user || {};

  return renderBookingPage(res, {
    professional,
    serviceOptions,
    formData: {
      fullName: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      preferredDate: "",
      preferredTimeSlot: "",
      addressArea: "",
      budget: professional.startingPrice || "",
      serviceId: serviceOptions[0] ? String(serviceOptions[0].id) : "",
      details: ""
    }
  });
});

app.post(
  "/book-service/:professionalId",
  requireRole("client"),
  [
    body("fullName").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your full name."),
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("phone").trim().isLength({ min: 10, max: 20 }).withMessage("Please enter a valid phone number."),
    body("preferredDate").isISO8601().withMessage("Please select a valid preferred date."),
    body("preferredTimeSlot").trim().isLength({ min: 3, max: 80 }).withMessage("Please choose a time slot."),
    body("addressArea").trim().isLength({ min: 3, max: 180 }).withMessage("Please enter your area or address."),
    body("budget").isInt({ min: 100, max: 100000 }).withMessage("Please enter a valid budget in rupees."),
    body("serviceId").isInt({ min: 1 }).withMessage("Please select a service.")
  ],
  async (req, res) => {
    const professionalId = Number(req.params.professionalId);
    if (Number.isNaN(professionalId)) {
      return renderBookingPage(res.status(400), {
        formNotice: createFormNotice("error", "Invalid professional ID format."),
        professional: null,
        serviceOptions: [],
        formData: {
          fullName: sanitizeText(req.body.fullName),
          email: sanitizeText(req.body.email),
          phone: sanitizeText(req.body.phone),
          preferredDate: sanitizeText(req.body.preferredDate),
          preferredTimeSlot: sanitizeText(req.body.preferredTimeSlot),
          addressArea: sanitizeText(req.body.addressArea),
          budget: sanitizeText(req.body.budget),
          serviceId: sanitizeText(req.body.serviceId),
          details: sanitizeText(req.body.details)
        }
      });
    }
    const professional = isDatabaseReady() ? await getProfessionalById(professionalId) : null;
    const serviceOptions = isDatabaseReady() ? await getProfessionalServiceOptions(professionalId) : [];
    const errors = validationResult(req);
    const formData = {
      fullName: sanitizeText(req.body.fullName),
      email: sanitizeText(req.body.email),
      phone: sanitizeText(req.body.phone),
      preferredDate: sanitizeText(req.body.preferredDate),
      preferredTimeSlot: sanitizeText(req.body.preferredTimeSlot),
      addressArea: sanitizeText(req.body.addressArea),
      budget: sanitizeText(req.body.budget),
      serviceId: sanitizeText(req.body.serviceId),
      details: sanitizeText(req.body.details)
    };

    if (!professional) {
      return renderBookingPage(res.status(404), {
        formNotice: createFormNotice("error", "That professional could not be found."),
        professional,
        serviceOptions,
        formData
      });
    }

    if (!errors.isEmpty()) {
      return renderBookingPage(res.status(422), {
        formNotice: createFormNotice("error", errors.array()[0].msg),
        professional,
        serviceOptions,
        formData
      });
    }

    if (!isDatabaseReady()) {
      return renderBookingPage(res.status(503), {
        formNotice: createFormNotice("error", "Supabase is not connected yet, so booking is unavailable."),
        professional,
        serviceOptions,
        formData
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const paymentMethod = req.body.paymentMethod === "online" ? "Online Payment (UPI/Card)" : "Pay After Service (COD)";
    let formattedDetails = `${formData.details || ""}\n\n[Start OTP: ${otp}]\n[Payment Method: ${paymentMethod}]`.trim();
    if (req.body.latitude && req.body.longitude) {
      formattedDetails += `\n[Coordinates: ${req.body.latitude},${req.body.longitude}]`;
    }

    const bookingCode = await createBooking({
      clientId: req.session.user && req.session.user.role === "client" ? req.session.user.id : null,
      guestName: formData.fullName,
      guestEmail: formData.email,
      guestPhone: formData.phone,
      professionalId,
      serviceId: Number(formData.serviceId),
      preferredDate: formData.preferredDate,
      preferredTimeSlot: formData.preferredTimeSlot,
      addressArea: formData.addressArea,
      budgetInr: Number(formData.budget),
      details: formattedDetails
    });

    return renderBookingPage(res, {
      professional,
      serviceOptions,
      formNotice: createFormNotice(
        "success",
        `Booking request ${bookingCode} has been created successfully. The professional can now see it in their dashboard.`
      ),
      formData: {
        ...formData,
        details: ""
      }
    });
  }
);

app.get("/api/workers", async (req, res) => {
  try {
    const workers = await getWorkers({
      queryText: req.query.skill || req.query.name || "",
      cityQ: req.query.city || "",
      sortKey: req.query.sort || "relevance",
      verifiedOnly: String(req.query.verified || "").toLowerCase() === "true"
    });

    res.json(workers);
  } catch (error) {
    console.error("GET /api/workers error:", error.message);
    res.status(500).json([]);
  }
});

app.get("/api/professionals/:id/reviews", async (req, res) => {
  if (!isDatabaseReady()) {
    return res.json([]);
  }
  const professionalId = Number(req.params.id);
  if (Number.isNaN(professionalId)) {
    return res.status(400).json({ error: "Invalid professional ID." });
  }
  try {
    const { data, error } = await getClient()
      .from("reviews")
      .select("rating, review_text, reviewer_name, created_at")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    res.json(data || []);
  } catch (err) {
    console.error("GET /api/professionals/:id/reviews error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/professionals/:id/profile", async (req, res) => {
  if (!isDatabaseReady()) {
    return res.status(503).json({ error: "Database offline" });
  }

  const professionalId = Number(req.params.id);
  if (Number.isNaN(professionalId)) {
    return res.status(400).json({ error: "Invalid professional ID." });
  }

  try {
    const dbClient = getClient();
    
    // 1. Fetch professional details
    const { data: pro, error: proError } = await dbClient
      .from("professionals")
      .select("id, full_name, city, area, years_experience, photo_url, bio, is_verified, rating_avg, total_reviews, email, phone")
      .eq("id", professionalId)
      .maybeSingle();
    if (proError) throw proError;
    if (!pro) {
      return res.status(404).json({ error: "Professional not found." });
    }

    // 2. Fetch services mapped to this professional
    const { data: services, error: servicesError } = await dbClient
      .from("professional_services")
      .select("services(name)")
      .eq("professional_id", professionalId);
    if (servicesError) throw servicesError;
    const skills = (services || []).map(s => s.services?.name).filter(Boolean);

    // 3. Fetch reviews
    const { data: reviews, error: reviewsError } = await dbClient
      .from("reviews")
      .select("rating, review_text, reviewer_name, created_at")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false });
    if (reviewsError) throw reviewsError;

    // 4. Check if currently logged-in user has booked this professional
    let hasBooked = false;
    if (req.session && req.session.user && req.session.user.role === "client") {
      const { data: booking, error: bookingError } = await dbClient
        .from("bookings")
        .select("id")
        .eq("client_id", req.session.user.id)
        .eq("professional_id", professionalId)
        .limit(1)
        .maybeSingle();
      if (!bookingError && booking) {
        hasBooked = true;
      }
    }

    // 5. Mask contact details if not booked
    let displayPhone = pro.phone || "";
    let displayEmail = pro.email || "";
    if (!hasBooked) {
      if (displayPhone.length > 5) {
        displayPhone = displayPhone.slice(0, 3) + "XXXXX" + displayPhone.slice(-2);
      } else {
        displayPhone = "XXXXX XXXXX";
      }
      const atIdx = displayEmail.indexOf("@");
      if (atIdx > 2) {
        displayEmail = displayEmail.slice(0, 2) + "*****" + displayEmail.slice(atIdx);
      } else {
        displayEmail = "*****@email.com";
      }
    }

    res.json({
      id: pro.id,
      name: pro.full_name,
      city: pro.city,
      area: pro.area,
      experience: pro.years_experience,
      photo: pro.photo_url || DEFAULT_PHOTO,
      bio: pro.bio || "No biography provided.",
      isVerified: pro.is_verified,
      ratings: Number(pro.rating_avg || 0),
      totalReviews: Number(pro.total_reviews || 0),
      skills,
      reviews: reviews || [],
      hasBooked,
      contact: {
        phone: displayPhone,
        email: displayEmail
      }
    });
  } catch (err) {
    console.error("GET /api/professionals/:id/profile error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/client/bookings/:bookingId/cancel", requireRole("client"), async (req, res) => {
  if (!isDatabaseReady()) {
    req.session.clientDashboardNotice = createFormNotice("error", "Database connection offline.");
    return res.redirect("/client/dashboard");
  }

  const bookingId = Number(req.params.bookingId);
  const clientId = req.session.user.id;

  try {
    const dbClient = getClient();
    
    // Get the booking
    const { data: booking, error: bookingErr } = await dbClient
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .eq("client_id", clientId)
      .maybeSingle();

    if (bookingErr) throw bookingErr;

    if (!booking) {
      req.session.clientDashboardNotice = createFormNotice("error", "Booking not found.");
      return res.redirect("/client/dashboard");
    }

    if (booking.status === "completed" || booking.status === "cancelled") {
      req.session.clientDashboardNotice = createFormNotice("error", `Cannot cancel a booking that is already ${booking.status}.`);
      return res.redirect("/client/dashboard");
    }

    // Update status to cancelled
    const { error: cancelErr } = await dbClient
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    
    if (cancelErr) throw cancelErr;

    // Check new cancellation count
    const { count, error: countErr } = await dbClient
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("status", "cancelled");

    if (countErr) throw countErr;

    let noticeMessage = "Booking cancelled successfully.";
    if (booking.status === "confirmed") {
      noticeMessage += " A cancellation fee of ₹99 has been charged.";
    }

    if (count >= 10) {
      noticeMessage += " Your account has been permanently blocked due to exceeding 10 cancellations.";
    }

    req.session.clientDashboardNotice = createFormNotice(count >= 10 ? "error" : "success", noticeMessage);
  } catch (err) {
    req.session.clientDashboardNotice = createFormNotice("error", `Cancellation failed: ${err.message}`);
  }

  return res.redirect("/client/dashboard");
});

app.post("/professional/bookings/:bookingId/start-work", requireRole("professional"), async (req, res) => {
  if (!isDatabaseReady()) {
    req.session.professionalDashboardNotice = createFormNotice("error", "Database offline.");
    return res.redirect("/professional/dashboard");
  }

  const bookingId = Number(req.params.bookingId);
  const otpInput = String(req.body.otp).trim();

  try {
    const dbClient = getClient();
    const { data: booking, error } = await dbClient
      .from("bookings")
      .select("id, details, professional_id")
      .eq("id", bookingId)
      .eq("professional_id", req.session.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!booking) {
      req.session.professionalDashboardNotice = createFormNotice("error", "Booking not found.");
      return res.redirect("/professional/dashboard");
    }

    // Parse details to get OTP
    const details = booking.details || "";
    const otpMatch = details.match(/\[Start OTP:\s*(\d+)\]/);
    const expectedOtp = otpMatch ? otpMatch[1] : null;

    if (!expectedOtp || otpInput !== expectedOtp) {
      req.session.professionalDashboardNotice = createFormNotice("error", "Incorrect OTP. Please ask the client for the correct code.");
      return res.redirect("/professional/dashboard");
    }

    // Update details to mark work started
    const timestamp = new Date().toISOString();
    const updatedDetails = `${details}\n[Work Started At: ${timestamp}]`.trim();

    const { error: updateError } = await dbClient
      .from("bookings")
      .update({ details: updatedDetails })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    req.session.professionalDashboardNotice = createFormNotice("success", "OTP verified! Work timer has started.");
  } catch (err) {
    req.session.professionalDashboardNotice = createFormNotice("error", `Failed to start work: ${err.message}`);
  }

  return res.redirect("/professional/dashboard");
});

app.post("/professional/bookings/:bookingId/complete-work", requireRole("professional"), async (req, res) => {
  if (!isDatabaseReady()) {
    req.session.professionalDashboardNotice = createFormNotice("error", "Database offline.");
    return res.redirect("/professional/dashboard");
  }

  const bookingId = Number(req.params.bookingId);

  try {
    const dbClient = getClient();
    const { data: booking, error } = await dbClient
      .from("bookings")
      .select("id, details, professional_id, budget_inr")
      .eq("id", bookingId)
      .eq("professional_id", req.session.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!booking) {
      req.session.professionalDashboardNotice = createFormNotice("error", "Booking not found.");
      return res.redirect("/professional/dashboard");
    }

    const details = booking.details || "";
    const startedMatch = details.match(/\[Work Started At:\s*([^\]]+)\]/);
    const workStartedAt = startedMatch ? startedMatch[1] : null;

    if (!workStartedAt) {
      req.session.professionalDashboardNotice = createFormNotice("error", "Work was not started yet.");
      return res.redirect("/professional/dashboard");
    }

    const start = new Date(workStartedAt).getTime();
    const end = Date.now();
    const elapsedMs = end - start;
    const elapsedHours = elapsedMs / 3600000;
    
    // For demo purposes: if elapsed time is less than 1 hour, calculate a pro-rated charge based on minutes (min 1 min),
    // otherwise charge based on hours.
    const hourlyRate = booking.budget_inr || 500;
    let totalPayment = hourlyRate; // minimum 1 hour payment
    
    if (elapsedHours > 1) {
      totalPayment = Math.round(elapsedHours * hourlyRate);
    } else {
      // Pro-rate by minutes for demo visibility if it's under an hour, minimum 50% of hourly rate
      const elapsedMinutes = elapsedMs / 60000;
      if (elapsedMinutes > 1) {
        totalPayment = Math.max(Math.round((hourlyRate / 2)), Math.round((elapsedMinutes / 60) * hourlyRate));
      }
    }

    const completedTimestamp = new Date(end).toISOString();
    const updatedDetails = `${details}\n[Work Completed At: ${completedTimestamp}]\n[Total Payment: ${totalPayment}]`.trim();

    const { error: updateError } = await dbClient
      .from("bookings")
      .update({ 
        status: "completed",
        details: updatedDetails
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    req.session.professionalDashboardNotice = createFormNotice("success", `Work completed! Total charge calculated: ₹${totalPayment}.`);
  } catch (err) {
    req.session.professionalDashboardNotice = createFormNotice("error", `Failed to complete work: ${err.message}`);
  }

  return res.redirect("/professional/dashboard");
});

app.post("/client/bookings/:bookingId/pay", requireRole("client"), async (req, res) => {
  if (!isDatabaseReady()) {
    req.session.clientDashboardNotice = createFormNotice("error", "Database offline.");
    return res.redirect("/client/dashboard");
  }

  const bookingId = Number(req.params.bookingId);

  try {
    const dbClient = getClient();
    const { data: booking, error } = await dbClient
      .from("bookings")
      .select("id, details, client_id")
      .eq("id", bookingId)
      .eq("client_id", req.session.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!booking) {
      req.session.clientDashboardNotice = createFormNotice("error", "Booking not found.");
      return res.redirect("/client/dashboard");
    }

    const details = booking.details || "";
    const updatedDetails = `${details}\n[Payment Status: Paid via Razorpay]`.trim();

    const { error: updateError } = await dbClient
      .from("bookings")
      .update({ details: updatedDetails })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    req.session.clientDashboardNotice = createFormNotice("success", "Payment successful! Thank you for using SV Personnels.");
  } catch (err) {
    req.session.clientDashboardNotice = createFormNotice("error", `Payment failed: ${err.message}`);
  }

  return res.redirect("/client/dashboard");
});

const workerValidators = [
  body("name").isString().trim().isLength({ min: 2, max: 100 }),
  body("city").isString().trim().isLength({ min: 2, max: 100 }),
  body("skills").custom((value) => {
    if (Array.isArray(value)) return true;
    if (typeof value === "string" && value.trim().length > 0) return true;
    throw new Error("skills required");
  }),
  body("experience").isInt({ min: 0, max: 100 })
];

app.post("/api/workers", workerValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const worker = {
    id: `runtime-${Date.now()}`,
    _id: `runtime-${Date.now()}`,
    name: sanitizeText(req.body.name),
    city: sanitizeText(req.body.city),
    area: sanitizeText(req.body.city),
    experience: Number(req.body.experience) || 0,
    ratings: Number(req.body.ratings) || 0,
    distance: Number(req.body.distance) || 0,
    photo: sanitizeText(req.body.photo || DEFAULT_PHOTO),
    contact: sanitizeText(req.body.contact || ""),
    email: sanitizeText(req.body.contact || ""),
    phone: sanitizeText(req.body.contact || ""),
    skills: normalizeSkills(req.body.skills),
    description: sanitizeText(req.body.description || ""),
    isVerified: Boolean(req.body.isVerified),
    createdAt: new Date().toISOString(),
    startingPrice: Number(req.body.startingPrice) || 499,
    hourlyRateInr: Number(req.body.hourlyRateInr) || 499,
    totalReviews: 0
  };

  runtimeWorkers.unshift(worker);
  res.status(201).json(worker);
});

// --- ADMIN PORTAL ROUTES ---

app.get("/admin/login", (req, res) => res.redirect("/login"));

app.get("/admin/dashboard", requireRole("admin"), async (req, res) => {
  if (!isDatabaseReady()) {
    req.session.adminDashboardNotice = createFormNotice("error", "Supabase connection is offline.");
    return res.redirect("/");
  }

  try {
    const dashboardData = await getAdminDashboardData();
    return res.render("adminDashboard", {
      title: "Super Admin Dashboard | SV Personnels",
      pageClass: "page-dashboard",
      dashboardData,
      formNotice: consumeSessionNotice(req, "adminDashboardNotice")
    });
  } catch (error) {
    req.session.adminDashboardNotice = createFormNotice("error", `Dashboard load error: ${error.message}`);
    return res.render("adminDashboard", {
      title: "Super Admin Dashboard | SV Personnels",
      pageClass: "page-dashboard",
      dashboardData: {
        metrics: { totalClients: 0, totalProfessionals: 0, totalBookings: 0, pendingSupport: 0 },
        supportMessages: [],
        professionals: []
      },
      formNotice: consumeSessionNotice(req, "adminDashboardNotice")
    });
  }
});

// Admin reply to support ticket
app.post("/admin/support/:messageId/reply", requireRole("admin"), async (req, res) => {
  if (!isDatabaseReady()) {
    req.session.adminDashboardNotice = createFormNotice("error", "Database connection offline.");
    return res.redirect("/admin/dashboard");
  }

  const messageId = Number(req.params.messageId);
  const replyText = sanitizeText(req.body.replyText);

  if (!replyText) {
    req.session.adminDashboardNotice = createFormNotice("error", "Reply message cannot be empty.");
    return res.redirect("/admin/dashboard");
  }

  try {
    await replyToSupportMessage(messageId, replyText);
    req.session.adminDashboardNotice = createFormNotice("success", "Response submitted and ticket resolved.");
  } catch (error) {
    req.session.adminDashboardNotice = createFormNotice("error", `Failed to resolve ticket: ${error.message}`);
  }

  return res.redirect("/admin/dashboard");
});

// Admin verify professional partner
app.post("/admin/professionals/:professionalId/verify", requireRole("admin"), async (req, res) => {
  if (!isDatabaseReady()) {
    req.session.adminDashboardNotice = createFormNotice("error", "Database connection offline.");
    return res.redirect("/admin/dashboard");
  }

  const professionalId = Number(req.params.professionalId);
  const isVerified = req.body.isVerified === "true";

  try {
    await verifyProfessional(professionalId, isVerified);
    const message = isVerified ? "Partner profile approved & verified." : "Partner profile verification revoked.";
    req.session.adminDashboardNotice = createFormNotice("success", message);
  } catch (error) {
    req.session.adminDashboardNotice = createFormNotice("error", `Failed to update verification: ${error.message}`);
  }

  return res.redirect("/admin/dashboard");
});

// Admin delete professional partner
app.post("/admin/professionals/:professionalId/delete", requireRole("admin"), async (req, res) => {
  if (!isDatabaseReady()) {
    req.session.adminDashboardNotice = createFormNotice("error", "Database connection offline.");
    return res.redirect("/admin/dashboard");
  }

  const professionalId = Number(req.params.professionalId);

  try {
    await deleteProfessionalAccount(professionalId);
    req.session.adminDashboardNotice = createFormNotice("success", "Professional profile rejected and deleted successfully.");
  } catch (error) {
    req.session.adminDashboardNotice = createFormNotice("error", `Failed to delete professional: ${error.message}`);
  }

  return res.redirect("/admin/dashboard");
});

// Admin update service/department price
app.post(
  "/admin/services/:serviceId/price",
  requireRole("admin"),
  [
    param("serviceId").isInt({ min: 1 }).withMessage("Invalid service ID."),
    body("basePrice").isInt({ min: 0, max: 100000 }).withMessage("Please enter a valid base price in rupees.")
  ],
  async (req, res) => {
    if (!isDatabaseReady()) {
      req.session.adminDashboardNotice = createFormNotice("error", "Database connection offline.");
      return res.redirect("/admin/dashboard");
    }

    const serviceId = Number(req.params.serviceId);
    const basePrice = Number(req.body.basePrice);

    try {
      await updateServicePrice(serviceId, basePrice);
      req.session.adminDashboardNotice = createFormNotice("success", "Service base price updated successfully.");
    } catch (error) {
      req.session.adminDashboardNotice = createFormNotice("error", `Failed to update service price: ${error.message}`);
    }

    return res.redirect("/admin/dashboard");
  }
);

app.get("/admin/profile", requireRole("admin"), async (req, res) => {
  if (!isDatabaseReady()) {
    return res.redirect("/admin/login");
  }

  try {
    const profile = await getAdminProfile(req.session.user.id);
    return res.render("adminProfile", {
      title: "Admin Profile | SV Personnels",
      pageClass: "page-profile",
      profile,
      formNotice: consumeSessionNotice(req, "adminProfileNotice")
    });
  } catch (error) {
    req.session.adminDashboardNotice = createFormNotice("error", `Profile load error: ${error.message}`);
    return res.redirect("/admin/dashboard");
  }
});

app.post(
  "/admin/profile",
  requireRole("admin"),
  [
    body("fullname").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your full name."),
    body("email").trim().isEmail().withMessage("Please enter a valid email address.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.session.adminProfileNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/admin/profile");
    }

    if (!isDatabaseReady()) {
      req.session.adminProfileNotice = createFormNotice("error", "Database connection offline.");
      return res.redirect("/admin/profile");
    }

    try {
      const profileData = {
        fullName: sanitizeText(req.body.fullname),
        email: sanitizeText(req.body.email)
      };

      await updateAdminProfile(req.session.user.id, profileData);

      // Sync session details
      req.session.user.name = profileData.fullName;
      req.session.user.email = profileData.email;

      // Handle optional password change
      if (req.body.newPassword && req.body.newPassword.trim().length > 0) {
        if (req.body.newPassword.trim().length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        await changeAdminPassword(req.session.user.id, req.body.newPassword.trim());
        req.session.adminProfileNotice = createFormNotice("success", "Profile and password updated successfully!");
      } else {
        req.session.adminProfileNotice = createFormNotice("success", "Profile updated successfully!");
      }
    } catch (error) {
      req.session.adminProfileNotice = createFormNotice("error", `Failed to update profile: ${error.message}`);
    }

    return res.redirect("/admin/profile");
  }
);

// --- UPTIME / KEEP-ALIVE ROUTE ---
app.get("/ping", (req, res) => {
  res.status(200).send("OK");
});

async function startServer() {
  const state = await initializeSupabase();

  if (state.connected) {
    console.log(`Supabase connected successfully${state.projectUrl ? ` (${state.projectUrl})` : ""}`);
  } else {
    console.warn(`Supabase connection unavailable: ${state.lastError}`);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);

    // Self-ping every 10 minutes (600,000 ms) to prevent Render free tier from going to sleep
    if (process.env.NODE_ENV === "production" || process.env.RENDER || process.env.KEEP_ALIVE === "true") {
      const pingUrl = process.env.APP_URL || "https://svpersonnel.in/ping";
      console.log(`[KeepAlive] Starting self-ping scheduler targeting: ${pingUrl}`);
      setInterval(async () => {
        try {
          const res = await fetch(pingUrl);
          console.log(`[KeepAlive] Pinged ${pingUrl} - Status: ${res.status}`);
        } catch (err) {
          console.warn(`[KeepAlive] Ping failed: ${err.message}`);
        }
      }, 10 * 60 * 1000);
    }
  });
}

startServer();
