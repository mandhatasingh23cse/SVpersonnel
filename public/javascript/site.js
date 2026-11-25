document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navPanel = document.querySelector("[data-nav-panel]");

  if (navToggle && navPanel) {
    navToggle.addEventListener("click", () => {
      const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isExpanded));
      navPanel.classList.toggle("is-open", !isExpanded);
    });

    navPanel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navToggle.setAttribute("aria-expanded", "false");
        navPanel.classList.remove("is-open");
      });
    });
  }

  document.addEventListener("click", (event) => {
    const contactToggle = event.target.closest("[data-contact-toggle]");
    if (contactToggle) {
      const panelId = contactToggle.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;

      const isExpanded = contactToggle.getAttribute("aria-expanded") === "true";
      const defaultLabel = contactToggle.dataset.contactDefault || "Contact now";

      document.querySelectorAll("[data-contact-toggle][aria-expanded='true']").forEach((button) => {
        if (button === contactToggle) return;
        const targetId = button.getAttribute("aria-controls");
        const targetPanel = targetId ? document.getElementById(targetId) : null;
        button.setAttribute("aria-expanded", "false");
        button.textContent = button.dataset.contactDefault || "Contact now";
        if (targetPanel) targetPanel.hidden = true;
      });

      contactToggle.setAttribute("aria-expanded", String(!isExpanded));
      contactToggle.textContent = isExpanded ? defaultLabel : "Hide contact";
      panel.hidden = isExpanded;
      return;
    }

    document.querySelectorAll(".nav-dropdown[open]").forEach((dropdown) => {
      if (!dropdown.contains(event.target)) {
        dropdown.removeAttribute("open");
      }
    });
  });

  document.querySelectorAll("[data-fill-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetKey = button.dataset.fillTarget;
      const targetValue = button.dataset.fillValue || "";
      const scope = button.closest("form") || document;
      const targetField =
        scope.querySelector(`#${CSS.escape(targetKey)}`) ||
        scope.querySelector(`[name="${CSS.escape(targetKey)}"]`) ||
        document.getElementById(targetKey) ||
        document.querySelector(`[name="${CSS.escape(targetKey)}"]`);

      if (!targetField) return;

      targetField.value = targetValue;
      targetField.dispatchEvent(new Event("input", { bubbles: true }));
      targetField.focus();
    });
  });

  const revealTargets = document.querySelectorAll("[data-reveal]");
  if (!revealTargets.length) return;

  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -80px 0px",
      threshold: 0.15
    }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));

  // Password Visibility Toggle
  document.querySelectorAll(".toggle-password-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-toggle-target");
      const targetInput = document.getElementById(targetId) || document.querySelector(`[name="${CSS.escape(targetId)}"]`);
      if (!targetInput) return;

      if (targetInput.type === "password") {
        targetInput.type = "text";
        btn.textContent = "Hide";
      } else {
        targetInput.type = "password";
        btn.textContent = "Show";
      }
    });
  });

  // Live Password Criteria Checklist
  const passwordInput = document.querySelector('input[name="password"]');
  if (passwordInput) {
    const box = passwordInput.closest(".field-group")?.querySelector(".password-criteria-box");
    if (box) {
      const critLength = box.querySelector(".crit-length");
      const critUpper = box.querySelector(".crit-upper");
      const critLower = box.querySelector(".crit-lower");
      const critNumber = box.querySelector(".crit-number");
      const critSymbol = box.querySelector(".crit-symbol");

      const updateRule = (el, met) => {
        if (!el) return;
        const bullet = el.querySelector(".bullet");
        if (met) {
          bullet.textContent = "✔";
          bullet.style.color = "#10b981"; // Emerald green
          el.style.color = "#10b981";
        } else {
          bullet.textContent = "○";
          bullet.style.color = "var(--color-ink-light)";
          el.style.color = "var(--color-ink-light)";
        }
      };

      passwordInput.addEventListener("input", () => {
        const val = passwordInput.value;
        updateRule(critLength, val.length >= 8);
        updateRule(critUpper, /[A-Z]/.test(val));
        updateRule(critLower, /[a-z]/.test(val));
        updateRule(critNumber, /[0-9]/.test(val));
        updateRule(critSymbol, /[\W_]/.test(val));
      });
    }
  }



  // --- 3D Tilt Interaction ---
  const tiltElements = document.querySelectorAll(".tilt-3d");
  tiltElements.forEach((el) => {
    el.style.transformStyle = "preserve-3d";
    
    el.addEventListener("mousemove", (e) => {
      const target = e.target;
      const isInteractive = target.closest("a, button, input, select, textarea");
      
      if (isInteractive) {
        // Flatten the card immediately when hovering over interactive elements
        el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1.02, 1.02, 1.02)`;
        return;
      }

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xc = rect.width / 2;
      const yc = rect.height / 2;

      const angleX = (yc - y) / 25; // Subtle tilt (divided by 25 instead of 10)
      const angleY = (x - xc) / 25;

      const pctX = (x / rect.width) * 100;
      const pctY = (y / rect.height) * 100;
      el.style.setProperty("--tilt-x", `${pctX}%`);
      el.style.setProperty("--tilt-y", `${pctY}%`);

      el.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  });

  // Hotstar / OTT Category Tray Navigation & Auto-Scrolling
  const ottTrays = document.querySelectorAll(".ott-tray");
  if (ottTrays.length > 0) {
    ottTrays.forEach((tray, index) => {
      tray._isPaused = false;
      tray._pauseUntil = 0;
      let scrollSpeed = 0.6 + (index % 3) * 0.2; // Slight organic variation

      tray.addEventListener("mouseenter", () => { tray._isPaused = true; });
      tray.addEventListener("mouseleave", () => { tray._isPaused = false; });
      tray.addEventListener("touchstart", () => { tray._isPaused = true; }, { passive: true });
      tray.addEventListener("touchend", () => {
        tray._pauseUntil = Date.now() + 2000;
      });

      function autoScrollTray() {
        const now = Date.now();
        if (!tray._isPaused && now > tray._pauseUntil && tray.scrollWidth > tray.clientWidth) {
          tray.scrollLeft += scrollSpeed;
          if (tray.scrollLeft + tray.clientWidth >= tray.scrollWidth - 2) {
            tray.scrollLeft = 0;
          }
        }
        requestAnimationFrame(autoScrollTray);
      }

      setTimeout(() => {
        requestAnimationFrame(autoScrollTray);
      }, 500 + index * 200);
    });

    document.querySelectorAll(".ott-arrow").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const trayId = button.getAttribute("data-tray-id");
        const tray = trayId ? document.getElementById(trayId) : null;
        if (!tray) return;

        tray._pauseUntil = Date.now() + 4000;
        const scrollAmount = Math.max(300, tray.clientWidth * 0.75);
        const targetScroll = button.classList.contains("ott-prev")
          ? tray.scrollLeft - scrollAmount
          : tray.scrollLeft + scrollAmount;

        tray.scrollTo({ left: targetScroll, behavior: "smooth" });
      });
    });
  }

  // Dynamic Category & Sub-Category Selection in Quick Search
  const catSelect = document.getElementById("search-category-select");
  const skillSelect = document.getElementById("search-skill-select");
  if (catSelect && skillSelect) {
    catSelect.addEventListener("change", () => {
      const selectedOption = catSelect.options[catSelect.selectedIndex];
      const itemsRaw = selectedOption ? selectedOption.getAttribute("data-items") : null;
      skillSelect.innerHTML = '<option value="">All Sub-Categories</option>';
      if (itemsRaw) {
        try {
          const items = JSON.parse(decodeURIComponent(itemsRaw));
          items.forEach((item) => {
            const opt = document.createElement("option");
            opt.value = item.name;
            opt.textContent = `${item.name}`;
            skillSelect.appendChild(opt);
          });
        } catch (e) {
          console.error("Error parsing subcategories", e);
        }
      }
    });
  }
});
