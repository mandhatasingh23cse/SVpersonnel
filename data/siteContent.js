const navigation = [
  { href: "/findHelpNow", label: "Find manpower" },
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
          { href: "/findHelpNow", label: "Find manpower" },
          { href: "/howitworks", label: "How it works" },
          { href: "/terms", label: "Terms & Conditions" }
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
    ]
  },
  discover: {
    eyebrow: "Find Manpower",
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
