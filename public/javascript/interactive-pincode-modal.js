/**
 * interactive-pincode-modal.js
 * Intercepts category/card clicks and quick-searches on Homepage and Find Professionals pages.
 * Displays animated Pincode modal & live category results with prominent PRO IDs without transferring pages.
 */

(function () {
  "use strict";

  // 1. Inject CSS Styles for Modal Animations and Cards
  function injectStyles() {
    if (document.getElementById("interactive-pincode-modal-styles")) return;
    const style = document.createElement("style");
    style.id = "interactive-pincode-modal-styles";
    style.innerHTML = `
      @keyframes modalBackdropFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalCardPopIn {
        from { opacity: 0; transform: scale(0.9) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes drawerSlideIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .interactive-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: rgba(0, 0, 0, 0.78);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        animation: modalBackdropFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .interactive-modal-box {
        width: 100%;
        max-width: 520px;
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 24px;
        padding: 2.25rem 2rem;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(56, 189, 248, 0.12);
        color: #fff;
        position: relative;
        animation: modalCardPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        max-height: 90vh;
        overflow-y: auto;
      }
      .interactive-modal-box.is-expanded {
        max-width: 860px;
        padding: 2rem;
        animation: drawerSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .interactive-modal-close {
        position: absolute;
        top: 1.25rem;
        right: 1.25rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
      }
      .interactive-modal-close:hover {
        background: rgba(244, 63, 94, 0.3);
        border-color: #f43f5e;
        transform: rotate(90deg);
      }
      .interactive-pro-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.25rem;
        margin-top: 1.5rem;
      }
      .interactive-pro-card {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 18px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: transform 0.2s, border-color 0.2s;
        position: relative;
        overflow: hidden;
      }
      .interactive-pro-card:hover {
        transform: translateY(-4px);
        border-color: rgba(56, 189, 248, 0.5);
      }
      .pro-id-banner {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        background: linear-gradient(135deg, #f43f5e, #ec4899);
        color: #fff;
        font-weight: 800;
        font-size: 0.82rem;
        padding: 4px 12px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(244, 63, 94, 0.4);
        margin-bottom: 0.85rem;
        letter-spacing: 0.03em;
      }
      .pincode-input-wrapper {
        position: relative;
        margin: 1.25rem 0;
      }
      .pincode-input {
        width: 100%;
        box-sizing: border-box;
        padding: 1rem 1.25rem;
        border-radius: 16px;
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid rgba(56, 189, 248, 0.4);
        color: #fff;
        font-size: 1.05rem;
        font-weight: 600;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .pincode-input:focus {
        border-color: #38bdf8;
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.3);
      }
      .pincode-gps-btn {
        position: absolute;
        right: 0.65rem;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(56, 189, 248, 0.15);
        border: 1px solid rgba(56, 189, 248, 0.4);
        color: #38bdf8;
        padding: 0.45rem 0.85rem;
        border-radius: 10px;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      .pincode-gps-btn:hover {
        background: #38bdf8;
        color: #0f172a;
      }
      .homepage-live-section {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 24px;
        padding: 2.5rem;
        margin: 2.5rem auto;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        animation: drawerSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Create Modal DOM Structure
  function createModalDOM() {
    if (document.getElementById("interactive-pincode-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "interactive-pincode-overlay";
    overlay.className = "interactive-modal-overlay";
    overlay.style.display = "none";

    overlay.innerHTML = `
      <div class="interactive-modal-box" id="interactive-modal-box">
        <button type="button" class="interactive-modal-close" id="interactive-modal-close" aria-label="Close modal">✕</button>
        <div id="interactive-modal-stage-1">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
            <span style="font-size: 2rem;" id="modal-category-icon">💼</span>
            <div>
              <p style="margin: 0; font-size: 0.78rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em;">Interactive Category Check</p>
              <h3 style="margin: 0; font-size: 1.5rem; font-weight: 800; color: #fff;" id="modal-category-title">Select Service</h3>
            </div>
          </div>
          <p style="color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin: 0.75rem 0 0 0;">
            To show the nearest verified professionals under <strong style="color: #fff;" id="modal-category-name-strong">this category</strong>, enter your 6-digit Pincode or Area below:
          </p>

          <div class="pincode-input-wrapper">
            <input type="text" id="interactive-pincode-input" class="pincode-input" placeholder="Enter Pincode (e.g. 110001, 122002) or Area" autocomplete="off" maxlength="30" />
            <button type="button" class="pincode-gps-btn" id="interactive-gps-btn">📍 Auto Pincode</button>
          </div>
          <div id="interactive-pincode-status" style="font-size: 0.82rem; color: #38bdf8; min-height: 1.2rem; font-weight: 600; margin-top: -0.5rem; margin-bottom: 1rem;"></div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <button type="button" class="button button-primary" id="btn-show-pincode-pros" style="width: 100%; padding: 1rem; border-radius: 14px; font-weight: 800; font-size: 1.05rem; background: linear-gradient(135deg, #38bdf8, #2563eb); border: none; cursor: pointer; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);">
              ⚡ Show Verified Professionals ›
            </button>
            <button type="button" class="button button-secondary" id="btn-skip-pincode" style="width: 100%; padding: 0.8rem; border-radius: 14px; font-weight: 700; font-size: 0.92rem; background: rgba(255, 255, 255, 0.06); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.15); cursor: pointer;">
              Skip Pincode / Show All Across India
            </button>
          </div>
        </div>

        <div id="interactive-modal-stage-2" style="display: none;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255, 255, 255, 0.12); padding-bottom: 1rem; margin-bottom: 1rem;">
            <div>
              <p style="margin: 0; font-size: 0.78rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em;">Direct Directory Matches</p>
              <h3 style="margin: 0.25rem 0 0 0; font-size: 1.5rem; font-weight: 800; color: #fff;" id="modal-results-heading">Professionals List</h3>
              <p style="margin: 0.25rem 0 0 0; color: #94a3b8; font-size: 0.88rem;" id="modal-results-subheading">Showing verified profiles</p>
            </div>
            <button type="button" id="btn-change-pincode" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; padding: 6px 12px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; cursor: pointer;">
              📍 Change Pincode
            </button>
          </div>
          <div id="interactive-results-grid" class="interactive-pro-grid"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners inside modal
    document.getElementById("interactive-modal-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });

    document.getElementById("btn-change-pincode").addEventListener("click", function () {
      document.getElementById("interactive-modal-box").classList.remove("is-expanded");
      document.getElementById("interactive-modal-stage-2").style.display = "none";
      document.getElementById("interactive-modal-stage-1").style.display = "block";
    });

    document.getElementById("btn-show-pincode-pros").addEventListener("click", function () {
      const pinVal = document.getElementById("interactive-pincode-input").value.trim();
      loadDirectProfessionals(window._currentInteractiveSkill || "", pinVal);
    });

    document.getElementById("btn-skip-pincode").addEventListener("click", function () {
      loadDirectProfessionals(window._currentInteractiveSkill || "", "");
    });

    document.getElementById("interactive-pincode-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("btn-show-pincode-pros").click();
      }
    });

    // Auto GPS button in modal
    document.getElementById("interactive-gps-btn").addEventListener("click", function () {
      const statusEl = document.getElementById("interactive-pincode-status");
      const inputEl = document.getElementById("interactive-pincode-input");
      if (!navigator.geolocation) {
        statusEl.textContent = "Geolocation is not supported by your browser.";
        return;
      }
      statusEl.textContent = "Detecting pincode from GPS...";
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            const addr = data.address || {};
            const pin = addr.postcode || addr.city || addr.state_district || "India";
            inputEl.value = pin;
            statusEl.textContent = `Pincode detected: ${pin}`;
            setTimeout(() => {
              document.getElementById("btn-show-pincode-pros").click();
            }, 500);
          } catch (err) {
            statusEl.textContent = "Failed to detect pincode automatically.";
          }
        },
        () => {
          statusEl.textContent = "Location access denied.";
        }
      );
    });
  }

  function openModalForSkill(skillName, icon = "💼") {
    createModalDOM();
    injectStyles();
    window._currentInteractiveSkill = skillName;

    const overlay = document.getElementById("interactive-pincode-overlay");
    const box = document.getElementById("interactive-modal-box");
    const stage1 = document.getElementById("interactive-modal-stage-1");
    const stage2 = document.getElementById("interactive-modal-stage-2");

    document.getElementById("modal-category-icon").textContent = icon || "💼";
    document.getElementById("modal-category-title").textContent = skillName;
    document.getElementById("modal-category-name-strong").textContent = skillName;
    document.getElementById("interactive-pincode-status").textContent = "";

    box.classList.remove("is-expanded");
    stage2.style.display = "none";
    stage1.style.display = "block";
    overlay.style.display = "flex";

    setTimeout(() => {
      const inputEl = document.getElementById("interactive-pincode-input");
      if (inputEl) inputEl.focus();
    }, 100);
  }

  function closeModal() {
    const overlay = document.getElementById("interactive-pincode-overlay");
    if (overlay) overlay.style.display = "none";
  }

  // 3. Render Professionals Grid in Modal or on Homepage
  function renderProfessionalCards(workers, containerEl) {
    if (!workers || !workers.length) {
      containerEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: rgba(255,255,255,0.03); border-radius: 18px; border: 1px dashed rgba(255,255,255,0.15);">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">📭</span>
          <h4 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; color: #fff;">No exact match found in this pincode</h4>
          <p style="margin: 0; color: #94a3b8; font-size: 0.95rem;">Try skipping the pincode filter or choosing 'All India' to see all available verified professionals.</p>
          <button type="button" class="button button-secondary" onclick="document.getElementById('btn-skip-pincode') ? document.getElementById('btn-skip-pincode').click() : ''" style="margin-top: 1rem;">Show All Across India</button>
        </div>
      `;
      return;
    }

    containerEl.innerHTML = workers
      .map((w) => {
        const photo = encodeURI(w.photo || "/assets/gigconnect.logo.png");
        const skills = Array.isArray(w.skills) ? w.skills : (w.skills ? [w.skills] : []);
        const price = Number(w.startingPrice || w.hourlyRateInr || w.partTimeRate || 0);
        const priceLabel = price > 0 ? `₹${price}/Day approx. (Part-Time)` : "Fixed Part-Time Rate";
        const bookHref = w.id ? `/book-service/${encodeURIComponent(w.id)}` : "/contactus";

        return `
          <div class="interactive-pro-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="pro-id-banner">PRO ID: #${w.id || 'N/A'}</span>
                <span style="font-size: 0.78rem; font-weight: 700; color: ${w.isVerified ? '#38bdf8' : '#f59e0b'};">
                  ${w.isVerified ? '★ Verified Profile' : '★ Registered'}
                </span>
              </div>

              <div style="display: flex; gap: 1rem; align-items: center; margin-top: 0.5rem; margin-bottom: 1rem;">
                <img src="${photo}" alt="${w.name}" onerror="this.src='/assets/gigconnect.logo.png'" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #38bdf8; box-shadow: 0 4px 12px rgba(0,0,0,0.5);" />
                <div>
                  <h4 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #fff;">${w.name}</h4>
                  <p style="margin: 3px 0 0 0; font-size: 0.85rem; color: #cbd5e1;">📍 ${w.city || w.area || 'India'}</p>
                  <p style="margin: 2px 0 0 0; font-size: 0.82rem; color: #38bdf8; font-weight: 600;">🏆 ${w.experience || 1} yrs exp | ★ ${Number(w.ratings || 4.8).toFixed(1)}/5</p>
                </div>
              </div>

              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1rem;">
                ${skills.slice(0, 3).map((s) => `<span style="background: rgba(255,255,255,0.1); color: #fff; font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">${s}</span>`).join("")}
              </div>
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.12); padding-top: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #a78bfa;">${priceLabel}</span>
              <a href="${bookHref}" class="button button-primary" style="padding: 0.65rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 12px; text-decoration: none;">Book PRO #${w.id} ›</a>
            </div>
          </div>
        `;
      })
      .join("");
  }

  async function loadDirectProfessionals(skillName, pincodeOrCity) {
    const box = document.getElementById("interactive-modal-box");
    const stage1 = document.getElementById("interactive-modal-stage-1");
    const stage2 = document.getElementById("interactive-modal-stage-2");
    const grid = document.getElementById("interactive-results-grid");

    box.classList.add("is-expanded");
    stage1.style.display = "none";
    stage2.style.display = "block";

    document.getElementById("modal-results-heading").textContent = skillName || "All Professionals";
    document.getElementById("modal-results-subheading").textContent = pincodeOrCity
      ? `Showing verified profiles near Pincode / Area "${pincodeOrCity}"`
      : `Showing all available verified profiles across India`;

    grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #38bdf8; font-weight: 700; padding: 3rem 0; font-size: 1.1rem;">⚡ Fetching verified professionals & direct PRO IDs...</p>`;

    const params = new URLSearchParams();
    if (skillName) params.set("skill", skillName);
    if (pincodeOrCity) params.set("city", pincodeOrCity);

    try {
      const res = await fetch(`/api/workers?${params.toString()}`);
      const data = await res.json();
      renderProfessionalCards(data, grid);
    } catch (err) {
      grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #f43f5e; font-weight: 700; padding: 2rem 0;">Error loading professionals. Please check connection and try again.</p>`;
    }
  }

  // 4. Attach Listeners to Homepage Quick Search Form & All Category Cards (.ott-card)
  function attachInteractiveListeners() {
    createModalDOM();
    injectStyles();

    // Intercept Homepage Quick Search Form (#quick-search-form)
    const quickForm = document.getElementById("quick-search-form");
    if (quickForm && !quickForm.hasAttribute("data-interactive-attached")) {
      quickForm.setAttribute("data-interactive-attached", "true");
      quickForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const catSelect = quickForm.querySelector("select[name='category']");
        const skillSelect = quickForm.querySelector("select[name='skill']");
        const cityInput = quickForm.querySelector("input[name='city']");

        const skillVal = skillSelect && skillSelect.value ? skillSelect.value : (catSelect && catSelect.value ? catSelect.value : "");
        const cityVal = cityInput ? cityInput.value.trim() : "";

        if (!cityVal && skillVal) {
          // If skill selected but no pincode/city, open interactive pincode modal!
          openModalForSkill(skillVal, "🔍");
          return;
        }

        // Otherwise, render live results directly right below the quick search hero on Homepage!
        let liveSection = document.getElementById("homepage-live-results-section");
        if (!liveSection) {
          liveSection = document.createElement("section");
          liveSection.id = "homepage-live-results-section";
          liveSection.className = "shell homepage-live-section";
          const heroSec = document.querySelector(".hero-section");
          if (heroSec && heroSec.parentNode) {
            heroSec.parentNode.insertBefore(liveSection, heroSec.nextSibling);
          } else {
            quickForm.parentNode.appendChild(liveSection);
          }
        }

        liveSection.style.display = "block";
        liveSection.scrollIntoView({ behavior: "smooth", block: "start" });
        liveSection.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div>
              <p style="margin: 0; color: #38bdf8; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">⚡ Direct Live Matches</p>
              <h2 style="margin: 0.25rem 0 0 0; color: #fff; font-size: 1.8rem; font-weight: 800;">${skillVal || 'All Categories'} ${cityVal ? `near "${cityVal}"` : 'across India'}</h2>
            </div>
            <button type="button" onclick="document.getElementById('homepage-live-results-section').style.display='none'" class="button button-secondary" style="padding: 0.6rem 1.2rem; font-size: 0.85rem;">✕ Close Results</button>
          </div>
          <div id="homepage-live-grid" class="interactive-pro-grid">
            <p style="grid-column: 1 / -1; text-align: center; color: #38bdf8; font-weight: 700; padding: 2rem 0;">Fetching matching professionals & direct IDs...</p>
          </div>
        `;

        const params = new URLSearchParams();
        if (skillVal) params.set("skill", skillVal);
        if (cityVal && cityVal.toLowerCase() !== "all india") params.set("city", cityVal);

        try {
          const res = await fetch(`/api/workers?${params.toString()}`);
          const data = await res.json();
          const grid = document.getElementById("homepage-live-grid");
          if (grid) renderProfessionalCards(data, grid);
        } catch (err) {
          const grid = document.getElementById("homepage-live-grid");
          if (grid) grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #f43f5e;">Failed to load live results. Please try again.</p>`;
        }
      });
    }

    // Intercept Category / Service Cards (.ott-card across all trays on Home and Find Professionals)
    const cards = document.querySelectorAll(".ott-card, [data-category-trigger]");
    cards.forEach((card) => {
      if (card.hasAttribute("data-pincode-modal-attached")) return;
      card.setAttribute("data-pincode-modal-attached", "true");

      card.addEventListener("click", function (e) {
        // Intercept any click on category / OTT cards
        e.preventDefault();
        let skillName = "";
        let icon = "💼";

        const titleEl = card.querySelector(".ott-card-title");
        if (titleEl) skillName = titleEl.textContent.trim();
        const iconEl = card.querySelector(".ott-card-icon-wrapper");
        if (iconEl) icon = iconEl.textContent.trim();

        if (!skillName && card.getAttribute("href")) {
          const urlStr = card.getAttribute("href");
          try {
            const urlObj = new URL(urlStr, window.location.origin);
            skillName = urlObj.searchParams.get("skill") || urlObj.searchParams.get("category") || "";
          } catch (err) {}
        }

        if (!skillName) skillName = "Professional Services";
        openModalForSkill(skillName, icon);
      });
    });
  }

  // Run on DOM loaded and after dynamic updates
  document.addEventListener("DOMContentLoaded", attachInteractiveListeners);
  // Re-run periodically for dynamically injected cards/elements
  setInterval(attachInteractiveListeners, 1500);
})();
