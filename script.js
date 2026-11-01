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
  const railNavigator = document.getElementById("rail-navigator");
  const railTrack = document.getElementById("rail-track");
  const railTreePanel = document.getElementById("rail-tree-panel");
  const treeContentScroll = document.getElementById("tree-content-scroll");
  const treeNodes = Array.from(document.querySelectorAll(".tree-node"));
  const tickMarks = Array.from(document.querySelectorAll(".tick-mark"));
  const btnPinTree = document.getElementById("btn-pin-tree");
  const btnCloseTree = document.getElementById("btn-close-tree");
  const treeScrubStrip = document.getElementById("tree-scrub-strip");
  const treeScrubIndicator = document.getElementById("tree-scrub-indicator");
  const railTreeStatus = document.getElementById("rail-tree-status");

  let currentSubIndex = 0;
  let isUserScrubbing = false;
  let isPointerDownOnRail = false;
  let isPointerScrubbingStrip = false;
  let isPinned = false;
  let isWheeling = false;
  let wheelCooldownTimer = null;
  let wheelReleaseTimer = null;
  let wheelAccumulator = 0;
  const WHEEL_SENSITIVITY = 32; // Calibrated step sensitivity for smooth trackpad swipe
  let railLeaveTimer = null;
  let pageScrollAnim = null;

  // Controlled, elegant smooth scroll physics
  function smoothScrollTo(targetY, minDuration = 500, maxDuration = 850) {
    if (pageScrollAnim) cancelAnimationFrame(pageScrollAnim);

    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 4) return;

    // Adjust duration proportionally: minimum 500ms, max 850ms
    const adjustedDuration = Math.min(Math.max(Math.abs(distance) * 0.28, minDuration), maxDuration);
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / adjustedDuration, 1);

      // Ease out cubic: starts briskly and decelerates gently to a soft stop
      const ease = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, startY + distance * ease);

      if (progress < 1) {
        pageScrollAnim = requestAnimationFrame(step);
      } else {
        pageScrollAnim = null;
      }
    }

    pageScrollAnim = requestAnimationFrame(step);
  }

  function updateTreeTelemetryUI() {
    if (railTreeStatus && treeNodes.length > 0) {
      const curr = String(currentSubIndex + 1).padStart(2, "0");
      const total = String(treeNodes.length).padStart(2, "0");
      railTreeStatus.textContent = `${curr} / ${total}`;
    }

    if (treeScrubIndicator && treeScrubStrip && treeNodes.length > 1) {
      const ratio = currentSubIndex / (treeNodes.length - 1);
      const stripHeight = treeScrubStrip.clientHeight || 400;
      const thumbHeight = treeScrubIndicator.clientHeight || 36;
      const maxTop = Math.max(0, stripHeight - thumbHeight);
      treeScrubIndicator.style.top = `${ratio * maxTop}px`;
    }
  }

  function selectTreeNode(node, shouldScroll = true) {
    if (!node) return;
    treeNodes.forEach((n) => n.classList.remove("active"));
    node.classList.add("active");

    const index = parseInt(node.getAttribute("data-index"), 10);
    if (!isNaN(index)) {
      currentSubIndex = index;
    }

    // Keep Left Rail reference tick synchronized
    if (tickMarks.length > 0) {
      const activeTickIdx = Math.round(
        (currentSubIndex / Math.max(treeNodes.length - 1, 1)) * (tickMarks.length - 1)
      );
      tickMarks.forEach((tick, i) => {
        tick.classList.toggle("active", i === activeTickIdx);
      });
    }

    // Align tree panel smoothly to selected node
    if (shouldScroll && treeContentScroll) {
      const nodeRect = node.getBoundingClientRect();
      const containerRect = treeContentScroll.getBoundingClientRect();
      const currentScroll = treeContentScroll.scrollTop;
      const relativeTop = nodeRect.top - containerRect.top + currentScroll;
      const targetTop = relativeTop - containerRect.height / 2 + nodeRect.height / 2;
      treeContentScroll.scrollTop = targetTop;
    }

    updateTreeTelemetryUI();
  }

  // Navigate to corresponding section with calibrated smooth scrolling
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
        smoothScrollTo(Math.max(0, targetY));
        if (targetSection.id) {
          history.replaceState(null, null, `#${targetSection.id}`);
        }
        return;
      }
    }

    // Fallback if no specific section IDs
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    smoothScrollTo(Math.max(0, ratio * docHeight));
  }

  // Open / Close Tree Flyout helpers
  function openRailPanel() {
    if (railLeaveTimer) clearTimeout(railLeaveTimer);
    if (railNavigator) railNavigator.classList.add("is-open");
    if (railTrack) railTrack.classList.add("is-hidden");
    if (railTreePanel) railTreePanel.classList.add("is-open");
    updateTreeTelemetryUI();
  }

  function closeRailPanel(delay = 350) {
    if (isPinned) return; // Never auto-close when pinned
    if (railLeaveTimer) clearTimeout(railLeaveTimer);
    railLeaveTimer = setTimeout(() => {
      const isNavHovered = railNavigator && railNavigator.matches(":hover");
      const isPanelHovered = railTreePanel && railTreePanel.matches(":hover");
      if (!isNavHovered && !isPanelHovered && !isPointerDownOnRail && !isPointerScrubbingStrip && !isPinned) {
        if (railNavigator) railNavigator.classList.remove("is-open");
        if (railTrack) railTrack.classList.remove("is-hidden");
        if (railTreePanel) railTreePanel.classList.remove("is-open");
        isUserScrubbing = false;
      }
    }, delay);
  }

  function togglePinTree(forceState) {
    isPinned = typeof forceState === "boolean" ? forceState : !isPinned;
    if (railNavigator) {
      railNavigator.classList.toggle("is-pinned", isPinned);
      if (isPinned) {
        railNavigator.classList.add("is-open");
        if (railTrack) railTrack.classList.add("is-hidden");
        if (railTreePanel) railTreePanel.classList.add("is-open");
      }
    }
    if (btnPinTree) {
      btnPinTree.classList.toggle("is-active", isPinned);
      btnPinTree.setAttribute("aria-pressed", isPinned ? "true" : "false");
    }
    if (!isPinned) {
      closeRailPanel(120);
    }
  }

  if (btnPinTree) {
    btnPinTree.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePinTree();
    });
  }

  if (btnCloseTree) {
    btnCloseTree.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePinTree(false);
      if (railNavigator) railNavigator.classList.remove("is-open", "is-pinned");
      if (railTrack) railTrack.classList.remove("is-hidden");
      if (railTreePanel) railTreePanel.classList.remove("is-open");
    });
  }

  if (railNavigator) {
    railNavigator.addEventListener("mouseenter", () => {
      isUserScrubbing = true;
      openRailPanel();
    });

    railNavigator.addEventListener("mouseleave", () => {
      closeRailPanel(350);
    });

    // Trackpad swipe & mouse wheel handling (proportional stepping, decoupled from cursor hover)
    railNavigator.addEventListener("wheel", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isUserScrubbing = true;
      isWheeling = true;
      openRailPanel();

      // Suppress stationary mouseenter events during swipe
      if (wheelCooldownTimer) clearTimeout(wheelCooldownTimer);
      wheelCooldownTimer = setTimeout(() => {
        isWheeling = false;
      }, 260);

      wheelAccumulator += e.deltaY;
      const steps = Math.trunc(wheelAccumulator / WHEEL_SENSITIVITY);

      if (steps !== 0) {
        wheelAccumulator -= steps * WHEEL_SENSITIVITY;
        currentSubIndex = Math.min(Math.max(currentSubIndex + steps, 0), treeNodes.length - 1);
        const targetNode = treeNodes[currentSubIndex];
        selectTreeNode(targetNode, true);
      }

      // Debounced release to navigate main document to swiped section
      if (wheelReleaseTimer) clearTimeout(wheelReleaseTimer);
      wheelReleaseTimer = setTimeout(() => {
        const ratio = currentSubIndex / Math.max(treeNodes.length - 1, 1);
        navigateToSection(ratio);
        isUserScrubbing = false;
      }, 350);
    }, { passive: false });
  }

  // Direct click / hover listeners on individual tick marks
  if (railTrack) {
    tickMarks.forEach((tick, i) => {
      // Hovering a tick opens the rail panel without altering the active scrolled section
      tick.addEventListener("mouseenter", () => {
        openRailPanel();
      });

      tick.addEventListener("click", (e) => {
        e.stopPropagation();
        const ratio = i / Math.max(tickMarks.length - 1, 1);
        navigateToSection(ratio);
      });
    });
  }

  if (railTreePanel) {
    railTreePanel.addEventListener("mouseenter", openRailPanel);
    railTreePanel.addEventListener("mouseleave", () => closeRailPanel(350));

    // Cursor hover DOES NOT highlight or bold the section.
    // Only the scrolled section is in bold text.
    treeNodes.forEach((node, i) => {
      // Clicking any node navigates directly to that section
      node.addEventListener("click", (e) => {
        e.stopPropagation();
        const ratio = i / Math.max(treeNodes.length - 1, 1);
        navigateToSection(ratio);
      });
    });
  }

  // Vertical Quick-Scrub Strip Drag/Swipe Handler
  function scrubToStripY(clientY) {
    if (!treeScrubStrip || treeNodes.length === 0) return;
    const rect = treeScrubStrip.getBoundingClientRect();
    const clampedY = Math.min(Math.max(clientY, rect.top), rect.bottom);
    const ratio = (clampedY - rect.top) / Math.max(rect.height, 1);
    const targetIdx = Math.min(Math.round(ratio * (treeNodes.length - 1)), treeNodes.length - 1);
    if (treeNodes[targetIdx]) {
      selectTreeNode(treeNodes[targetIdx], true);
    }
  }

  if (treeScrubStrip) {
    treeScrubStrip.addEventListener("pointerdown", (e) => {
      isPointerScrubbingStrip = true;
      isUserScrubbing = true;
      try {
        treeScrubStrip.setPointerCapture(e.pointerId);
      } catch (err) {}
      scrubToStripY(e.clientY);
    });

    treeScrubStrip.addEventListener("pointermove", (e) => {
      if (isPointerScrubbingStrip) {
        scrubToStripY(e.clientY);
      }
    });

    treeScrubStrip.addEventListener("pointerup", (e) => {
      if (isPointerScrubbingStrip) {
        isPointerScrubbingStrip = false;
        try {
          treeScrubStrip.releasePointerCapture(e.pointerId);
        } catch (err) {}
        const ratio = currentSubIndex / Math.max(treeNodes.length - 1, 1);
        navigateToSection(ratio);
        closeRailPanel(400);
      }
    });

    treeScrubStrip.addEventListener("pointercancel", () => {
      isPointerScrubbingStrip = false;
      closeRailPanel(200);
    });
  }

  // Global Keyboard Shortcuts (Terminal mode: T toggles drawer, Esc closes)
  document.addEventListener("keydown", (e) => {
    // Ignore when user is typing in form inputs
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

    if (e.key === "t" || e.key === "T") {
      e.preventDefault();
      togglePinTree();
    } else if (e.key === "Escape") {
      if (isPinned || railNavigator?.classList.contains("is-open")) {
        togglePinTree(false);
        if (railNavigator) railNavigator.classList.remove("is-open", "is-pinned");
        if (railTrack) railTrack.classList.remove("is-hidden");
        if (railTreePanel) railTreePanel.classList.remove("is-open");
      }
    } else if (e.key === "j" || e.key === "ArrowDown") {
      // Step to next section smoothly if tree drawer is open
      if (railNavigator?.classList.contains("is-open") || isPinned) {
        e.preventDefault();
        currentSubIndex = Math.min(currentSubIndex + 1, treeNodes.length - 1);
        selectTreeNode(treeNodes[currentSubIndex], true);
        const ratio = currentSubIndex / Math.max(treeNodes.length - 1, 1);
        navigateToSection(ratio);
      }
    } else if (e.key === "k" || e.key === "ArrowUp") {
      // Step to previous section smoothly if tree drawer is open
      if (railNavigator?.classList.contains("is-open") || isPinned) {
        e.preventDefault();
        currentSubIndex = Math.max(currentSubIndex - 1, 0);
        selectTreeNode(treeNodes[currentSubIndex], true);
        const ratio = currentSubIndex / Math.max(treeNodes.length - 1, 1);
        navigateToSection(ratio);
      }
    }
  });

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
          const navOffset = 64;
          const targetY = targetEl.getBoundingClientRect().top + window.scrollY - navOffset;
          smoothScrollTo(Math.max(0, targetY));
          history.replaceState(null, null, targetId);
        }
      }
    });
  });

  function updateScrollTelemetry() {
    if (isUserScrubbing) return;

    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // 1. Sync Left Rail Ticks
    if (tickMarks.length > 0 && docHeight > 0) {
      const ratio = Math.min(Math.max(scrollY / docHeight, 0), 1);
      const activeIdx = Math.min(Math.floor(ratio * tickMarks.length), tickMarks.length - 1);
      tickMarks.forEach((tick, i) => {
        tick.classList.toggle("active", i === activeIdx);
      });

      // Keep tree active node in sync with scroll position (always bold the scrolled section)
      const nodeIdx = Math.round(ratio * (treeNodes.length - 1));
      if (treeNodes[nodeIdx]) {
        treeNodes.forEach((n) => n.classList.remove("active"));
        treeNodes[nodeIdx].classList.add("active");
        currentSubIndex = nodeIdx;
        updateTreeTelemetryUI();
      }
    }

    // 2. Sync Quick Nav Active Pill (ScrollSpy)
    const activeView = document.querySelector(".content-view.active");
    if (!activeView) return;

    const sections = Array.from(activeView.querySelectorAll("section[id], article[id]"));
    let currentSectionId = "";

    sections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 160 && rect.bottom >= 100) {
        currentSectionId = sec.id;
      }
    });

    if (!currentSectionId && sections.length > 0 && scrollY < 200) {
      currentSectionId = sections[0].id;
    }

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
