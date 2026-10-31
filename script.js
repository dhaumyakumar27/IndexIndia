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

  // ================= 2. LEFT RAIL & DIRECTORY TREE NAVIGATION =================
  const scrollRail = document.getElementById("scroll-rail");
  const railTrack = document.getElementById("rail-track");
  const railTreePanel = document.getElementById("rail-tree-panel");
  const treeContentScroll = document.getElementById("tree-content-scroll");
  const treeNodes = Array.from(document.querySelectorAll(".tree-node"));
  const tickMarks = Array.from(document.querySelectorAll(".tick-mark"));

  let currentSubIndex = 0;
  let isPointerDownOnRail = false;
  let railLeaveTimer = null;
  let wheelReleaseTimer = null;

  function selectTreeNode(node, shouldScroll = true) {
    if (!node) return;
    treeNodes.forEach((n) => n.classList.remove("active"));
    node.classList.add("active");

    const index = parseInt(node.getAttribute("data-index"), 10);
    if (!isNaN(index)) {
      currentSubIndex = index;
    }

    // Synchronize Left Rail reference ticks
    if (tickMarks.length > 0) {
      const activeTickIdx = Math.min(
        Math.floor((currentSubIndex / Math.max(treeNodes.length - 1, 1)) * tickMarks.length),
        tickMarks.length - 1
      );
      tickMarks.forEach((tick, i) => {
        tick.classList.toggle("active", i === activeTickIdx);
      });
    }

    if (shouldScroll && treeContentScroll) {
      node.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  // Navigate to corresponding section smoothly
  function navigateToSection(ratio) {
    const activeView = document.querySelector(".content-view.active");
    if (!activeView) return;

    const sections = Array.from(
      activeView.querySelectorAll("article[id], section[id]")
    );

    if (sections.length > 0) {
      const targetIdx = Math.min(
        Math.floor(ratio * sections.length),
        sections.length - 1
      );
      const targetSection = sections[targetIdx];
      if (targetSection) {
        const navOffset = 64; // Keep navbar and section title nicely framed
        const targetY = targetSection.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: "smooth"
        });
        if (targetSection.id) {
          history.replaceState(null, null, `#${targetSection.id}`);
        }
        return;
      }
    }

    // Fallback if no specific section IDs
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: Math.max(0, ratio * docHeight),
      behavior: "smooth"
    });
  }

  // Calculate ratio from cursor Y position along the rail track
  function getRailRatio(clientY) {
    if (!railTrack) return 0;
    const rect = railTrack.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    return Math.max(0, Math.min(1, relativeY / rect.height));
  }

  function scrubToCursor(clientY, autoScrollTree = true) {
    const ratio = getRailRatio(clientY);
    const targetIdx = Math.min(
      Math.floor(ratio * treeNodes.length),
      treeNodes.length - 1
    );
    if (treeNodes[targetIdx]) {
      selectTreeNode(treeNodes[targetIdx], autoScrollTree);
    }
    return ratio;
  }

  // Open / Close Tree Flyout helpers
  function openRailPanel() {
    if (railLeaveTimer) clearTimeout(railLeaveTimer);
    if (railTreePanel) railTreePanel.classList.add("is-open");
  }

  function closeRailPanel(delay = 180) {
    if (railLeaveTimer) clearTimeout(railLeaveTimer);
    railLeaveTimer = setTimeout(() => {
      const isRailHovered = scrollRail && scrollRail.matches(":hover");
      const isPanelHovered = railTreePanel && railTreePanel.matches(":hover");
      if (!isRailHovered && !isPanelHovered && !isPointerDownOnRail) {
        if (railTreePanel) railTreePanel.classList.remove("is-open");
      }
    }, delay);
  }

  if (scrollRail) {
    scrollRail.addEventListener("mouseenter", openRailPanel);
    scrollRail.addEventListener("mouseleave", () => closeRailPanel(180));

    // Pointer Scrubbing: Move cursor along the lines to directly select topic/subtopic
    scrollRail.addEventListener("pointerdown", (e) => {
      isPointerDownOnRail = true;
      openRailPanel();
      try {
        scrollRail.setPointerCapture(e.pointerId);
      } catch (err) {}
      scrubToCursor(e.clientY, true);
    });

    scrollRail.addEventListener("pointermove", (e) => {
      openRailPanel();
      scrubToCursor(e.clientY, true);
    });

    // When the user releases, they go directly to that section
    scrollRail.addEventListener("pointerup", (e) => {
      isPointerDownOnRail = false;
      const ratio = scrubToCursor(e.clientY, true);
      navigateToSection(ratio);
      try {
        scrollRail.releasePointerCapture(e.pointerId);
      } catch (err) {}
      closeRailPanel(300);
    });

    scrollRail.addEventListener("pointercancel", () => {
      isPointerDownOnRail = false;
      closeRailPanel(180);
    });

    // Also support direct click on any line/track
    scrollRail.addEventListener("click", (e) => {
      const ratio = scrubToCursor(e.clientY, true);
      navigateToSection(ratio);
    });

    // Wheel scrolling up and down directly selects topic/subtopic; on release it navigates to that section
    scrollRail.addEventListener("wheel", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openRailPanel();

      const direction = e.deltaY > 0 ? 1 : -1;
      currentSubIndex = Math.min(Math.max(currentSubIndex + direction, 0), treeNodes.length - 1);
      const targetNode = treeNodes[currentSubIndex];
      selectTreeNode(targetNode, true);

      // Debounced release to navigate
      if (wheelReleaseTimer) clearTimeout(wheelReleaseTimer);
      wheelReleaseTimer = setTimeout(() => {
        const ratio = currentSubIndex / Math.max(treeNodes.length - 1, 1);
        navigateToSection(ratio);
      }, 350);
    }, { passive: false });
  }

  if (railTreePanel) {
    railTreePanel.addEventListener("mouseenter", openRailPanel);
    railTreePanel.addEventListener("mouseleave", () => closeRailPanel(180));

    // If mouse moves inside the panel, hovering a node selects it
    treeNodes.forEach((node) => {
      node.addEventListener("mouseenter", () => {
        selectTreeNode(node, false);
      });

      // Clicking any node in the panel also navigates directly to that section
      node.addEventListener("click", (e) => {
        e.stopPropagation();
        selectTreeNode(node, true);
        const idx = parseInt(node.getAttribute("data-index"), 10) || 0;
        const ratio = idx / Math.max(treeNodes.length - 1, 1);
        navigateToSection(ratio);
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
        localStorage.setItem("indexindian_font_size", val);
        if (dropdownFontSize) dropdownFontSize.classList.remove("is-open");
        if (btnFontSizeTrigger) btnFontSizeTrigger.setAttribute("aria-expanded", "false");
      } else if (type === "font-style") {
        document.querySelectorAll("#list-font-style .dropdown-item").forEach((el) => el.classList.remove("active"));
        item.classList.add("active");
        if (fontStyleLabel) fontStyleLabel.textContent = val === "reading" ? "Long Reading" : "Typewriter";

        document.body.classList.remove("font-style-reading", "font-style-typewriter");
        document.body.classList.add(`font-style-${val}`);
        localStorage.setItem("indexindian_font_style", val);
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

  // Restore saved font size & style on load
  const savedFontSize = localStorage.getItem("indexindian_font_size");
  if (savedFontSize) {
    document.documentElement.classList.remove("font-size-small", "font-size-medium", "font-size-large");
    document.documentElement.classList.add(`font-size-${savedFontSize}`);
    const activeItem = document.querySelector(`#list-font-size .dropdown-item[data-val="${savedFontSize}"]`);
    if (activeItem) {
      document.querySelectorAll("#list-font-size .dropdown-item").forEach((el) => el.classList.remove("active"));
      activeItem.classList.add("active");
      if (fontSizeLabel) fontSizeLabel.textContent = activeItem.textContent.split(" ")[0];
    }
  }

  const savedFontStyle = localStorage.getItem("indexindian_font_style");
  if (savedFontStyle) {
    document.body.classList.remove("font-style-reading", "font-style-typewriter");
    document.body.classList.add(`font-style-${savedFontStyle}`);
    const activeItem = document.querySelector(`#list-font-style .dropdown-item[data-val="${savedFontStyle}"]`);
    if (activeItem) {
      document.querySelectorAll("#list-font-style .dropdown-item").forEach((el) => el.classList.remove("active"));
      activeItem.classList.add("active");
      if (fontStyleLabel) fontStyleLabel.textContent = savedFontStyle === "reading" ? "Long Reading" : "Typewriter";
    }
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
