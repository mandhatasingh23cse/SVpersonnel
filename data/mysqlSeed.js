module.exports = {
  // Real service categories — these populate the service catalog and admin pricing panel.
  // Professionals and clients are created only through real sign-ups; no fake seed data.
  services: [
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
    },
    {
      name: "Drivers",
      slug: "drivers",
      icon: "/assets/driver.png",
      description: "Local travel, office commute, airport pickup, and day duty.",
      basePriceInr: 799
    },
    {
      name: "Home cleaning",
      slug: "home-cleaning",
      icon: "/assets/home cleaning.png",
      description: "Deep cleaning, kitchen cleaning, and recurring upkeep.",
      basePriceInr: 699
    },
    {
      name: "Delivery",
      slug: "delivery",
      icon: "/assets/delivery.png",
      description: "Local errands, document pickup, and same-day delivery.",
      basePriceInr: 349
    },
    {
      name: "IT support",
      slug: "it-support",
      icon: "/assets/Screenshot 2025-09-23 151227.png",
      description: "Laptop repair, Wi-Fi setup, printer help, and CCTV checks.",
      basePriceInr: 899
    },
    {
      name: "Laundry",
      slug: "laundry",
      icon: "/assets/laundry.png",
      description: "Wash, iron, pickup, and express laundry turnaround.",
      basePriceInr: 299
    },
    {
      name: "Fitness",
      slug: "fitness",
      icon: "/assets/fitness.png",
      description: "Personal training, home sessions, and weekly coaching.",
      basePriceInr: 999
    }
  ],
  professionals: [],
  clients: [],
  bookings: [],
  reviews: [],
  demoCredentials: null
};
