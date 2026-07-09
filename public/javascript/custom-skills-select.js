/**
 * custom-skills-select.js
 * Handles searchable skill selection and custom "+ Other" write-in for primary and secondary skills.
 */
document.addEventListener("DOMContentLoaded", () => {
  setupSkillDropdown("primary-skill", "primary-skill-custom-box", "primary-skill-custom");
  setupSkillDropdown("secondary-skills", "secondary-skills-custom-box", "secondary-skills-custom");
});

function setupSkillDropdown(selectId, customBoxId, customInputId) {
  const selectElem = document.getElementById(selectId);
  if (!selectElem) return;

  const customBox = document.getElementById(customBoxId);
  const customInput = document.getElementById(customInputId);

  // Initial check on page load
  if (selectElem.value === "Other" && customBox) {
    customBox.classList.add("active");
    if (customInput) customInput.required = true;
  }

  selectElem.addEventListener("change", (e) => {
    if (e.target.value === "Other") {
      if (customBox) customBox.classList.add("active");
      if (customInput) {
        customInput.required = true;
        customInput.focus();
      }
    } else {
      if (customBox) customBox.classList.remove("active");
      if (customInput) {
        customInput.required = false;
        customInput.value = "";
      }
    }
  });

  // Enhance select with searchable dropdown capability
  enhanceWithSearch(selectElem, customBox, customInput);
}

function enhanceWithSearch(selectElem, customBox, customInput) {
  // Create wrapper and search box above the select for quick searching
  const wrapper = document.createElement("div");
  wrapper.className = "skills-search-wrapper";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "🔍 Search or choose skill...";
  searchInput.className = "skills-search-input";
  searchInput.setAttribute("autocomplete", "off");
  
  // Set initial text if already selected
  if (selectElem.value && selectElem.value !== "Other") {
    searchInput.value = selectElem.options[selectElem.selectedIndex]?.text.trim() || selectElem.value;
  } else if (selectElem.value === "Other") {
    searchInput.value = "+ Other (Add Custom Skill)";
  }

  const dropdownList = document.createElement("div");
  dropdownList.className = "skills-dropdown-list";

  // Hide the original select but keep it synced for form submission
  selectElem.style.display = "none";
  selectElem.parentNode.insertBefore(wrapper, selectElem);
  wrapper.appendChild(searchInput);
  wrapper.appendChild(dropdownList);
  wrapper.appendChild(selectElem);

  if (customBox) {
    wrapper.parentNode.appendChild(customBox);
  }

  const options = Array.from(selectElem.options).map(opt => ({
    value: opt.value,
    text: opt.text.trim()
  }));

  function renderList(query = "") {
    dropdownList.innerHTML = "";
    const cleanQuery = query.toLowerCase().trim();
    
    const filtered = options.filter(opt => {
      if (opt.value === "" || opt.value === "Other") return false;
      return opt.text.toLowerCase().includes(cleanQuery);
    });

    if (filtered.length === 0 && cleanQuery !== "") {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "skills-dropdown-item";
      emptyDiv.style.color = "#94a3b8";
      emptyDiv.innerText = `No exact match for "${query}". Select + Other below to add it!`;
      dropdownList.appendChild(emptyDiv);
    }

    filtered.forEach(opt => {
      const item = document.createElement("div");
      item.className = "skills-dropdown-item";
      item.innerText = opt.text;
      item.addEventListener("click", () => {
        selectElem.value = opt.value;
        searchInput.value = opt.text;
        dropdownList.classList.remove("active");
        if (customBox) customBox.classList.remove("active");
        if (customInput) {
          customInput.required = false;
          customInput.value = "";
        }
        selectElem.dispatchEvent(new Event("change"));
      });
      dropdownList.appendChild(item);
    });

    // Always add the "+ Other (Add Custom Skill)" option at the bottom
    const otherOpt = options.find(o => o.value === "Other") || { value: "Other", text: "+ Other (Add Custom Skill)" };
    const otherItem = document.createElement("div");
    otherItem.className = "skills-dropdown-item other-option";
    otherItem.innerText = otherOpt.text;
    otherItem.addEventListener("click", () => {
      selectElem.value = "Other";
      searchInput.value = "+ Other (Add Custom Skill)";
      dropdownList.classList.remove("active");
      if (customBox) customBox.classList.add("active");
      if (customInput) {
        customInput.required = true;
        customInput.focus();
        if (cleanQuery && cleanQuery !== "+ other (add custom skill)") {
          customInput.value = query;
        }
      }
      selectElem.dispatchEvent(new Event("change"));
    });
    dropdownList.appendChild(otherItem);
  }

  searchInput.addEventListener("focus", () => {
    renderList("");
    dropdownList.classList.add("active");
  });

  searchInput.addEventListener("input", (e) => {
    renderList(e.target.value);
    dropdownList.classList.add("active");
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      dropdownList.classList.remove("active");
    }
  });
}
