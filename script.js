/**
 * IndexIndian (Firm D) — Core Institutional Interactions
 * Zero-bloat, lightweight vanilla JS (~2KB).
 */

document.addEventListener("DOMContentLoaded", () => {
  // ================= 1. VIEW SWITCHER (Guide vs Index) =================
  const btnGuide = document.getElementById("btn-guide");
  const btnIndex = document.getElementById("btn-index");
  const guideView = document.getElementById("guide-view");
  const indexView = document.getElementById("index-view");

  function switchView(target) {
    if (target === "guide") {
      btnGuide.classList.add("active");
      btnGuide.setAttribute("aria-selected", "true");
      btnIndex.classList.remove("active");
      btnIndex.setAttribute("aria-selected", "false");

      guideView.classList.add("active");
      guideView.hidden = false;
      indexView.classList.remove("active");
      indexView.hidden = true;
    } else if (target === "index") {
      btnIndex.classList.add("active");
      btnIndex.setAttribute("aria-selected", "true");
      btnGuide.classList.remove("active");
      btnGuide.setAttribute("aria-selected", "false");

      indexView.classList.add("active");
      indexView.hidden = false;
      guideView.classList.remove("active");
      guideView.hidden = true;
    }
    updateScrollTelemetry();
  }

  btnGuide.addEventListener("click", () => switchView("guide"));
  btnIndex.addEventListener("click", () => switchView("index"));

  // ================= 2. LEFT RAIL (Clickable Reference Ticks) =================
  const railTrack = document.getElementById("rail-track");

  // Optional: Clicking on the left tick rail smoothly navigates up/down the page
  if (railTrack) {
    railTrack.addEventListener("click", (e) => {
      const rect = railTrack.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const topMargin = 24;
      const availableHeight = rect.height - 48;
      const ratio = Math.min(Math.max((clickY - topMargin) / availableHeight, 0), 1);
      
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: ratio * docHeight,
        behavior: "smooth"
      });
    });
  }

  // ================= 3. HOVER / ACCESSIBILITY PANEL SETTINGS =================
  const panelWrappers = document.querySelectorAll(".panel-trigger-wrapper");
  const customDropdowns = document.querySelectorAll(".custom-dropdown");

  // Ensure hover menus close immediately when mouse cursor leaves the menu area
  panelWrappers.forEach((wrapper) => {
    wrapper.addEventListener("mouseleave", () => {
      // Close any open inner custom dropdowns
      customDropdowns.forEach((dd) => dd.classList.remove("is-open"));
      if (document.activeElement && wrapper.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    });
  });

  // Toggle Custom Dropdowns (Font Size & Font Style)
  const btnFontSizeTrigger = document.getElementById("btn-font-size-trigger");
  const dropdownFontSize = document.getElementById("dropdown-font-size");
  const fontSizeLabel = document.getElementById("font-size-label");

  const btnFontStyleTrigger = document.getElementById("btn-font-style-trigger");
  const dropdownFontStyle = document.getElementById("dropdown-font-style");
  const fontStyleLabel = document.getElementById("font-style-label");

  if (btnFontSizeTrigger && dropdownFontSize) {
    btnFontSizeTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdownFontSize.classList.contains("is-open");
      if (dropdownFontStyle) dropdownFontStyle.classList.remove("is-open");
      dropdownFontSize.classList.toggle("is-open", !isOpen);
      btnFontSizeTrigger.setAttribute("aria-expanded", !isOpen);
    });
  }

  if (btnFontStyleTrigger && dropdownFontStyle) {
    btnFontStyleTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdownFontStyle.classList.contains("is-open");
      if (dropdownFontSize) dropdownFontSize.classList.remove("is-open");
      dropdownFontStyle.classList.toggle("is-open", !isOpen);
      btnFontStyleTrigger.setAttribute("aria-expanded", !isOpen);
    });
  }

  // Handle Option Clicks
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  dropdownItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = item.getAttribute("data-type");
      const val = item.getAttribute("data-val");

      if (type === "font-size") {
        document.querySelectorAll("#list-font-size .dropdown-item").forEach((el) => el.classList.remove("active"));
        item.classList.add("active");
        if (fontSizeLabel) fontSizeLabel.textContent = item.textContent.split(" ")[0]; // e.g. "Small", "Medium", "Large"
        
        document.documentElement.classList.remove("font-size-small", "font-size-medium", "font-size-large");
        document.documentElement.classList.add(`font-size-${val}`);
        if (dropdownFontSize) dropdownFontSize.classList.remove("is-open");
        if (btnFontSizeTrigger) btnFontSizeTrigger.setAttribute("aria-expanded", "false");
      } else if (type === "font-style") {
        document.querySelectorAll("#list-font-style .dropdown-item").forEach((el) => el.classList.remove("active"));
        item.classList.add("active");
        if (fontStyleLabel) fontStyleLabel.textContent = val === "reading" ? "Long Reading" : "Typewriter";

        document.body.classList.remove("font-style-reading", "font-style-typewriter");
        document.body.classList.add(`font-style-${val}`);
        if (dropdownFontStyle) dropdownFontStyle.classList.remove("is-open");
        if (btnFontStyleTrigger) btnFontStyleTrigger.setAttribute("aria-expanded", "false");
      }
    });
  });

  const contrastToggle = document.getElementById("contrast-toggle");
  const gridToggle = document.getElementById("grid-toggle");
  const densityToggle = document.getElementById("density-toggle");

  // Restore saved theme on load
  const savedTheme = localStorage.getItem("indexindian_theme");
  if (savedTheme === "dark") {
    document.body.classList.add("theme-dark");
    document.body.classList.remove("theme-light");
    if (contrastToggle) contrastToggle.checked = true;
  }

  if (contrastToggle) {
    contrastToggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        document.body.classList.add("theme-dark");
        document.body.classList.remove("theme-light");
        localStorage.setItem("indexindian_theme", "dark");
      } else {
        document.body.classList.remove("theme-dark");
        document.body.classList.add("theme-light");
        localStorage.setItem("indexindian_theme", "light");
      }
    });
  }

  if (gridToggle) {
    gridToggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        document.body.classList.remove("no-grid");
      } else {
        document.body.classList.add("no-grid");
      }
    });
  }

  if (densityToggle) {
    densityToggle.addEventListener("change", (e) => {
      const tables = document.querySelectorAll(".forensic-table td, .forensic-table th");
      tables.forEach((cell) => {
        cell.style.padding = e.target.checked ? "8px 12px" : "14px 16px";
      });
    });
  }

  // ================= 4. INDEX COMPANY SEARCH & FILTER =================
  const searchInput = document.getElementById("company-search");
  const tableRows = document.querySelectorAll("#company-table-body tr");
  const filterPills = document.querySelectorAll(".filter-pill");

  function applyFilters() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const activePill = document.querySelector(".filter-pill.active");
    const filterText = activePill ? activePill.textContent.trim() : "All Entities";

    tableRows.forEach((row) => {
      const rowText = row.textContent.toLowerCase();
      const matchesSearch = !query || rowText.includes(query);

      let matchesPill = true;
      if (filterText === "All Entities") {
        matchesPill = true;
      } else if (filterText.includes("Capex Bottlenecks")) {
        const capex = row.cells[2].textContent;
        const capexNum = parseInt(capex.replace(/[^\d]/g, ""), 10) || 0;
        matchesPill = capexNum >= 1000;
      } else if (filterText.includes("CARO Qualified")) {
        const caro = row.cells[3].textContent;
        matchesPill = caro.includes("ANNEXURE");
      } else if (filterText.includes("Defense & Aerospace")) {
        const sector = row.cells[1].textContent.toLowerCase();
        matchesPill = sector.includes("defense") || sector.includes("aerospace") || sector.includes("naval");
      } else if (filterText.includes("Energy & Transition")) {
        const sector = row.cells[1].textContent.toLowerCase();
        matchesPill = sector.includes("energy") || sector.includes("power") || sector.includes("wind") || sector.includes("petroleum");
      } else if (filterText.includes("Clean Balance Sheets")) {
        const caro = row.cells[3].textContent;
        matchesPill = caro.includes("CLEAN");
      }

      row.style.display = matchesSearch && matchesPill ? "" : "none";
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      applyFilters();
    });
  });

  // ================= 5. SCROLLSPY & LEFT RAIL TELEMETRY SYNC =================
  const tickMarks = document.querySelectorAll(".tick-mark");
  const quickNavLinks = document.querySelectorAll(".quick-nav-pill");

  // Smooth scroll click handler for quick nav pills
  quickNavLinks.forEach((pill) => {
    pill.addEventListener("click", (e) => {
      const targetId = pill.getAttribute("href");
      if (targetId && targetId.startsWith("#")) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          history.replaceState(null, null, targetId);
        }
      }
    });
  });

  function updateScrollTelemetry() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // 1. Sync Left Rail Ticks
    if (tickMarks.length > 0 && docHeight > 0) {
      const ratio = Math.min(Math.max(scrollY / docHeight, 0), 1);
      const activeIdx = Math.min(Math.floor(ratio * tickMarks.length), tickMarks.length - 1);
      tickMarks.forEach((tick, i) => {
        tick.classList.toggle("active", i === activeIdx);
      });
    }

    // 2. Sync Quick Nav Active Pill (ScrollSpy)
    const activeView = document.querySelector(".content-view.active");
    if (!activeView) return;

    const sections = activeView.querySelectorAll("section[id], article[id]");
    let currentSectionId = "";

    sections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      // Section is considered active if its top is near top of viewport
      if (rect.top <= 140 && rect.bottom >= 100) {
        currentSectionId = sec.id;
      }
    });

    if (currentSectionId) {
      const currentPills = activeView.querySelectorAll(".quick-nav-pill");
      currentPills.forEach((p) => {
        const href = p.getAttribute("href");
        p.classList.toggle("active", href === `#${currentSectionId}`);
      });
    }
  }

  window.addEventListener("scroll", updateScrollTelemetry, { passive: true });
  updateScrollTelemetry();
});
