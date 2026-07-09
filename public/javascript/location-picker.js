/**
 * location-picker.js
 * Implements the city recommendation modal with Geocoding API and Geolocation ("Use current location")
 * exactly matching Screenshot 4.
 */
document.addEventListener("DOMContentLoaded", () => {
  initLocationPicker();
});

function initLocationPicker() {
  // Create Modal DOM once
  if (document.getElementById("locPickerModal")) return;

  const overlay = document.createElement("div");
  overlay.id = "locPickerModal";
  overlay.className = "loc-modal-overlay";

  overlay.innerHTML = `
    <div class="loc-modal-card">
      <div class="loc-modal-header">
        <div class="loc-search-row">
          <button type="button" class="loc-btn-back" id="locBtnBack" title="Back">←</button>
          <input type="text" id="locModalSearchInput" class="loc-search-input" placeholder="Search city, area, or locality..." autocomplete="off">
          <button type="button" class="loc-btn-clear" id="locBtnClear" title="Clear">×</button>
        </div>
      </div>
      <div class="loc-current-row" id="locBtnCurrent">
        <span style="font-size: 1.1rem;">🎯</span>
        <span>Use current location</span>
      </div>
      <div class="loc-recs-list" id="locRecsList">
        <!-- Recommendations populated here -->
      </div>
      <div class="loc-modal-footer">
        <span>powered by</span>
        <span class="loc-google-logo">Google</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const backBtn = document.getElementById("locBtnBack");
  const clearBtn = document.getElementById("locBtnClear");
  const modalInput = document.getElementById("locModalSearchInput");
  const currentBtn = document.getElementById("locBtnCurrent");
  const recsList = document.getElementById("locRecsList");

  let targetInput = null;
  let debounceTimer = null;

  const popularCities = [
    { title: "Gorakhpur", sub: "Uttar Pradesh, India" },
    { title: "Gurugram", sub: "Haryana, India" },
    { title: "New Delhi", sub: "National Capital Territory, India" },
    { title: "Mumbai", sub: "Maharashtra, India" },
    { title: "Bengaluru", sub: "Karnataka, India" },
    { title: "Noida", sub: "Uttar Pradesh, India" },
    { title: "Lucknow", sub: "Uttar Pradesh, India" },
    { title: "Pune", sub: "Maharashtra, India" }
  ];

  function openModal(inputElem) {
    targetInput = inputElem;
    modalInput.value = targetInput.value || "";
    overlay.classList.add("open");
    modalInput.focus();
    renderRecommendations(modalInput.value.trim());
  }

  function closeModal() {
    overlay.classList.remove("open");
    targetInput = null;
  }

  backBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  clearBtn.addEventListener("click", () => {
    modalInput.value = "";
    modalInput.focus();
    renderRecommendations("");
  });

  // Attach to all city/location inputs
  const attachTargets = () => {
    const inputs = document.querySelectorAll('input#city, input[name="city"], input#locationInput, .location-input');
    inputs.forEach(inp => {
      if (!inp.dataset.locAttached) {
        inp.dataset.locAttached = "true";
        inp.setAttribute("readonly", "true"); // Prevent mobile keyboard clash with our clean modal
        inp.style.cursor = "pointer";
        inp.addEventListener("click", () => openModal(inp));
        inp.addEventListener("focus", () => openModal(inp));
      }
    });
  };

  attachTargets();
  // Re-check periodically for dynamic inputs
  setInterval(attachTargets, 2000);

  function selectLocation(cityName, fullAddress = "", placeDetails = null) {
    if (targetInput) {
      targetInput.value = cityName;
      targetInput.dispatchEvent(new Event("input", { bubbles: true }));
      targetInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Auto-fill area or address fields if present on the same form/page
    if (placeDetails) {
      const addr = placeDetails.address || {};
      const exactArea = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village || addr.quarter || addr.subdistrict || "";
      const fullFormatted = placeDetails.display_name || fullAddress || "";

      const areaInput = document.querySelector('input[name="area"], input#area, input[name="addressArea"], input#addressArea');
      if (areaInput && !areaInput.value.trim() && exactArea) {
        areaInput.value = exactArea;
        areaInput.dispatchEvent(new Event("input", { bubbles: true }));
      }

      const streetInput = document.querySelector('input[name="street"], input#street, input[name="serviceAddress"], textarea[name="serviceAddress"], input[name="address"]');
      if (streetInput && !streetInput.value.trim() && fullFormatted) {
        streetInput.value = fullFormatted;
        streetInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    closeModal();
  }

  // Use Current Location with high precision GPS & zoom=18 reverse geocoding
  currentBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    currentBtn.innerHTML = `<span style="font-size: 1.1rem;">⌛</span><span>Fetching precise GPS coordinates...</span>`;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          // zoom=18 requests street/building level precision from Nominatim OpenStreetMap
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.state_district || addr.town || addr.county || addr.state || "Current Location";
          currentBtn.innerHTML = `<span style="font-size: 1.1rem;">🎯</span><span>Use current location</span>`;
          selectLocation(city, data.display_name, data);
        } catch (err) {
          currentBtn.innerHTML = `<span style="font-size: 1.1rem;">🎯</span><span>Use current location</span>`;
          selectLocation("Gurugram", "Haryana, India");
        }
      },
      (err) => {
        currentBtn.innerHTML = `<span style="font-size: 1.1rem;">🎯</span><span>Use current location</span>`;
        alert("Unable to retrieve high-precision GPS location. Please make sure location access is allowed in your browser settings, or select/type your city.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });

  // Render list from local or live API
  function renderListItems(items) {
    recsList.innerHTML = "";
    if (!items || items.length === 0) {
      recsList.innerHTML = `<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 0.9rem;">No location recommendations found.</div>`;
      return;
    }
    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "loc-rec-item";
      row.innerHTML = `
        <span class="loc-rec-icon">📍</span>
        <div class="loc-rec-content">
          <span class="loc-rec-title">${item.title}</span>
          <span class="loc-rec-sub">${item.sub || ""}</span>
        </div>
      `;
      row.addEventListener("click", () => selectLocation(item.title, item.sub));
      recsList.appendChild(row);
    });
  }

  async function renderRecommendations(query) {
    if (!query) {
      renderListItems(popularCities);
      return;
    }

    // Check if query matches our popular list first
    const localMatches = popularCities.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));
    if (localMatches.length > 0) {
      renderListItems(localMatches);
    } else {
      recsList.innerHTML = `<div style="padding: 20px; text-align: center; color: #64748b; font-size: 0.9rem;">Searching live locations for "${query}"...</div>`;
    }

    // Call live API
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&addressdetails=1&limit=8`);
        const data = await res.json();
        if (data && data.length > 0) {
          const apiItems = data.map(place => {
            const addr = place.address || {};
            const title = addr.city || addr.town || addr.suburb || addr.state_district || place.name || query;
            const sub = place.display_name.split(",").slice(1).join(",").trim();
            return { title, sub };
          });
          // Remove duplicates
          const unique = [];
          const seen = new Set();
          apiItems.forEach(it => {
            if (!seen.has(it.title.toLowerCase())) {
              seen.add(it.title.toLowerCase());
              unique.push(it);
            }
          });
          renderListItems(unique.length > 0 ? unique : localMatches);
        }
      } catch (err) {
        // Fallback to local filtering
        const fallback = popularCities.filter(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.sub.toLowerCase().includes(query.toLowerCase()));
        if (fallback.length > 0) renderListItems(fallback);
      }
    }, 300);
  }

  modalInput.addEventListener("input", (e) => {
    renderRecommendations(e.target.value.trim());
  });
}
