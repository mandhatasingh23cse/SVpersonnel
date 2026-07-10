const navigation = [
  { href: "/findHelpNow", label: "Professionals" },
  { href: "/work", label: "Work" },
  { href: "/howitworks", label: "How it works" },
  { href: "/contactus", label: "Contact" }
];

const services = [
  { name: "Guard & Security", icon: "/assets/driver.png", description: "Trained security personnel, guards, and bouncers" },
  { name: "Hospital Staff", icon: "/assets/home cleaning.png", description: "Nurses, ward boys, attendants, medical support" },
  { name: "Hotel Staff", icon: "/assets/cooking.png", description: "Chefs, waiters, housekeeping, front desk" },
  { name: "Outsourcing & Office", icon: "/assets/it support.png", description: "Office assistants, data entry, corporate staffing" },
  { name: "Pandit Ji", icon: "/assets/connect.png", description: "Experienced Hindu priests for puja, havan, sanskars" },
  { name: "Interior Designing", icon: "/assets/fitness.png", description: "Complete house & office interior design and execution" },
  { name: "Plumbing", icon: "/assets/plumbing.png", description: "Leak repairs, bathroom fittings, pipe maintenance" },
  { name: "Electricians", icon: "/assets/electrician.png", description: "Wiring, power backup, residential & industrial repairs" }
];

