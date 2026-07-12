module.exports = {
  // Real service categories — these populate the service catalog, admin pricing panel, and skill selection.
  // Professionals and clients are created only through real sign-ups; no fake seed data.
  services: [
    {
      name: "Security Services",
      slug: "security-services",
      icon: "/assets/driver.png",
      description: "Trained residential & commercial security, armed guards, bouncers, CCTV operators, and supervisors.",
      basePriceInr: 899,
      subskills: [
        "Security Guards",
        "Armed Security Guards",
        "Lady Security Guards",
        "Bouncers",
        "CCTV Operators",
        "Security Supervisors",
        "Event Security"
      ]
    },
    {
      name: "Housekeeping & Facility Management",
      slug: "housekeeping-facility-management",
      icon: "/assets/home cleaning.png",
      description: "Daily maintenance, sanitation crew, office assistants, janitors, deep cleaning, and waste management.",
      basePriceInr: 799,
      subskills: [
        "Housekeeping Staff",
        "Office Boys/Girls",
        "Janitors",
        "Cleaners",
        "Pantry Staff",
        "Deep Cleaning Staff",
        "Waste Management Staff"
      ]
    },
    {
      name: "Office & Corporate Staff",
      slug: "office-corporate-staff",
      icon: "/assets/it support.png",
      description: "Receptionists, front desk executives, back office, data entry operators, telecallers, and accountants.",
      basePriceInr: 999,
      subskills: [
        "Receptionists",
        "Office Assistants",
        "Front Desk Executives",
        "Back Office Executives",
        "Data Entry Operators",
        "Computer Operators",
        "Telecallers",
        "Customer Support Executives",
        "HR Support Staff",
        "Accountants",
        "Administrative Staff"
      ]
    },
    {
      name: "Industrial & Factory Workforce",
      slug: "industrial-factory-workforce",
      icon: "/assets/connect.png",
      description: "Skilled/unskilled labour, factory workers, machine operators, packers, loaders, and supervisors.",
      basePriceInr: 850,
      subskills: [
        "Skilled Labour",
        "Unskilled Labour",
        "Factory Workers",
        "Production Workers",
        "Machine Operators",
        "Packers",
        "Loaders & Unloaders",
        "Warehouse Workers",
        "Helpers",
        "Factory Supervisors"
      ]
    },
    {
      name: "Construction & Civil Workers",
      slug: "construction-civil-workers",
      icon: "/assets/plumbing.png",
      description: "Masons, carpenters, painters, welders, fabricators, bar benders, tile fitters, and scaffolders.",
      basePriceInr: 900,
      subskills: [
        "Masons",
        "Carpenters",
        "Painters",
        "Welders",
        "Fabricators",
        "Bar Benders",
        "Tile Fitters",
        "Scaffolders",
        "Concrete Workers"
      ]
    },
    {
      name: "Technical & Maintenance Staff",
      slug: "technical-maintenance-staff",
      icon: "/assets/electrician.png",
      description: "Electricians, plumbers, AC/HVAC technicians, lift technicians, solar technicians, and mechanics.",
      basePriceInr: 699,
      subskills: [
        "Electricians",
        "Plumbers",
        "AC Technicians",
        "HVAC Technicians",
        "Lift Technicians",
        "Solar Technicians",
        "Mechanics",
        "Diesel Mechanics",
        "Maintenance Technicians"
      ]
    },
    {
      name: "Healthcare & Hospital Staffing",
      slug: "healthcare-hospital-staffing",
      icon: "/assets/fitness.png",
      description: "Doctors, ICU/ward nurses, ward boys/girls, pharmacists, lab/OT technicians, and caregivers.",
      basePriceInr: 1100,
      subskills: [
        "Doctors",
        "Nurses",
        "Ward Boys",
        "Ward Girls",
        "Pharmacists",
        "Lab Technicians",
        "OT Technicians",
        "ICU Staff",
        "Ambulance Drivers",
        "Hospital Receptionists",
        "Caregivers",
        "Home Nurses"
      ]
    },
    {
      name: "Hospitality & Hotel Staff",
      slug: "hospitality-hotel-staff",
      icon: "/assets/cooking.png",
      description: "Executive chefs, cooks, polished banquet waiters, stewards, bartenders, and kitchen helpers.",
      basePriceInr: 799,
      subskills: [
        "Chefs",
        "Cooks",
        "Waiters",
        "Stewards",
        "Bartenders",
        "Kitchen Helpers",
        "Dishwashers",
        "Hotel Receptionists",
        "Housekeeping Staff"
      ]
    },
    {
      name: "Domestic & Personal Staff",
      slug: "domestic-personal-staff",
      icon: "/assets/home cleaning.png",
      description: "Trusted maids, babysitters, live-in nannies, elder care staff, home cooks, and personal drivers.",
      basePriceInr: 650,
      subskills: [
        "Maids",
        "Babysitters",
        "Nannies",
        "Elder Care Staff",
        "Home Cooks",
        "Personal Drivers",
        "Gardeners",
        "Personal Assistants"
      ]
    },
    {
      name: "Logistics & Transportation",
      slug: "logistics-transportation",
      icon: "/assets/driver.png",
      description: "Commercial drivers, quick delivery executives, heavy truck drivers, and forklift operators.",
      basePriceInr: 899,
      subskills: [
        "Drivers",
        "Delivery Executives",
        "Truck Drivers",
        "Forklift Operators",
        "Warehouse Staff",
        "Dispatch Executives",
        "Inventory Staff"
      ]
    },
    {
      name: "Retail & Sales Staff",
      slug: "retail-sales-staff",
      icon: "/assets/connect.png",
      description: "Target-driven sales executives, cashiers, store managers, merchandisers, and promoters.",
      basePriceInr: 799,
      subskills: [
        "Sales Executives",
        "Cashiers",
        "Store Managers",
        "Merchandisers",
        "Promoters",
        "Customer Service Staff"
      ]
    },
    {
      name: "Event Management Staff",
      slug: "event-management-staff",
      icon: "/assets/fitness.png",
      description: "Event crew helpers, timeline coordinators, registration desk staff, ushers, and stage crew.",
      basePriceInr: 850,
      subskills: [
        "Event Helpers",
        "Event Coordinators",
        "Registration Staff",
        "Ushers",
        "Stage Crew",
        "Event Security",
        "Volunteers"
      ]
    },
    {
      name: "Education Staffing",
      slug: "education-staffing",
      icon: "/assets/it support.png",
      description: "Qualified school teachers, college professors, home tutors, and science lab assistants.",
      basePriceInr: 950,
      subskills: [
        "Teachers",
        "Professors",
        "Tutors",
        "Lab Assistants",
        "School Receptionists",
        "Administrative Staff"
      ]
    },
    {
      name: "Agriculture & Farming Staff",
      slug: "agriculture-farming-staff",
      icon: "/assets/plumbing.png",
      description: "Farm hands, dairy farm operators, greenhouse staff, tractor drivers, and harvest workers.",
      basePriceInr: 600,
      subskills: [
        "Farm Workers",
        "Dairy Workers",
        "Greenhouse Staff",
        "Tractor Drivers",
        "Harvest Workers"
      ]
    },
    {
      name: "Pandit & Religious Services",
      slug: "pandit-religious-services",
      icon: "/assets/connect.png",
      description: "Vedic priests for wedding, satyanarayan katha, griha pravesh, vastu pooja, havan, and rituals.",
      basePriceInr: 1100,
      subskills: [
        "Pandit Ji for Pooja",
        "Wedding Pandit",
        "Satyanarayan Katha",
        "Griha Pravesh Pooja",
        "Vastu Pooja",
        "Bhoomi Pujan",
        "Mundan Sanskar",
        "Namkaran Ceremony",
        "Engagement Ceremony",
        "Havan & Yagya",
        "Rudrabhishek",
        "Navgraha Pooja",
        "Shradh & Pind Daan",
        "Temple Priests",
        "Religious Event Management"
      ]
    }
  ],
  professionals: [],
  clients: [],
  bookings: [],
  reviews: [],
  demoCredentials: null
};
