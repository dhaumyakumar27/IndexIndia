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
    // Subtle view update
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

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      tableRows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
      });
    });
  }

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      const filterText = pill.textContent.trim();
      tableRows.forEach((row) => {
        if (filterText === "All Entities") {
          row.style.display = "";
        } else if (filterText.includes("Capex Bottlenecks")) {
          const capex = row.cells[2].textContent;
          row.style.display = capex.includes("Cr") ? "" : "none";
        } else if (filterText.includes("CARO Qualified")) {
          const caro = row.cells[3].textContent;
          row.style.display = caro.includes("ANNEXURE") ? "" : "none";
        } else {
          row.style.display = "";
        }
      });
    });
  });
});