const ottCategories = [
  {
    id: 1,
    title: "1. Security Services",
    headerIcon: "🛡️",
    badge: "TOP CATEGORY",
    badgeColor: "linear-gradient(135deg, #f43f5e, #ec4899)",
    items: [
      { name: "Security Guards", tag: "TOP 10", icon: "👮‍♂️", desc: "Trained residential & commercial guards" },
      { name: "Armed Security Guards", tag: "SPECIALIZED", icon: "🛡️", desc: "Licensed armed protection officers" },
      { name: "Lady Security Guards", tag: "POPULAR", icon: "👮‍♀️", desc: "Professional female security personnel" },
      { name: "Bouncers", tag: "HEAVY DUTY", icon: "🕶️", desc: "Event & VIP crowd control bouncers" },
      { name: "CCTV Operators", tag: "24/7 SURVEILLANCE", icon: "📹", desc: "Expert camera monitoring operators" },
      { name: "Security Supervisors", tag: "MANAGEMENT", icon: "🎖️", desc: "Experienced site security leaders" },
      { name: "Event Security", tag: "ON DEMAND", icon: "🎪", desc: "Complete security teams for events & shows" }
    ]
  },
  {
    id: 2,
    title: "2. Housekeeping & Facility Management",
    headerIcon: "🧹",
    badge: "HIGH DEMAND",
    badgeColor: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    items: [
      { name: "Housekeeping Staff", tag: "TOP 10", icon: "🧹", desc: "Daily maintenance & sanitation crew" },
      { name: "Office Boys/Girls", tag: "POPULAR", icon: "🏢", desc: "Efficient pantry & desk assistance" },
      { name: "Janitors", tag: "VERIFIED", icon: "🧽", desc: "Complete commercial cleaning care" },
      { name: "Cleaners", tag: "INSTANT HIRE", icon: "✨", desc: "Deep cleaning & surface sanitizers" },
      { name: "Pantry Staff", tag: "HOSPITALITY", icon: "☕", desc: "Tea, coffee & snack serving staff" },
      { name: "Deep Cleaning Staff", tag: "SPECIALISTS", icon: "🧼", desc: "Heavy machine washing & deep clean" },
      { name: "Waste Management Staff", tag: "ECO CARE", icon: "♻️", desc: "Garbage collection & recycling handlers" }
    ]
  },
  {
    id: 3,
    title: "3. Office & Corporate Staff",
    headerIcon: "🏢",
    badge: "CORPORATE HUB",
    badgeColor: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    items: [
      { name: "Receptionists", tag: "FRONT DESK", icon: "💁‍♀️", desc: "Professional corporate receptionists" },
      { name: "Office Assistants", tag: "POPULAR", icon: "📋", desc: "Versatile administrative helpers" },
      { name: "Front Desk Executives", tag: "TOP RATED", icon: "🖥️", desc: "First-impression guest relations executives" },
      { name: "Back Office Executives", tag: "OPERATIONS", icon: "🗂️", desc: "Data processing & backend operations" },
      { name: "Data Entry Operators", tag: "FAST TYPING", icon: "⌨️", desc: "Accurate Excel & MIS data entry" },
      { name: "Computer Operators", tag: "SKILLED", icon: "💻", desc: "Software & system operation specialists" },
      { name: "Telecallers", tag: "VOICE SUPPORT", icon: "📞", desc: "Inbound & outbound calling staff" },
      { name: "Customer Support Executives", tag: "CLIENT CARE", icon: "🎧", desc: "Helpdesk & customer issue resolution" },
      { name: "HR Support Staff", tag: "TALENT", icon: "🤝", desc: "Recruitment assistance & employee coordination" },
      { name: "Accountants", tag: "FINANCE", icon: "📊", desc: "Tally, GST & accounting specialists" },
      { name: "Administrative Staff", tag: "MANAGEMENT", icon: "📁", desc: "General office administration coordinators" }
    ]
  },
  {
    id: 4,
    title: "4. Industrial & Factory Workforce",
    headerIcon: "🏭",
    badge: "BULK MANPOWER",
    badgeColor: "linear-gradient(135deg, #f59e0b, #ef4444)",
    items: [
      { name: "Skilled Labour", tag: "CERTIFIED", icon: "⚙️", desc: "Technically trained industrial craftsmen" },
      { name: "Unskilled Labour", tag: "ON DEMAND", icon: "🧱", desc: "Reliable manual work & support manpower" },
      { name: "Factory Workers", tag: "SHIFTS", icon: "🏭", desc: "Dedicated assembly line & plant workers" },
      { name: "Production Workers", tag: "TOP 10", icon: "🔧", desc: "Manufacturing & packaging units crew" },
      { name: "Machine Operators", tag: "SPECIALIZED", icon: "🖥️", desc: "CNC, lathe & heavy machinery operators" },
      { name: "Packers", tag: "FAST TRACK", icon: "📦", desc: "Accurate product boxing & dispatch packers" },
      { name: "Loaders & Unloaders", tag: "HEAVY LIFT", icon: "🚛", desc: "Efficient cargo handling & loading staff" },
      { name: "Warehouse Workers", tag: "LOGISTICS", icon: "🏬", desc: "Inventory stacking & depot handlers" },
      { name: "Helpers", tag: "ASSISTANTS", icon: "👷", desc: "General plant and workshop helpers" },
      { name: "Factory Supervisors", tag: "LEADERS", icon: "🦺", desc: "Shop floor production & safety supervisors" }
    ]
  },
  {
    id: 5,
    title: "5. Construction & Civil Workers",
    headerIcon: "👷",
    badge: "INFRASTRUCTURE",
    badgeColor: "linear-gradient(135deg, #10b981, #059669)",
    items: [
      { name: "Masons", tag: "EXPERT", icon: "🧱", desc: "Brickwork, plastering & civil masons" },
      { name: "Carpenters", tag: "TOP RATED", icon: "🪚", desc: "Woodwork, shuttering & interior framing" },
      { name: "Painters", tag: "FINISHING", icon: "🖌️", desc: "Exterior & interior putty and coat painting" },
      { name: "Welders", tag: "CERTIFIED", icon: "👨‍🏭", desc: "Arc, TIG & MIG welding fabricators" },
      { name: "Fabricators", tag: "STRUCTURAL", icon: "🏗️", desc: "Steel & aluminium structure fabrication" },
      { name: "Bar Benders", tag: "REINFORCEMENT", icon: "⛓️", desc: "RCC bar bending & grid tying specialists" },
      { name: "Tile Fitters", tag: "PRECISION", icon: "🔲", desc: "Marble, granite & vitrified tile layers" },
      { name: "Scaffolders", tag: "SAFETY", icon: "🪜", desc: "High-rise scaffolding erection & safety crew" },
      { name: "Concrete Workers", tag: "HEAVY DUTY", icon: "🚧", desc: "Mixing, pouring & curing concrete experts" }
    ]
  },
  {
    id: 6,
    title: "6. Technical & Maintenance Staff",
    headerIcon: "🔧",
    badge: "24/7 REPAIR",
    badgeColor: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    items: [
      { name: "Electricians", tag: "TOP 10", icon: "⚡", desc: "3-phase wiring, DB panel & fault repair" },
      { name: "Plumbers", tag: "POPULAR", icon: "🚰", desc: "Leakage repair, piping & sanitary fittings" },
      { name: "AC Technicians", tag: "SEASON FAVORITE", icon: "❄️", desc: "Split/Window AC servicing & gas refilling" },
      { name: "HVAC Technicians", tag: "COMMERCIAL", icon: "🌬️", desc: "Chiller plants & duct ventilation maintenance" },
      { name: "Lift Technicians", tag: "CRITICAL", icon: "🛗", desc: "Elevator servicing & emergency troubleshooting" },
      { name: "Solar Technicians", tag: "GREEN TECH", icon: "☀️", desc: "Solar panel setup & inverter maintenance" },
      { name: "Mechanics", tag: "MACHINERY", icon: "🔩", desc: "Multi-utility pump & motor repair mechanics" },
      { name: "Diesel Mechanics", tag: "POWER GEN", icon: "⛽", desc: "DG set maintenance & diesel engine overhaul" },
      { name: "Maintenance Technicians", tag: "ALL ROUNDER", icon: "🛠️", desc: "Comprehensive building multi-technicians" }
    ]
  },
  {
    id: 7,
    title: "7. Healthcare & Hospital Staffing",
    headerIcon: "🏥",
    badge: "MEDICAL CARE",
    badgeColor: "linear-gradient(135deg, #ec4899, #f43f5e)",
    items: [
      { name: "Doctors", tag: "VERIFIED", icon: "👨‍⚕️", desc: "Qualified resident & visiting medical officers" },
      { name: "Nurses", tag: "TOP 10", icon: "👩‍⚕️", desc: "Certified ICU, ward & emergency nurses" },
      { name: "Ward Boys", tag: "ESSENTIAL", icon: "🏥", desc: "Patient shifting & bedside support staff" },
      { name: "Ward Girls", tag: "COMPASSIONATE", icon: "🏩", desc: "Attentive female hospital care attendants" },
      { name: "Pharmacists", tag: "LICENSED", icon: "💊", desc: "Hospital & clinical dispensary pharmacists" },
      { name: "Lab Technicians", tag: "DIAGNOSTICS", icon: "🔬", desc: "Pathology, blood test & lab operators" },
      { name: "OT Technicians", tag: "CRITICAL CARE", icon: "🩺", desc: "Operation theatre setup & surgeon assistance" },
      { name: "ICU Staff", tag: "SPECIALIZED", icon: "🫀", desc: "Highly trained intensive care support team" },
      { name: "Ambulance Drivers", tag: "EMERGENCY", icon: "🚑", desc: "Fast-response emergency medical drivers" },
      { name: "Hospital Receptionists", tag: "FRONT DESK", icon: "📋", desc: "Patient admission & billing receptionists" },
      { name: "Caregivers", tag: "ELDER CARE", icon: "🤍", desc: "Dedicated home care & senior citizen companions" },
      { name: "Home Nurses", tag: "HOME MEDICAL", icon: "🏡", desc: "Post-surgery & chronic care home nurses" }
    ]
  },
  {
    id: 8,
    title: "8. Hospitality & Hotel Staff",
    headerIcon: "🍽️",
    badge: "PREMIUM SERVICE",
    badgeColor: "linear-gradient(135deg, #eab308, #f97316)",
    items: [
      { name: "Chefs", tag: "MASTERCHEF", icon: "👨‍🍳", desc: "Multi-cuisine executive & head chefs" },
      { name: "Cooks", tag: "POPULAR", icon: "🍳", desc: "North/South Indian & continental line cooks" },
      { name: "Waiters", tag: "SERVICE", icon: "🍽️", desc: "Polished restaurant banquet & dining waiters" },
      { name: "Stewards", tag: "HOSPITALITY", icon: "🍾", desc: "F&B service captains & stewards" },
      { name: "Bartenders", tag: "MIXOLOGISTS", icon: "🍸", desc: "Skilled cocktail & bar management staff" },
      { name: "Kitchen Helpers", tag: "PREP CREW", icon: "🥗", desc: "Vegetable chopping & kitchen assistance" },
      { name: "Dishwashers", tag: "CLEAN KITCHEN", icon: "🧼", desc: "Commercial dishwasher & utility crew" },
      { name: "Hotel Receptionists", tag: "CONCIERGE", icon: "🛎️", desc: "Welcoming hotel check-in & concierge staff" },
      { name: "Housekeeping Staff", tag: "ROOM CARE", icon: "🛏️", desc: "Immaculate guest room housekeeping team" }
    ]
  },
  {
    id: 9,
    title: "9. Domestic & Personal Staff",
    headerIcon: "🏠",
    badge: "HOME COMFORT",
    badgeColor: "linear-gradient(135deg, #14b8a6, #06b6d4)",
    items: [
      { name: "Maids", tag: "TOP 10", icon: "🧹", desc: "Trusted part-time & full-time housemaids" },
      { name: "Babysitters", tag: "CHILD CARE", icon: "👶", desc: "Caring & attentive child care babysitters" },
      { name: "Nannies", tag: "LIVE-IN", icon: "🍼", desc: "Professional full-time infant & kids nannies" },
      { name: "Elder Care Staff", tag: "EMPATHY", icon: "👵", desc: "Gentle elder companionship & daily assistance" },
      { name: "Home Cooks", tag: "HOMEMADE", icon: "🍲", desc: "Hygienic daily home meals preparation" },
      { name: "Personal Drivers", tag: "CHAUFFEUR", icon: "🚘", desc: "Experienced luxury & family car drivers" },
      { name: "Gardeners", tag: "GREEN THUMB", icon: "🌱", desc: "Lawn trimming & botanical garden care" },
      { name: "Personal Assistants", tag: "EXECUTIVE", icon: "📝", desc: "Schedule management & personal errands" }
    ]
  },
  {
    id: 10,
    title: "10. Logistics & Transportation",
    headerIcon: "🚚",
    badge: "FAST TRACK",
    badgeColor: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    items: [
      { name: "Drivers", tag: "COMMERCIAL", icon: "🚗", desc: "LTV & HTV commercial transport drivers" },
      { name: "Delivery Executives", tag: "TOP 10", icon: "📦", desc: "Quick last-mile parcel & courier riders" },
      { name: "Truck Drivers", tag: "HEAVY VEHICLE", icon: "🚛", desc: "Long-haul freight & highway truck drivers" },
      { name: "Forklift Operators", tag: "LICENSED", icon: "🚜", desc: "Precision warehouse forklift operators" },
      { name: "Warehouse Staff", tag: "INVENTORY", icon: "🏬", desc: "Sorting, scanning & rack stocking staff" },
      { name: "Dispatch Executives", tag: "OPERATIONS", icon: "📋", desc: "Shipment manifest & dispatch controllers" },
      { name: "Inventory Staff", tag: "AUDITORS", icon: "📊", desc: "Stock counting & warehouse inventory controllers" }
    ]
  },
  {
    id: 11,
    title: "11. Retail & Sales Staff",
    headerIcon: "🛍️",
    badge: "STORE BOOST",
    badgeColor: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    items: [
      { name: "Sales Executives", tag: "TOP SELLER", icon: "🤝", desc: "Target-driven showroom & field sales staff" },
      { name: "Cashiers", tag: "ACCURATE", icon: "💳", desc: "POS billing counters & cash handling experts" },
      { name: "Store Managers", tag: "LEADERSHIP", icon: "🏬", desc: "Complete retail outlet operational leaders" },
      { name: "Merchandisers", tag: "DISPLAY", icon: "🏷️", desc: "Visual shelf setup & brand merchandisers" },
      { name: "Promoters", tag: "BRAND ING", icon: "📢", desc: "Mall & event promotional brand ambassadors" },
      { name: "Customer Service Staff", tag: "ASSIST", icon: "✨", desc: "In-store customer query & assistance staff" }
    ]
  },
  {
    id: 12,
    title: "12. Event Management Staff",
    headerIcon: "🎉",
    badge: "EVENT READY",
    badgeColor: "linear-gradient(135deg, #f43f5e, #f97316)",
    items: [
      { name: "Event Helpers", tag: "CREW", icon: "🎈", desc: "Setup, dismantling & logistics event crew" },
      { name: "Event Coordinators", tag: "PLANNERS", icon: "📋", desc: "Smooth backstage & timeline coordinators" },
      { name: "Registration Staff", tag: "WELCOME", icon: "🎟️", desc: "Guest check-in & badge distribution desk" },
      { name: "Ushers", tag: "VIP SERVICE", icon: "🎩", desc: "Polished seating & guest guidance ushers" },
      { name: "Stage Crew", tag: "TECHNICAL", icon: "🎙️", desc: "Audio, lighting & stage prop handlers" },
      { name: "Event Security", tag: "CROWD SAFE", icon: "🛡️", desc: "Concert, wedding & exhibition bouncers" },
      { name: "Volunteers", tag: "SUPPORT", icon: "🙌", desc: "Enthusiastic ground support event volunteers" }
    ]
  },
  {
    id: 13,
    title: "13. Education Staffing",
    headerIcon: "🎓",
    badge: "ACADEMIC",
    badgeColor: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    items: [
      { name: "Teachers", tag: "QUALIFIED", icon: "👩‍🏫", desc: "Primary, secondary & high school subject teachers" },
      { name: "Professors", tag: "EXPERT", icon: "👨‍🏫", desc: "College & university experienced lecturers" },
      { name: "Tutors", tag: "HOME TUITION", icon: "📚", desc: "Personalized home & online coaching tutors" },
      { name: "Lab Assistants", tag: "SCIENCE", icon: "🔬", desc: "Physics, Chemistry & Biology lab assistants" },
      { name: "School Receptionists", tag: "FRONT DESK", icon: "🏫", desc: "Welcoming parent inquiry & school receptionists" },
      { name: "Administrative Staff", tag: "CAMPUS", icon: "🗂️", desc: "Examination, fee & student records admins" }
    ]
  },
  {
    id: 14,
    title: "14. Agriculture & Farming Staff",
    headerIcon: "🌾",
    badge: "AGRI FORCE",
    badgeColor: "linear-gradient(135deg, #10b981, #eab308)",
    items: [
      { name: "Farm Workers", tag: "SEASONAL", icon: "🧑‍🌾", desc: "Planting, irrigation & cultivation farmhands" },
      { name: "Dairy Workers", tag: "LIVESTOCK", icon: "🐄", desc: "Cattle care, milking & dairy farm operators" },
      { name: "Greenhouse Staff", tag: "HORTICULTURE", icon: "🪴", desc: "Nursery, sapling & climate-controlled plant care" },
      { name: "Tractor Drivers", tag: "MACHINERY", icon: "🚜", desc: "Ploughing, harvesting & transport tractor drivers" },
      { name: "Harvest Workers", tag: "PEAK SEASON", icon: "🌾", desc: "Fast crop picking, threshing & bagging crew" }
    ]
  },
  {
    id: 15,
    title: "15. Pandit & Religious Services",
    headerIcon: "🕉️",
    badge: "DIVINE PUJA",
    badgeColor: "linear-gradient(135deg, #f97316, #ef4444)",
    items: [
      { name: "Pandit Ji for Pooja", tag: "TOP 10", icon: "🪔", desc: "General home & auspicious occasion pooja" },
      { name: "Wedding Pandit", tag: "VIVAH SANSKAR", icon: "🌺", desc: "Traditional Vedic Hindu marriage ceremonies" },
      { name: "Satyanarayan Katha", tag: "POPULAR", icon: "📖", desc: "Complete katha recitation and prasad vidhi" },
      { name: "Griha Pravesh Pooja", tag: "NEW HOME", icon: "🏡", desc: "Housewarming vastu shanti & havan vidhi" },
      { name: "Vastu Pooja", tag: "HARMONY", icon: "🧭", desc: "Vastu dosh nivaran & architectural blessing" },
      { name: "Bhoomi Pujan", tag: "FOUNDATION", icon: "⛏️", desc: "Land blessing before new construction" },
      { name: "Mundan Sanskar", tag: "TRADITION", icon: "👶", desc: "Sacred first hair cutting ceremony vidhi" },
      { name: "Namkaran Ceremony", tag: "BLESSING", icon: "📿", desc: "Auspicious baby naming ceremony rituals" },
      { name: "Engagement Ceremony", tag: "SAGAI", icon: "💍", desc: "Roka & ring ceremony religious blessings" },
      { name: "Havan & Yagya", tag: "PURIFICATION", icon: "🔥", desc: "Vedic fire sacrifice for peace & prosperity" },
      { name: "Rudrabhishek", tag: "MAHADEV", icon: "🔱", desc: "Sacred Shivling jal/dugdha abhishek vidhi" },
      { name: "Navgraha Pooja", tag: "ASTROLOGY", icon: "🪐", desc: "Nine planets pacification & dosh nivaran" },
      { name: "Shradh & Pind Daan", tag: "PITRU SHANTI", icon: "🙏", desc: "Ancestral peace & shraddh rituals vidhi" },
      { name: "Temple Priests", tag: "NITYA PUJA", icon: "🛕", desc: "Full-time & part-time temple care priests" },
      { name: "Religious Event Management", tag: "TURNKEY", icon: "🎪", desc: "Complete jagran, kirtan & pravachan organization" }
    ]
  }
];

