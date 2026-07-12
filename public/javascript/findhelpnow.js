document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("discoverApp");
  if (!root) return;

  const DEFAULT_CITY = "Gurugram";

  const form = document.getElementById("discoverForm");
  const queryInput = document.getElementById("search-query");
  const cityInput = document.getElementById("search-city");
  const sortSelect = document.getElementById("sort-select");
  const verifiedToggle = document.getElementById("verified-only");
  const radiusLimitToggle = document.getElementById("radius-limit");
  const searchLocationBtn = document.getElementById("btn-search-location");
  const clearButton = document.getElementById("clear-search");
  const resultsHeading = document.getElementById("resultsHeading");
  const resultsSummary = document.getElementById("resultsSummary");
  const resultsGrid = document.getElementById("resultsGrid");
  const loadingState = document.getElementById("loadingState");

  const state = {
    query: root.dataset.initialQuery || "",
    city: root.dataset.initialCity || "",
    sort: root.dataset.initialSort || "relevance",
    verifiedOnly: root.dataset.initialVerified === "true",
    radiusLimit: false,
    results: []
  };

  queryInput.value = state.query;
  cityInput.value = state.city;
  sortSelect.value = state.sort;
  verifiedToggle.checked = state.verifiedOnly;

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeSkills(skills) {
    if (Array.isArray(skills)) return skills.filter(Boolean);
    if (typeof skills === "string") {
      return skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }
    return [];
  }

  function sortResults(list, sortKey) {
    const results = [...list];

    results.sort((left, right) => {
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

    return results;
  }

  function getVisibleResults() {
    let filtered = state.verifiedOnly
      ? state.results.filter((worker) => worker.isVerified)
      : [...state.results];

    if (state.radiusLimit) {
      filtered = filtered.filter((worker) => worker.distance <= 50);
    }

    return sortResults(filtered, state.sort);
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (state.query) params.set("skill", state.query);
    if (state.city) params.set("city", state.city);
    if (state.sort && state.sort !== "relevance") params.set("sort", state.sort);
    if (state.verifiedOnly) params.set("verified", "true");

    const nextUrl = params.toString() ? `/findHelpNow?${params.toString()}` : "/findHelpNow";
    window.history.replaceState({}, "", nextUrl);
  }

  function formatPhone(value = "") {
    const digits = String(value).replace(/[^\d]/g, "");
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }

    return String(value || "").trim();
  }

  function renderSkeletons() {
    resultsGrid.innerHTML = Array.from({ length: 3 }, () => `
      <article class="skeleton-card">
        <div class="skeleton-line is-short"></div>
        <div class="skeleton-line is-medium"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line is-medium"></div>
      </article>
    `).join("");
  }

  function updateHeading(list) {
    const pieces = [];
    if (state.query) pieces.push(`for "${state.query}"`);
    if (state.city) pieces.push(`in ${state.city}`);

    if (state.query || state.city) {
      resultsHeading.textContent = `${list.length} professional${list.length === 1 ? "" : "s"} ${pieces.join(" ")}`.trim();
      resultsSummary.textContent = state.verifiedOnly
        ? "Verified-only mode is active."
        : "Compare experience, ratings, and distance before you contact someone.";
      return;
    }

    resultsHeading.textContent = `Featured professionals around ${DEFAULT_CITY}`;
    resultsSummary.textContent =
      "Browse local professionals first, then narrow the list only when you need to.";
  }

  function renderEmptyState() {
    resultsGrid.innerHTML = `
      <div class="empty-state">
        <h3>No professionals matched that search.</h3>
        <p>Try a broader service, a nearby location, or start with one of the suggested categories.</p>
        <div class="empty-actions">
          <button type="button" class="chip-button" data-suggest-query="Electrician">Electrician</button>
          <button type="button" class="chip-button" data-suggest-query="Plumber">Plumber</button>
          <button type="button" class="chip-button" data-suggest-query="Driver">Driver</button>
        </div>
      </div>
    `;
  }

  function renderResults() {
    const visibleResults = getVisibleResults();
    updateHeading(visibleResults);

    if (!visibleResults.length) {
      renderEmptyState();
      return;
    }

    resultsGrid.innerHTML = visibleResults
      .map((worker) => {
        const skills = normalizeSkills(worker.skills);
        const description =
          worker.description ||
          "Experienced local professional available for nearby service requests and repeat work.";
        const photo = encodeURI(worker.photo || "/assets/gigconnect.logo.png");
        const similarSearchHref = `/findHelpNow?skill=${encodeURIComponent(skills[0] || worker.name)}&city=${encodeURIComponent(worker.city || DEFAULT_CITY)}`;
        const bookHref = worker.id ? `/book-service/${encodeURIComponent(worker.id)}` : "/contactus";
        const price = Number(worker.partTimeRate || worker.startingPrice || worker.hourlyRateInr || 0);
        const phoneDisplay = formatPhone(worker.phone || worker.contact);
        const emailDisplay = String(worker.email || "").trim();
        const hasDirectContact = Boolean(phoneDisplay || emailDisplay);
        const contactPanelId = `discover-contact-${escapeHtml(String(worker.id || worker._id || worker.name).replace(/[^a-zA-Z0-9_-]/g, "-"))}`;
        const priceLabel = price > 0
          ? new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0
            }).format(price) + "/Day approx. (Part-Time)"
          : "Fixed Part-Time Rate";

        return `
          <article class="result-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.5rem;">
              <span style="background: linear-gradient(135deg, #f43f5e, #ec4899); color: #fff; font-weight: 800; font-size: 0.82rem; padding: 4px 10px; border-radius: 8px; letter-spacing: 0.04em; box-shadow: 0 2px 8px rgba(244, 63, 94, 0.4);">
                PRO ID: #${worker.id || 'N/A'}
              </span>
              <span style="font-size: 0.8rem; color: #38bdf8; font-weight: 700;">Instant Booking Available</span>
            </div>
            <div class="result-card-top">
              <div class="result-identity" style="cursor: pointer;" data-open-profile-btn data-pro-id="${worker.id}">
                <img
                  class="result-avatar"
                  src="${escapeHtml(photo)}"
                  alt="${escapeHtml(worker.name)}"
                  onerror="this.src='/assets/gigconnect.logo.png'"
                >
                <div>
                  <h3 style="text-decoration: underline; text-underline-offset: 4px; transition: color var(--transition);">${escapeHtml(worker.name)}</h3>
                  <div class="result-badges">
                    <span class="result-badge is-rating">${escapeHtml((Number(worker.ratings) || 0).toFixed(1))} / 5 rating</span>
                    ${worker.isVerified ? '<span class="result-badge is-verified">Verified profile</span>' : '<span class="result-badge">New profile</span>'}
                  </div>
                </div>
              </div>

              <div class="result-badges">
                <span class="result-badge">${escapeHtml(worker.city || DEFAULT_CITY)}</span>
              </div>
            </div>

            <div class="result-meta">
              <span>${escapeHtml(String(worker.experience || 0))} years experience</span>
              <span>Work: Part Time</span>
              <span style="color: #38bdf8; font-weight: 700;">${escapeHtml(priceLabel)}</span>
            </div>

            <div class="result-skills">
              ${skills.map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join("")}
            </div>

            <p class="result-description">${escapeHtml(description)}</p>

            <div class="result-actions">
              <a href="${escapeHtml(bookHref)}" class="button button-primary">Book now</a>
              <button type="button" class="button button-secondary" data-reviews-toggle data-pro-id="${worker.id}" data-pro-name="${escapeHtml(worker.name)}">View reviews</button>
              <a href="${escapeHtml(similarSearchHref)}" class="button button-secondary">View similar</a>
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function fetchProfessionals() {
    loadingState.hidden = false;
    renderSkeletons();

    const params = new URLSearchParams();
    if (state.query) {
      params.set("skill", state.query);
      params.set("name", state.query);
    }
    if (state.city) params.set("city", state.city);

    const endpoint = params.toString() ? `/api/workers?${params.toString()}` : "/api/workers";

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Worker API did not return an array.");
      }

      state.results = data.map((worker) => ({
        ...worker,
        skills: normalizeSkills(worker.skills)
      }));

      updateUrl();
      renderResults();
    } catch (error) {
      console.error("Failed to fetch professionals:", error);
      resultsHeading.textContent = "Unable to load professionals right now";
      resultsSummary.textContent = "Please try again in a moment or contact support if the problem continues.";
      resultsGrid.innerHTML = `
        <div class="empty-state">
          <h3>Something went wrong while loading the marketplace.</h3>
          <p>Please try again or contact the SV Personnels team if the issue continues.</p>
          <div class="empty-actions">
            <a href="/contactus" class="button button-primary">Contact support</a>
          </div>
        </div>
      `;
    } finally {
      loadingState.hidden = true;
    }
  }

  function applyFormState() {
    state.query = queryInput.value.trim();
    state.city = cityInput.value.trim();
    state.sort = sortSelect.value;
    state.verifiedOnly = verifiedToggle.checked;
    state.radiusLimit = radiusLimitToggle.checked;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    applyFormState();
    await fetchProfessionals();
  });

  sortSelect.addEventListener("change", () => {
    applyFormState();
    updateUrl();
    renderResults();
  });

  verifiedToggle.addEventListener("change", () => {
    applyFormState();
    updateUrl();
    renderResults();
  });

  radiusLimitToggle.addEventListener("change", () => {
    applyFormState();
    renderResults();
  });

  function fetchIpLocationSearch() {
    searchLocationBtn.innerHTML = "⌛ IP Fetching...";
    searchLocationBtn.disabled = true;
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(data => {
        if (data && data.city) {
          cityInput.value = data.city;
          state.city = data.city;
          radiusLimitToggle.checked = true;
          state.radiusLimit = true;
          searchLocationBtn.innerHTML = "📍 Location Saved (IP)";
          searchLocationBtn.disabled = false;
          fetchProfessionals();
        } else {
          throw new Error("Invalid IP location data");
        }
      })
      .catch(err => {
        console.error(err);
        alert("Unable to retrieve location automatically (HTTPS is required for GPS on mobile). Please type it manually.");
        searchLocationBtn.innerHTML = "📍 Use Current Location";
        searchLocationBtn.disabled = false;
      });
  }

  cityInput.addEventListener("input", async () => {
    const val = cityInput.value.trim();
    const infoBadge = document.getElementById("pincode-location-info");
    if (infoBadge) infoBadge.textContent = "";
    if (val.length === 6 && !isNaN(val)) {
      if (infoBadge) infoBadge.textContent = "⌛ Looking up Pincode...";
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
          const po = data[0].PostOffice[0];
          if (infoBadge) infoBadge.textContent = `📍 Pincode ${val}: ${po.District || po.Division}, ${po.State}`;
        } else if (infoBadge) {
          infoBadge.textContent = "❌ Pincode not found";
        }
      } catch (e) {
        if (infoBadge) infoBadge.textContent = "";
      }
    }
  });

  searchLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      fetchIpLocationSearch();
      return;
    }

    searchLocationBtn.innerHTML = "⌛ Fetching...";
    searchLocationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Reverse geocode via OpenStreetMap Nominatim
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.postcode || "Nearby";
              cityInput.value = city;
              state.city = city;
              const infoBadge = document.getElementById("pincode-location-info");
              if (infoBadge && data.address.postcode) {
                infoBadge.textContent = `📍 Exact Area: ${data.address.suburb || data.address.neighbourhood || city} (${data.address.postcode})`;
              }
            } else {
              cityInput.value = "Nearby";
              state.city = "Nearby";
            }
            radiusLimitToggle.checked = true;
            state.radiusLimit = true;
            searchLocationBtn.innerHTML = "📍 Location Saved";
            searchLocationBtn.disabled = false;
            
            // Trigger search
            fetchProfessionals();
          })
          .catch(err => {
            console.error(err);
            cityInput.value = "Nearby";
            state.city = "Nearby";
            radiusLimitToggle.checked = true;
            state.radiusLimit = true;
            searchLocationBtn.innerHTML = "📍 Location Saved";
            searchLocationBtn.disabled = false;
            fetchProfessionals();
          });
      },
      (error) => {
        console.error(error);
        fetchIpLocationSearch();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });

  clearButton.addEventListener("click", async () => {
    state.query = "";
    state.city = "";
    state.sort = "relevance";
    state.verifiedOnly = false;
    state.radiusLimit = false;

    queryInput.value = "";
    cityInput.value = "";
    sortSelect.value = "relevance";
    verifiedToggle.checked = false;
    radiusLimitToggle.checked = false;

    updateUrl();
    await fetchProfessionals();
  });

  root.addEventListener("click", (event) => {
    const suggestedButton = event.target.closest("[data-suggest-query]");
    if (!suggestedButton) return;

    queryInput.value = suggestedButton.dataset.suggestQuery || "";
    queryInput.focus();
  });

  function showReviewsModal(proId, proName) {
    let backdrop = document.getElementById("reviews-modal-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "reviews-modal-backdrop";
      backdrop.className = "reviews-modal-backdrop";
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="reviews-modal">
        <div class="reviews-modal-header">
          <h2>Reviews for ${escapeHtml(proName)}</h2>
          <button class="reviews-modal-close" id="close-reviews-modal">&times;</button>
        </div>
        <div class="reviews-modal-body" id="reviews-modal-content">
          <p class="loading-state">Loading reviews...</p>
        </div>
      </div>
    `;

    backdrop.classList.add("is-open");

    const closeBtn = backdrop.querySelector("#close-reviews-modal");
    closeBtn.addEventListener("click", () => {
      backdrop.classList.remove("is-open");
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove("is-open");
      }
    });

    fetch(`/api/professionals/${proId}/reviews`)
      .then((res) => res.json())
      .then((reviews) => {
        const contentEl = backdrop.querySelector("#reviews-modal-content");
        if (!reviews || !reviews.length) {
          contentEl.innerHTML = `<div class="reviews-list-empty">No reviews yet for this professional.</div>`;
          return;
        }

        contentEl.innerHTML = reviews
          .map((rev) => {
            const stars = "★".repeat(rev.rating) + "☆".repeat(5 - rev.rating);
            const dateStr = new Date(rev.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });
            return `
              <div class="review-item">
                <div class="review-item-header">
                  <span class="review-item-author">${escapeHtml(rev.reviewer_name)}</span>
                  <span class="review-item-stars">${stars}</span>
                </div>
                ${rev.review_text ? `<p class="review-item-text">${escapeHtml(rev.review_text)}</p>` : ""}
                <span class="review-item-date">${dateStr}</span>
               </div>
            `;
          })
          .join("");
      })
      .catch((err) => {
        console.error(err);
        const contentEl = backdrop.querySelector("#reviews-modal-content");
        contentEl.innerHTML = `<div class="reviews-list-empty">Failed to load reviews. Please try again.</div>`;
      });
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-reviews-toggle]");
    if (btn) {
      const proId = btn.dataset.proId;
      const proName = btn.dataset.proName;
      showReviewsModal(proId, proName);
    }

    const profileBtn = e.target.closest("[data-open-profile-btn]");
    if (profileBtn) {
      const proId = profileBtn.dataset.proId;
      showProfessionalProfileModal(proId);
    }
  });

  function showProfessionalProfileModal(proId) {
    let backdrop = document.getElementById("profile-modal-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "profile-modal-backdrop";
      backdrop.className = "reviews-modal-backdrop";
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="reviews-modal" style="width: min(650px, 100%);">
        <div class="reviews-modal-header">
          <h2 id="profile-modal-title">Loading Profile...</h2>
          <button class="reviews-modal-close" id="close-profile-modal">&times;</button>
        </div>
        <div class="reviews-modal-body" id="profile-modal-content">
          <p class="loading-state">Loading details...</p>
        </div>
      </div>
    `;

    backdrop.classList.add("is-open");

    const closeBtn = backdrop.querySelector("#close-profile-modal");
    closeBtn.addEventListener("click", () => {
      backdrop.classList.remove("is-open");
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove("is-open");
      }
    });

    fetch(`/api/professionals/${proId}/profile`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          backdrop.querySelector("#profile-modal-content").innerHTML = `<div class="reviews-list-empty">${escapeHtml(data.error)}</div>`;
          return;
        }

        backdrop.querySelector("#profile-modal-title").textContent = data.name;

        let reviewsHtml = `<div class="reviews-list-empty">No reviews yet for this professional.</div>`;
        if (data.reviews && data.reviews.length) {
          reviewsHtml = data.reviews.map(rev => {
            const stars = "★".repeat(rev.rating) + "☆".repeat(5 - rev.rating);
            const dateStr = new Date(rev.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });
            return `
              <div class="review-item">
                <div class="review-item-header">
                  <span class="review-item-author">${escapeHtml(rev.reviewer_name)}</span>
                  <span class="review-item-stars">${stars}</span>
                </div>
                ${rev.review_text ? `<p class="review-item-text">${escapeHtml(rev.review_text)}</p>` : ""}
                <span class="review-item-date">${dateStr}</span>
              </div>
            `;
          }).join("");
        }

        const blurStyle = data.hasBooked ? "" : "filter: blur(5px); user-select: none; pointer-events: none;";
        const lockBadge = data.hasBooked 
          ? "" 
          : `<div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(3, 7, 18, 0.4); border-radius: var(--radius-md); z-index: 10;">
               <span style="font-size: 1.5rem; margin-bottom: 0.25rem;">🔒</span>
               <span style="font-size: 0.85rem; font-weight: 700; color: var(--text);">Book to unlock contact details</span>
             </div>`;

        backdrop.querySelector("#profile-modal-content").innerHTML = `
          <div style="display: flex; gap: 1.5rem; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap;">
            <img src="${escapeHtml(data.photo)}" alt="${escapeHtml(data.name)}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent);">
            <div style="flex: 1; min-width: 200px;">
              <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                <span class="result-badge is-rating">${data.ratings.toFixed(1)} / 5 rating</span>
                ${data.isVerified ? '<span class="result-badge is-verified">Verified</span>' : '<span class="result-badge">New profile</span>'}
              </div>
              <p style="margin: 0.25rem 0; font-weight: 600; color: var(--text);">${data.experience} years experience | ${data.city}</p>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                ${data.skills.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join("")}
              </div>
            </div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text);">About</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin: 0;">${escapeHtml(data.bio)}</p>
          </div>

          <div style="margin-bottom: 1.5rem; position: relative; padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--line); background: rgba(255, 255, 255, 0.02); display: grid; gap: 0.75rem;">
            <h3 style="font-size: 1.1rem; margin: 0; color: var(--text);">Contact Details</h3>
            <div style="display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; ${blurStyle}">
              <div>
                <span style="font-size: 0.8rem; color: var(--text-soft); display: block;">Phone</span>
                <strong style="color: var(--text);">${escapeHtml(data.contact.phone)}</strong>
              </div>
              <div>
                <span style="font-size: 0.8rem; color: var(--text-soft); display: block;">Email</span>
                <strong style="color: var(--text);">${escapeHtml(data.contact.email)}</strong>
              </div>
            </div>
            ${lockBadge}
          </div>

          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem; color: var(--text);">Reviews (${data.totalReviews})</h3>
            <div style="display: grid; gap: 1rem; max-height: 250px; overflow-y: auto;">
              ${reviewsHtml}
            </div>
          </div>
        `;
      })
      .catch(err => {
        console.error(err);
        backdrop.querySelector("#profile-modal-content").innerHTML = `<div class="reviews-list-empty">Failed to load profile.</div>`;
      });
  }

  // Search Autocomplete Logic
  const searchSuggestions = document.getElementById("search-suggestions");
  let searchDebounceTimeout;

  cityInput.addEventListener("input", () => {
    clearTimeout(searchDebounceTimeout);
    const query = cityInput.value.trim();
    if (query.length < 3) {
      searchSuggestions.style.display = "none";
      return;
    }

    searchDebounceTimeout = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            searchSuggestions.innerHTML = data.map(item => {
              return `
                <div class="suggestion-item" data-name="${item.display_name}" style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--line); font-size: 0.85rem; color: #f8fafc; text-align: left; transition: background 0.2s;">
                  ${item.display_name}
                </div>
              `;
            }).join("");
            searchSuggestions.style.display = "block";

            // Add click listeners to items
            searchSuggestions.querySelectorAll(".suggestion-item").forEach(item => {
              item.addEventListener("click", () => {
                const cleanName = item.dataset.name.split(",")[0];
                cityInput.value = cleanName;
                state.city = cleanName;
                searchSuggestions.style.display = "none";
                fetchProfessionals();
              });
            });
          } else {
            searchSuggestions.style.display = "none";
          }
        })
        .catch(err => console.error(err));
    }, 300);
  });

  // Hover styling
  searchSuggestions.addEventListener("mouseover", (e) => {
    const target = e.target.closest(".suggestion-item");
    if (target) target.style.background = "rgba(255, 255, 255, 0.08)";
  });
  searchSuggestions.addEventListener("mouseout", (e) => {
    const target = e.target.closest(".suggestion-item");
    if (target) target.style.background = "none";
  });

  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (e.target !== cityInput && e.target !== searchSuggestions) {
      searchSuggestions.style.display = "none";
    }
  });

  fetchProfessionals();
});
