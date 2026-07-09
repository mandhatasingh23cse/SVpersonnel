module.exports = {
  // Real service categories — these populate the service catalog and admin pricing panel.
  // Professionals and clients are created only through real sign-ups; no fake seed data.
  services: [
    {
      name: "Guard & Security",
      slug: "guard-security",
      icon: "/assets/driver.png",
      description: "Trained security personnel, guards, bouncers, and residential/commercial security.",
      basePriceInr: 899
    },
    {
      name: "Hospital Staff",
      slug: "hospital-staff",
      icon: "/assets/home cleaning.png",
      description: "Nurses, ward boys, attendants, patient care, and hospital maintenance staff.",
      basePriceInr: 799
    },
    {
      name: "Hotel Staff",
      slug: "hotel-staff",
      icon: "/assets/cooking.png",
      description: "Chefs, waiters, housekeeping, front desk executives, and banquet attendants.",
      basePriceInr: 699
    },
    {
      name: "Outsourcing & Office",
      slug: "outsourcing-office",
      icon: "/assets/it support.png",
      description: "Office assistants, data entry operators, receptionist, and corporate outsourcing.",
      basePriceInr: 999
    },
    {
      name: "Pandit Ji",
      slug: "pandit-ji",
      icon: "/assets/connect.png",
      description: "Experienced Hindu priests for puja, havan, katha, marriage, and rituals.",
      basePriceInr: 1100
    },
    {
      name: "Interior Designing",
      slug: "interior-designing",
      icon: "/assets/fitness.png",
      description: "Complete house & office interior designing, layout planning, and execution.",
      basePriceInr: 2500
    },
    {
      name: "Plumbing",
      slug: "plumbing",
      icon: "/assets/plumbing.png",
      description: "Leak repair, fittings, drain cleaning, and bathroom fixes.",
      basePriceInr: 499
    },
    {
      name: "Electricians",
      slug: "electricians",
      icon: "/assets/electrician.png",
      description: "Wiring, repairs, installations, and power backup support.",
      basePriceInr: 599
    }
  ],
  professionals: [],
  clients: [],
  bookings: [],
  reviews: [],
  demoCredentials: null
};