module.exports = {
  brand: {
    name: "SV Personnels",
    city: "All India",
    tagline: "Govt. Authorized Professional Job & Hiring Provider across India. समस्या आपकी, समाधान हमारा ❤️",
    phone: "+91 9807209005",
    email: "personnelsv@gmail.com"
  },
  navigation,
  footer: {
    columns: [
      {
        heading: "Explore",
        links: [
          { href: "/", label: "Home" },
          { href: "/findHelpNow", label: "Professionals" },
          { href: "/work", label: "Work" },
          { href: "/howitworks", label: "How it works" },
          { href: "/terms", label: "Terms & Conditions" },
          { href: "/payment-policy", label: "Payment Policy" },
          { href: "/refund-policy", label: "Refund Policy" }
        ]
      },
      {
        heading: "Accounts",
        links: [
          { href: "/signup", label: "Create account" },
          { href: "/clientlogin", label: "Client login" },
          { href: "/professionallogin", label: "Professional login" },
          { href: "/admin/login", label: "Admin Portal" }
        ]
      },
      {
        heading: "Manpower & Jobs",
        links: [
          { href: "/register", label: "Join SV Personnels" },
          { href: "/contactus", label: "Partner with us" },
          { href: "/contactus", label: "Support" }
        ]
      }
    ],
    socialLinks: [
      { href: "#", label: "Facebook", icon: "/assets/facebook.png" },
      { href: "#", label: "LinkedIn", icon: "/assets/linked in.png" },
      { href: "https://www.instagram.com/svpersonnel_official?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", label: "Instagram", icon: "/assets/insta logo.png" }
    ]
  },
  home: {
    hero: {
      eyebrow: "Govt. Authorized Job Provider & Hiring Agency",
      title: "All-in-one manpower solutions across India — Pandit ji to Plumber, Home to Office.",
      description:
        "We are Govt. authorized professional job providers & hiring specialists. Outsourcing, Guard-Security, Hospital Staff, Hotel Staff, Interior Designing & all manpower segments. समस्या आपकी समाधान हमारा ❤️",
      searchPlaceholder: "Search Security Guard, Hospital Staff, Plumber, Pandit ji...",
      locationPlaceholder: "Enter your city or state (All India)",
      quickSearches: ["Security Guard", "Hospital Staff", "Hotel Staff", "Outsourcing", "Pandit ji", "Plumber"],
      trustPills: ["Govt. Authorized", "All India Verified", "Direct Hiring", "Outsourcing Specialists"],
      stats: [
        { value: "All India", label: "Verified Network" },
        { value: "Govt. Auth", label: "Job & Hiring Provider" },
        { value: "100%", label: "Trusted Manpower" }
      ]
    },
    services,
    capabilities: [
      {
        title: "All India Manpower Coverage",
        description: "From household workers like plumbers and cooks to corporate outsourcing, hospital staff, and security."
      },
      {
        title: "Govt. Authorized & Verified",
        description: "Every professional and agency staff member undergoes background verification for safety and trust."
      },
      {
        title: "समस्या आपकी, समाधान हमारा ❤️",
        description: "Whether you need urgent home repairs, hotel staff, or turnkey interior designing, we deliver reliable solutions."
      }
    ],
    steps: [
      { step: "01", title: "Search Requirement", description: "Select from our vast segments of manpower or search by skill." },
      { step: "02", title: "Verify Profiles", description: "Review ratings, experience, and verification status across India." },
      { step: "03", title: "Hire & Collaborate", description: "Connect with verified personnel or request tailored outsourcing." }
    ],
    personas: [
      {
        badge: "For Employers & Clients",
        title: "Hire trusted manpower across India",
        description: "A complete solution for hospitals, hotels, corporate offices, and households needing verified staff.",
        bullets: [
          "Govt. authorized hiring agency",
          "Guard, hospital, and hotel staffing",
          "Dedicated support & fast placement"
        ]
      },
      {
        badge: "For Job Seekers & Professionals",
        title: "Join India's trusted job network",
        description: "Are you a skilled professional or seeking job opportunities? Register with us to get verified and hired.",
        bullets: [
          "Direct access to genuine employers",
          "Clear profile presentation",
          "Pan-India job opportunities"
        ]
      }
    ],
    testimonials: [
      {
        name: "Rajesh Sharma",
        role: "Hospitality Manager, Delhi NCR",
        quote: "SV Personnels provided us with verified hotel staff and guards on urgent notice. Highly professional service!",
        image: "/assets/rajesh 2ndpage.png"
      },
      {
        name: "Sunita Verma",
        role: "Hospital Administrator, Lucknow",
        quote: "We rely on SV Personnels for hospital attendants and nursing staff. Their verification process gives us complete peace of mind.",
        image: "/assets/Priya S.png"
      },
      {
        name: "Anil Kumar",
        role: "Security Supervisor, Mumbai",
        quote: "Joining SV Personnels helped me get placed as a head security guard at a top corporate office.",
        image: "/assets/suresh 2ndpage.png"
      }
    ],
    ottCategories
  },
  discover: {
    eyebrow: "Professionals",
    title: "Search verified professionals all over India.",
    description: "Search by skill, segment, or city across India. Compare ratings and experience transparently.",
    quickFilters: ["Guard-Security", "Hospital Staff", "Hotel Staff", "Outsourcing", "Pandit Ji", "Plumber"]
  },
  howItWorks: {
    eyebrow: "How it works",
    title: "Simple steps for hiring manpower and getting hired across India.",
    description: "SV Personnels bridges the gap between verified job seekers and employers across every sector.",
    outcomes: [
      { title: "Pan-India Reach", description: "Connect with verified professionals in any city across India." },
      { title: "Govt. Authorized Trust", description: "Work with a certified recruitment and outsourcing leader." },
      { title: "All Segments Covered", description: "From spiritual needs (Pandit ji) to technical trades and interior design." }
    ]
  },
  contact: {
    eyebrow: "Contact Us",
    title: "Talk to the SV Personnels team.",
    description: "Reach out for corporate outsourcing, guard security contracts, hotel staffing, or individual queries.",
    promises: [
      { title: "Corporate Staffing", description: "Tailored outsourcing for offices, hospitals, and hotels." },
      { title: "Guard & Security", description: "Deployment of trained security guards across commercial or residential sites." },
      { title: "Job Seekers Support", description: "Assistance for workers and professionals onboarding to the portal." }
    ]
  },
  auth: {
    client: {
      title: "Create your employer / client account",
      description: "Create an account to hire verified manpower, manage staffing requests, and track bookings.",
      benefits: [
        "Request urgent staff placement",
        "Keep verified workers & agencies in one dashboard",
        "Pan-India support and tracking"
      ]
    },
    clientLogin: {
      title: "Welcome back to SV Personnels",
      description: "Log in to manage your bookings and staffing requests."
    },
    proLogin: {
      title: "Partner / Job Seeker login",
      description: "Log in to update your skills, review hiring requests, and connect with employers."
    },
    professional: {
      title: "Join the SV Personnels network",
      description: "Register your profile as a service professional or job seeker to get discovered by employers across India.",
      benefits: [
        "Showcase your skills & experience",
        "Get Govt. authorized verification badge",
        "Receive direct hiring and booking requests"
      ]
    },
    note: "Create an account to access verified professionals and job opportunities all over India."
  }
};
