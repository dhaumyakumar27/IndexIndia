/**
 * IndexIndian (Firm D) — Core Institutional Interactions
 * Zero-bloat, lightweight vanilla JS across all 8 modular pages.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ================= 1. PAGE CONTEXT & VIEW DETECTION =================
  const pathname = window.location.pathname.toLowerCase();
  const isIndexSuite = pathname.includes("index-view") || pathname.includes("graph") || pathname.includes("directory") || pathname.includes("source");

  // Keyboard shortcut Tab switches between Guide landing <=> Index landing
  const targetOtherSuiteUrl = isIndexSuite ? "index.html" : "index-view.html";

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

  // Determine active page/section index among treeNodes
  let activeNodeIdx = -1;
  if (window.location.hash) {
    activeNodeIdx = treeNodes.findIndex((n) => n.getAttribute("href") === window.location.hash);
  }
  if (activeNodeIdx === -1) {
    activeNodeIdx = treeNodes.findIndex((n) => n.classList.contains("active"));
  }
  if (activeNodeIdx === -1) {
    const currentFile = pathname.split("/").pop() || "index.html";
    activeNodeIdx = treeNodes.findIndex((n) => {
      const href = n.getAttribute("href") || "";
      return href === currentFile || (currentFile === "" && href === "index.html");
    });
    if (activeNodeIdx === -1) activeNodeIdx = 0;
  }
  let currentSubIndex = activeNodeIdx;

  let isPinned = false;
  let isWheeling = false;
  let wheelCooldownTimer = null;
  let wheelReleaseTimer = null;
  let wheelAccumulator = 0;
  const WHEEL_SENSITIVITY = 32;
  let railLeaveTimer = null;

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

  function isTreeCurrentlyOpen() {
    if (!railNavigator) return false;
    if (railNavigator.classList.contains("is-closed")) return false;
    return (
      railNavigator.classList.contains("is-open") ||
      railNavigator.classList.contains("is-pinned") ||
      Boolean(railTreePanel && railTreePanel.classList.contains("is-open")) ||
      railNavigator.matches(":hover") ||
      Boolean(railTreePanel && railTreePanel.matches(":hover")) ||
      Boolean(document.activeElement && railNavigator.contains(document.activeElement))
    );
  }

  function scrollTreeToNode(node) {
    if (treeContentScroll && node) {
      const targetTop = node.offsetTop - (treeContentScroll.clientHeight / 2) + (node.clientHeight / 2);
      treeContentScroll.scrollTop = Math.max(0, targetTop);
    }
  }

  function openTreeExplicitly(pin = true) {
    isPinned = pin;
    if (railLeaveTimer) clearTimeout(railLeaveTimer);

    if (railNavigator) {
      railNavigator.classList.remove("is-closed");
      railNavigator.classList.add("is-open");
      if (isPinned) railNavigator.classList.add("is-pinned");
    }
    if (railTrack) railTrack.classList.add("is-hidden");
    if (railTreePanel) railTreePanel.classList.add("is-open");

    if (btnPinTree) {
      btnPinTree.classList.toggle("is-active", isPinned);
      btnPinTree.setAttribute("aria-pressed", isPinned ? "true" : "false");
    }
    updateTreeTelemetryUI();
    scrollTreeToNode(treeNodes[currentSubIndex]);
  }

  function closeTreeExplicitly() {
    isPinned = false;
    if (railLeaveTimer) clearTimeout(railLeaveTimer);

    if (railNavigator) {
      railNavigator.classList.remove("is-open", "is-pinned");
      railNavigator.classList.add("is-closed");
    }
    if (railTrack) railTrack.classList.remove("is-hidden");
    if (railTreePanel) railTreePanel.classList.remove("is-open");

    if (btnPinTree) {
      btnPinTree.classList.remove("is-active");
      btnPinTree.setAttribute("aria-pressed", "false");
    }
  }

  function toggleTree(forceState) {
    let shouldOpen = typeof forceState === "boolean" ? forceState : !isTreeCurrentlyOpen();
    if (shouldOpen) {
      openTreeExplicitly(true);
    } else {
      closeTreeExplicitly();
    }
  }

  function openRailPanel() {
    if (railLeaveTimer) clearTimeout(railLeaveTimer);
    if (railNavigator) {
      railNavigator.classList.remove("is-closed");
      railNavigator.classList.add("is-open");
    }
    if (railTrack) railTrack.classList.add("is-hidden");
    if (railTreePanel) railTreePanel.classList.add("is-open");
    updateTreeTelemetryUI();
    scrollTreeToNode(treeNodes[currentSubIndex]);
  }

  function closeRailPanel(delay = 300) {
    if (isPinned) return;
    if (railLeaveTimer) clearTimeout(railLeaveTimer);
    railLeaveTimer = setTimeout(() => {
      const isNavHovered = railNavigator && railNavigator.matches(":hover");
      const isPanelHovered = railTreePanel && railTreePanel.matches(":hover");
      if (!isNavHovered && !isPanelHovered && !isPinned) {
        if (railNavigator) railNavigator.classList.remove("is-open");
        if (railTrack) railTrack.classList.remove("is-hidden");
        if (railTreePanel) railTreePanel.classList.remove("is-open");
      }
    }, delay);
  }

  function highlightTreeNode(index) {
    if (treeNodes.length === 0) return;
    currentSubIndex = Math.min(Math.max(0, index), treeNodes.length - 1);
    const targetNode = treeNodes[currentSubIndex];
    if (!targetNode) return;

    treeNodes.forEach((n) => n.classList.remove("active"));
    targetNode.classList.add("active");

    if (tickMarks.length > 0) {
      const activeTickIdx = Math.round((currentSubIndex / Math.max(treeNodes.length - 1, 1)) * (tickMarks.length - 1));
      tickMarks.forEach((tick, i) => tick.classList.toggle("active", i === activeTickIdx));
    }

    // Also highlight active section in the main document if corresponding card exists
    const href = targetNode.getAttribute("href") || "";
    if (href.startsWith("#")) {
      document.querySelectorAll(".story-node-section, .page-directory-section").forEach((sec) => sec.classList.remove("is-active-section"));
      const activeEl = document.querySelector(href);
      if (activeEl) activeEl.classList.add("is-active-section");
    }

    scrollTreeToNode(targetNode);
    updateTreeTelemetryUI();
  }

  function navigateToNode(index) {
    highlightTreeNode(index);
    const targetNode = treeNodes[currentSubIndex];
    if (!targetNode) return;
    const href = targetNode.getAttribute("href");
    if (!href) return;

    if (href.startsWith("#")) {
      const targetEl = document.querySelector(href);
      if (targetEl) {
        const headerOffset = 76;
        const elPos = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, elPos),
          behavior: "smooth"
        });
        if (history.pushState) {
          history.pushState(null, null, href);
        }
      }
    } else {
      window.location.href = href;
    }
  }

  if (btnPinTree) {
    btnPinTree.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleTree();
    });
  }

  if (btnCloseTree) {
    btnCloseTree.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTreeExplicitly();
    });
  }

  if (railNavigator) {
    railNavigator.addEventListener("mouseenter", () => {
      railNavigator.classList.remove("is-closed");
      openRailPanel();
    });

    railNavigator.addEventListener("mouseleave", () => {
      railNavigator.classList.remove("is-closed");
      if (!isPinned) closeRailPanel(250);
    });

    railNavigator.addEventListener("wheel", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isWheeling = true;
      openTreeExplicitly(false);

      if (wheelCooldownTimer) clearTimeout(wheelCooldownTimer);
      wheelCooldownTimer = setTimeout(() => { isWheeling = false; }, 260);

      wheelAccumulator += e.deltaY;
      const steps = Math.trunc(wheelAccumulator / WHEEL_SENSITIVITY);
      if (steps !== 0) {
        wheelAccumulator -= steps * WHEEL_SENSITIVITY;
        highlightTreeNode(currentSubIndex + steps);
      }

      if (wheelReleaseTimer) clearTimeout(wheelReleaseTimer);
      wheelReleaseTimer = setTimeout(() => {
        navigateToNode(currentSubIndex);
      }, 350);
    }, { passive: false });
  }

  if (railTrack) {
    tickMarks.forEach((tick, i) => {
      tick.addEventListener("mouseenter", openRailPanel);
      tick.addEventListener("click", (e) => {
        e.stopPropagation();
        const targetNodeIdx = Math.round((i / Math.max(tickMarks.length - 1, 1)) * (treeNodes.length - 1));
        navigateToNode(targetNodeIdx);
      });
    });
  }

  if (railTreePanel) {
    railTreePanel.addEventListener("mouseenter", openRailPanel);
    railTreePanel.addEventListener("mouseleave", () => closeRailPanel(250));
  }

  treeNodes.forEach((node, idx) => {
    node.addEventListener("click", (e) => {
      const href = node.getAttribute("href") || "";
      if (href.startsWith("#")) {
        e.preventDefault();
        navigateToNode(idx);
      } else {
        highlightTreeNode(idx);
      }
    });
  });

  // Dynamic ScrollSpy for in-page section anchors
  const hasInPageTree = treeNodes.some((n) => (n.getAttribute("href") || "").startsWith("#"));
  if (hasInPageTree) {
    let scrollSpyScheduled = false;
    function runScrollSpy() {
      scrollSpyScheduled = false;
      const scrollPos = window.scrollY + 120;
      let matchedIdx = 0;

      for (let i = 0; i < treeNodes.length; i++) {
        const href = treeNodes[i].getAttribute("href") || "";
        if (href.startsWith("#")) {
          const el = document.querySelector(href);
          if (el && el.offsetTop <= scrollPos) {
            matchedIdx = i;
          }
        }
      }

      if (matchedIdx !== currentSubIndex && !isWheeling) {
        highlightTreeNode(matchedIdx);
      }
    }

    window.addEventListener("scroll", () => {
      if (!scrollSpyScheduled) {
        scrollSpyScheduled = true;
        requestAnimationFrame(runScrollSpy);
      }
    }, { passive: true });
  }

  // Quick scrub strip drag
  if (treeScrubStrip) {
    let isScrubbing = false;
    function scrubY(clientY) {
      const rect = treeScrubStrip.getBoundingClientRect();
      const clampedY = Math.min(Math.max(clientY, rect.top), rect.bottom);
      const ratio = (clampedY - rect.top) / Math.max(rect.height, 1);
      const targetIdx = Math.min(Math.round(ratio * (treeNodes.length - 1)), treeNodes.length - 1);
      highlightTreeNode(targetIdx);
    }

    treeScrubStrip.addEventListener("pointerdown", (e) => {
      isScrubbing = true;
      try { treeScrubStrip.setPointerCapture(e.pointerId); } catch (err) {}
      scrubY(e.clientY);
    });

    treeScrubStrip.addEventListener("pointermove", (e) => {
      if (isScrubbing) scrubY(e.clientY);
    });

    treeScrubStrip.addEventListener("pointerup", (e) => {
      if (isScrubbing) {
        isScrubbing = false;
        try { treeScrubStrip.releasePointerCapture(e.pointerId); } catch (err) {}
        navigateToNode(currentSubIndex);
        closeRailPanel(300);
      }
    });

    treeScrubStrip.addEventListener("pointercancel", () => {
      isScrubbing = false;
      closeRailPanel(200);
    });
  }

  // Initial highlight of active page
  highlightTreeNode(activeNodeIdx);

  // ================= 3. TOP RIGHT SHORTCUTS, ACCOUNT & SETTINGS PANELS =================
  const shortcutsWrapper = document.getElementById("shortcuts-wrapper");
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  const accountWrapper = document.getElementById("account-wrapper");
  const accountBtn = document.getElementById("account-btn");
  const settingsWrapper = document.getElementById("settings-wrapper");
  const settingsBtn = document.getElementById("settings-btn");

  if (shortcutsBtn) {
    shortcutsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (accountWrapper) accountWrapper.classList.remove("is-open");
      if (settingsWrapper) settingsWrapper.classList.remove("is-open");
      if (shortcutsWrapper) shortcutsWrapper.classList.toggle("is-open");
    });
  }

  if (accountBtn) {
    accountBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (shortcutsWrapper) shortcutsWrapper.classList.remove("is-open");
      if (settingsWrapper) settingsWrapper.classList.remove("is-open");
      if (accountWrapper) accountWrapper.classList.toggle("is-open");
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (shortcutsWrapper) shortcutsWrapper.classList.remove("is-open");
      if (accountWrapper) accountWrapper.classList.remove("is-open");
      if (settingsWrapper) settingsWrapper.classList.toggle("is-open");
    });
  }

  document.addEventListener("click", (e) => {
    if (shortcutsWrapper && !shortcutsWrapper.contains(e.target)) {
      shortcutsWrapper.classList.remove("is-open");
    }
    if (accountWrapper && !accountWrapper.contains(e.target)) {
      accountWrapper.classList.remove("is-open");
    }
    if (settingsWrapper && !settingsWrapper.contains(e.target)) {
      settingsWrapper.classList.remove("is-open");
    }
  });

  // ================= 4. GLOBAL KEYBOARD SHORTCUTS =================
  // Tab key state: short tap cycles 3 sub-pages (x | y | z), long press (held >= 380ms) switches Guide <=> Index
  let tabHoldTimer = null;
  let tabVisualTimer = null;
  let isTabLongPressTriggered = false;
  const TAB_LONG_PRESS_MS = 380;
  const TAB_VISUAL_HINT_MS = 110;

  function clearTabTimers() {
    if (tabHoldTimer) {
      clearTimeout(tabHoldTimer);
      tabHoldTimer = null;
    }
    if (tabVisualTimer) {
      clearTimeout(tabVisualTimer);
      tabVisualTimer = null;
    }
    const otherSuiteBtn = isIndexSuite ? document.getElementById("btn-guide") : document.getElementById("btn-index");
    if (otherSuiteBtn) otherSuiteBtn.classList.remove("tab-hold-target");
  }

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

    // Helper: strictly true if NO modifier key (Ctrl, Shift, Alt, Meta) is pressed
    const noModifiers = !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;

    // 1. Tab: strictly alone (no Ctrl, Shift, Alt, Meta)
    if (e.key === "Tab") {
      if (!noModifiers) {
        clearTabTimers();
        isTabLongPressTriggered = false;
        return;
      }

      e.preventDefault();
      if (e.repeat) return; // Prevent autorepeat from resetting timer while held

      isTabLongPressTriggered = false;
      const otherSuiteBtn = isIndexSuite ? document.getElementById("btn-guide") : document.getElementById("btn-index");

      // Show subtle holding progress underline on target suite button after 110ms
      if (tabVisualTimer) clearTimeout(tabVisualTimer);
      tabVisualTimer = setTimeout(() => {
        if (otherSuiteBtn) otherSuiteBtn.classList.add("tab-hold-target");
      }, TAB_VISUAL_HINT_MS);

      // Trigger suite change if held >= 380ms
      if (tabHoldTimer) clearTimeout(tabHoldTimer);
      tabHoldTimer = setTimeout(() => {
        isTabLongPressTriggered = true;
        clearTabTimers();
        window.location.href = targetOtherSuiteUrl;
      }, TAB_LONG_PRESS_MS);

      return;
    }

    // 2. "[" toggles Account (strictly alone)
    if (e.key === "[" && noModifiers) {
      e.preventDefault();
      if (settingsWrapper) settingsWrapper.classList.remove("is-open");
      if (accountWrapper) accountWrapper.classList.toggle("is-open");
      return;
    }

    // 3. "]" toggles Settings (strictly alone)
    if (e.key === "]" && noModifiers) {
      e.preventDefault();
      if (shortcutsWrapper) shortcutsWrapper.classList.remove("is-open");
      if (accountWrapper) accountWrapper.classList.remove("is-open");
      if (settingsWrapper) settingsWrapper.classList.toggle("is-open");
      return;
    }

    // 4. "?" toggles Keyboard Shortcuts Panel (strictly ? or Shift+/, no Ctrl, Alt, Meta)
    if ((e.key === "?" || (e.shiftKey && e.key === "/")) && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      if (accountWrapper) accountWrapper.classList.remove("is-open");
      if (settingsWrapper) settingsWrapper.classList.remove("is-open");
      if (shortcutsWrapper) shortcutsWrapper.classList.toggle("is-open");
      return;
    }

    // 5. "Space" opens/closes Directory Tree (strictly alone)
    if ((e.code === "Space" || e.key === " ") && noModifiers) {
      e.preventDefault();
      toggleTree();
      return;
    }

    // 6. Ctrl + Arrow: Directly move up/down section from current section WITHOUT showing directory tree (strictly Ctrl/Meta alone, no Shift, no Alt)
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      closeTreeExplicitly(); // Guarantee directory tree is NOT shown

      if (hasInPageTree && treeNodes.length > 0) {
        let targetIdx = currentSubIndex;
        if (e.key === "ArrowDown") {
          targetIdx = Math.min(treeNodes.length - 1, currentSubIndex + 1);
        } else {
          targetIdx = Math.max(0, currentSubIndex - 1);
        }
        navigateToNode(targetIdx);
        return;
      }

      const allSectionPages = [
        "index.html",
        "founder.html",
        "investor.html",
        "bottleneck.html",
        "index-view.html",
        "graph.html",
        "directory.html",
        "source.html"
      ];

      const currentFile = pathname.split("/").pop().toLowerCase() || "index.html";
      let currIdx = allSectionPages.findIndex((p) => currentFile === p || (currentFile === "guide.html" && p === "index.html"));
      if (currIdx === -1) {
        currIdx = allSectionPages.findIndex((p) => currentFile.includes(p.replace(".html", "")));
      }
      if (currIdx === -1) currIdx = 0;

      let targetIdx = currIdx;
      if (e.key === "ArrowDown") {
        targetIdx = (currIdx + 1) % allSectionPages.length;
      } else {
        targetIdx = (currIdx - 1 + allSectionPages.length) % allSectionPages.length;
      }

      window.location.href = allSectionPages[targetIdx];
      return;
    }

    // 7. Normal Arrow Up / Down: Move / scroll page with zero delay (strictly alone, no modifiers)
    if (e.key === "ArrowDown" && noModifiers) {
      e.preventDefault();
      window.scrollBy({ top: 90, behavior: "auto" });
      return;
    }

    if (e.key === "ArrowUp" && noModifiers) {
      e.preventDefault();
      window.scrollBy({ top: -90, behavior: "auto" });
      return;
    }

    // 8. Enter inside open tree navigates to current node (strictly alone)
    if (e.key === "Enter" && noModifiers && isTreeCurrentlyOpen()) {
      e.preventDefault();
      navigateToNode(currentSubIndex);
      return;
    }

    // 9. Escape closes all open panels, menus, and directory tree (strictly alone)
    if (e.key === "Escape" && noModifiers) {
      if (shortcutsWrapper) shortcutsWrapper.classList.remove("is-open");
      if (accountWrapper) accountWrapper.classList.remove("is-open");
      if (settingsWrapper) settingsWrapper.classList.remove("is-open");
      closeTreeExplicitly();
      return;
    }
  });

  document.addEventListener("keyup", (e) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

    if (e.key === "Tab") {
      // Must trigger if and only if NO modifier key (Ctrl, Shift, Alt, Meta) was pressed
      if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
        clearTabTimers();
        isTabLongPressTriggered = false;
        return;
      }

      e.preventDefault();
      clearTabTimers();

      // If long press already fired, do not execute short tap action
      if (isTabLongPressTriggered) {
        isTabLongPressTriggered = false;
        return;
      }

      // Short tap on Tab (strictly alone): Cycle forward through the 3 sub-pages (x | y | z)
      // Guide Suite: Founder | Investor | Bottleneck
      // Index Suite: Graph | Directory | Source
      const currentFile = pathname.split("/").pop() || "index.html";
      const guidePages = ["founder.html", "investor.html", "bottleneck.html"];
      const indexPages = ["graph.html", "directory.html", "source.html"];

      const activePages = isIndexSuite ? indexPages : guidePages;
      let currIdx = activePages.findIndex((p) => currentFile.toLowerCase().includes(p));

      let nextIdx = 0;
      if (currIdx === -1) {
        nextIdx = 0;
      } else {
        nextIdx = (currIdx + 1) % activePages.length;
      }

      window.location.href = activePages[nextIdx];
      return;
    }
  });

  window.addEventListener("blur", () => {
    clearTabTimers();
    isTabLongPressTriggered = false;
  });

  // ================= 5. THEME, FONT SIZE & FONT STYLE PERSISTENCE =================
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

  const dropdownItems = document.querySelectorAll(".dropdown-item");
  dropdownItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = item.getAttribute("data-type");
      const val = item.getAttribute("data-val");

      if (type === "font-size") {
        document.querySelectorAll("#list-font-size .dropdown-item").forEach((el) => el.classList.remove("active"));
        item.classList.add("active");
        if (fontSizeLabel) fontSizeLabel.textContent = item.textContent.split(" ")[0];
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

  const savedTheme = localStorage.getItem("indexindian_theme");
  if (savedTheme === "dark") {
    document.body.classList.add("theme-dark");
    document.body.classList.remove("theme-light");
    if (contrastToggle) contrastToggle.checked = true;
  }

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

  // ==========================================================================
  // 8. ANONYMOUS IST RESEARCH FORUM MODULE (SUPABASE + LOCAL FALLBACK)
  // ==========================================================================
  // When you obtain your project credentials from supabase.com:
  // 1. Enter your Project URL in SUPABASE_CONFIG.url
  // 2. Enter your "anon" "public" key in SUPABASE_CONFIG.anonKey
  // 3. Run the SQL table migration snippet in Supabase SQL editor
  const SUPABASE_CONFIG = {
    url: "https://hssphsykrgyvejxfkfin.supabase.co",
    anonKey: "sb_publishable_PwCnO8oI58ESwGGwtLgsQw_vZ9o05_n",
    tableName: "forum_messages",
    retentionDays: 30
  };

  function getSupabaseBaseUrl() {
    return (SUPABASE_CONFIG.url || "").replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  }

  function getIndianStandardTimeNow() {
    return new Date().toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function getIndianStandardDateTimeString(dateInput) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Recent";
    const dateStr = d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const timeStr = d.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    return `${dateStr}, ${timeStr} IST`;
  }

  function getISTUsername() {
    return `ANON_${getIndianStandardTimeNow()}_IST`;
  }

  function getForumPageId() {
    const p = window.location.pathname.toLowerCase().split("/").pop() || "index.html";
    if (p.includes("index-view")) return "index-view";
    if (p.includes("graph")) return "graph";
    if (p.includes("directory")) return "directory";
    if (p.includes("source")) return "source";
    if (p.includes("founder")) return "founder";
    if (p.includes("investor")) return "investor";
    if (p.includes("bottleneck")) return "bottleneck";
    return "guide";
  }

  function getLocalForumMessages(pageId, cutoffMs) {
    try {
      const raw = localStorage.getItem(`indexindian_forum_${pageId}`);
      if (!raw) return [];
      const list = JSON.parse(raw);
      const valid = list.filter((m) => {
        const t = new Date(m.created_at).getTime();
        return !isNaN(t) && t >= cutoffMs;
      });
      if (valid.length !== list.length) {
        localStorage.setItem(`indexindian_forum_${pageId}`, JSON.stringify(valid));
      }
      return valid;
    } catch (e) {
      console.warn("[IndexIndian Forum] Error reading local forum storage:", e);
      return [];
    }
  }

  function saveLocalForumMessage(pageId, username, message, createdAtISO, parentId = null) {
    try {
      const cutoffMs = Date.now() - (SUPABASE_CONFIG.retentionDays * 86400 * 1000);
      const current = getLocalForumMessages(pageId, cutoffMs);
      const newEntry = {
        id: `local_${Date.now()}`,
        page_id: pageId,
        username: username,
        message: message,
        parent_id: parentId,
        created_at: createdAtISO
      };
      current.push(newEntry);
      const trimmed = current.slice(-100);
      localStorage.setItem(`indexindian_forum_${pageId}`, JSON.stringify(trimmed));
      return newEntry;
    } catch (e) {
      console.warn("[IndexIndian Forum] Error saving local forum message:", e);
      return null;
    }
  }

  function escapeForumHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Build 2-level directory tree hierarchy
  function buildCommentTree(messages) {
    const map = new Map();
    const roots = [];

    // Pass 1: Parse parent IDs and clean comment text
    messages.forEach((m) => {
      let parentId = null;
      let cleanText = (m.message || "").trim();

      if (m.parent_id !== undefined && m.parent_id !== null) {
        parentId = String(m.parent_id);
      } else {
        const match = cleanText.match(/^\[re:([^\]]+)\]\s*/i);
        if (match) {
          parentId = match[1].trim();
          cleanText = cleanText.slice(match[0].length).trim();
        }
      }

      const node = {
        id: m.id,
        username: m.username || "ANON_IST",
        text: cleanText,
        parentId: parentId,
        children: [],
        depth: 0
      };
      map.set(String(m.id), node);
      map.set(Number(m.id), node);
    });

    // Pass 2: Connect children to parents, capping depth at 2 sub-sections
    messages.forEach((m) => {
      const node = map.get(String(m.id));
      let parent = null;

      if (node.parentId) {
        parent = map.get(String(node.parentId)) || map.get(Number(node.parentId));
        // Fallback: If parentId was from a local_ session, attach to preceding message
        if (!parent && typeof node.parentId === "string" && node.parentId.startsWith("local_")) {
          const currIdx = messages.findIndex((x) => String(x.id) === String(node.id));
          if (currIdx > 0) {
            parent = map.get(String(messages[currIdx - 1].id));
          }
        }
      }

      if (parent) {
        if (parent.depth < 2) {
          node.depth = parent.depth + 1;
        } else {
          node.depth = 2; // Capped at depth 2 (2 sub-directory sections)
        }
        parent.children.push(node);
      } else {
        node.depth = 0;
        roots.push(node);
      }
    });

    return roots;
  }

  // Render individual tree node (compact, username + comment only)
  function renderTreeNodeHtml(node, isLastChild) {
    const safeAuthor = escapeForumHtml(node.username);
    const safeContent = escapeForumHtml(node.text);
    const branchSymbol = isLastChild ? "└──" : "├──";
    const canReply = node.depth < 2; // Up to 2 sub-directory sections

    const replyButtonHtml = canReply
      ? `<button type="button" class="tree-reply-trigger font-mono" data-id="${node.id}" data-author="${safeAuthor}" title="Reply to ${safeAuthor}">[reply]</button>`
      : "";

    let childrenHtml = "";
    if (node.children && node.children.length > 0) {
      const childCount = node.children.length;
      const childItemsHtml = node.children.map((child, idx) => {
        return renderTreeNodeHtml(child, idx === childCount - 1);
      }).join("");

      childrenHtml = `<div class="tree-children" id="tree-children-${node.id}">${childItemsHtml}</div>`;
    } else {
      childrenHtml = `<div class="tree-children" id="tree-children-${node.id}" style="display:none;"></div>`;
    }

    return `
      <div class="tree-node-item" data-id="${node.id}" data-depth="${node.depth}">
        <div class="tree-node-row">
          <span class="tree-branch-symbol font-mono">${branchSymbol}</span>
          <span class="tree-node-author font-mono">${safeAuthor}<span class="tree-node-colon">:</span></span>
          <span class="tree-node-text">${safeContent}</span>
          ${replyButtonHtml}
        </div>
        <div class="tree-reply-slot" id="reply-slot-${node.id}"></div>
        ${childrenHtml}
      </div>
    `;
  }

  function renderForumMessages(messages, container) {
    if (!container) return;
    if (!messages || messages.length === 0) {
      container.innerHTML = `
        <div class="forum-empty-state font-mono">
          └── [DIRECTORY EMPTY] NO COMMENTS POSTED YET. BROADCAST A MAIN THREAD BELOW.
        </div>
      `;
      return;
    }

    const roots = buildCommentTree(messages);
    const totalRoots = roots.length;
    const html = `
      <div class="tree-forum-feed" id="tree-forum-feed">
        ${roots.map((rootNode, idx) => renderTreeNodeHtml(rootNode, idx === totalRoots - 1)).join("")}
      </div>
    `;

    container.innerHTML = html;
  }

  async function loadForumMessages() {
    const listEl = document.getElementById("forum-messages-list");
    if (!listEl) return;

    const pageId = getForumPageId();
    const cutoffMs = Date.now() - (SUPABASE_CONFIG.retentionDays * 86400 * 1000);
    const isSupabaseLive = Boolean(
      SUPABASE_CONFIG.url &&
      SUPABASE_CONFIG.anonKey &&
      !SUPABASE_CONFIG.url.includes("YOUR_") &&
      SUPABASE_CONFIG.url.startsWith("https://")
    );

    let messages = [];

    if (isSupabaseLive) {
      try {
        const base = getSupabaseBaseUrl();
        const cutoffISO = new Date(cutoffMs).toISOString();
        const endpoint = `${base}/rest/v1/${SUPABASE_CONFIG.tableName}?page_id=eq.${encodeURIComponent(pageId)}&created_at=gte.${cutoffISO}&order=created_at.asc&limit=100`;
        const res = await fetch(endpoint, {
          headers: {
            "apikey": SUPABASE_CONFIG.anonKey,
            "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`
          }
        });

        if (res.ok) {
          messages = await res.json();
        } else {
          console.warn("[IndexIndian Forum] Supabase fetch status:", res.status, "using local fallback");
          messages = getLocalForumMessages(pageId, cutoffMs);
        }
      } catch (err) {
        console.warn("[IndexIndian Forum] Supabase network error, using local fallback:", err);
        messages = getLocalForumMessages(pageId, cutoffMs);
      }
    } else {
      messages = getLocalForumMessages(pageId, cutoffMs);
    }

    renderForumMessages(messages, listEl);
  }

  async function broadcastForumMessage(rawText, parentId = null) {
    const text = rawText.trim();
    if (!text) return false;

    const pageId = getForumPageId();
    const username = getISTUsername();
    const nowISO = new Date().toISOString();
    const finalMessage = parentId ? `[re:${parentId}] ${text}` : text;

    const isSupabaseLive = Boolean(
      SUPABASE_CONFIG.url &&
      SUPABASE_CONFIG.anonKey &&
      !SUPABASE_CONFIG.url.includes("YOUR_") &&
      SUPABASE_CONFIG.url.startsWith("https://")
    );

    if (isSupabaseLive) {
      try {
        const base = getSupabaseBaseUrl();
        const endpoint = `${base}/rest/v1/${SUPABASE_CONFIG.tableName}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "apikey": SUPABASE_CONFIG.anonKey,
            "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            page_id: pageId,
            username: username,
            message: finalMessage,
            created_at: nowISO
          })
        });

        if (!res.ok) {
          console.warn("[IndexIndian Forum] Supabase post failed, caching locally");
          saveLocalForumMessage(pageId, username, finalMessage, nowISO, parentId);
        }
      } catch (err) {
        console.warn("[IndexIndian Forum] Network error during post, caching locally:", err);
        saveLocalForumMessage(pageId, username, finalMessage, nowISO, parentId);
      }
    } else {
      saveLocalForumMessage(pageId, username, finalMessage, nowISO, parentId);
    }

    await loadForumMessages();
    return true;
  }

  const forumForm = document.getElementById("forum-composer");
  const forumInput = document.getElementById("forum-input");
  const forumSendBtn = document.getElementById("forum-send-btn");
  const forumRefreshBtn = document.getElementById("forum-refresh-btn");
  const composerCharCounter = document.getElementById("composer-char-counter");
  const currentIstUsernameEl = document.getElementById("current-ist-username");
  const btnIstTimeEl = document.getElementById("btn-ist-time");

  // Real-time IST username clock ticker
  function tickForumClock() {
    const istTime = getIndianStandardTimeNow();
    if (currentIstUsernameEl) {
      currentIstUsernameEl.textContent = `ANON_${istTime}_IST`;
    }
    if (btnIstTimeEl) {
      btnIstTimeEl.textContent = `${istTime} IST`;
    }
  }
  tickForumClock();
  setInterval(tickForumClock, 1000);

  // Character counter for main composer
  if (forumInput && composerCharCounter) {
    forumInput.addEventListener("input", () => {
      const len = forumInput.value.length;
      composerCharCounter.textContent = `${len} / 300`;
    });
  }

  // Submit handler for main composer (root thread)
  async function handleForumSubmit() {
    if (!forumInput) return;
    const text = forumInput.value.trim();
    if (!text) return;

    if (forumSendBtn) {
      forumSendBtn.disabled = true;
      forumSendBtn.textContent = "SENDING...";
    }

    try {
      await broadcastForumMessage(text);
      forumInput.value = "";
      if (composerCharCounter) composerCharCounter.textContent = "0 / 300";
    } finally {
      if (forumSendBtn) {
        forumSendBtn.disabled = false;
        forumSendBtn.textContent = "SEND";
      }
    }
  }

  if (forumForm) {
    forumForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleForumSubmit();
    });
  }

  // Ctrl+Enter or Cmd+Enter to send from inside main textarea
  if (forumInput) {
    forumInput.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleForumSubmit();
      }
    });
  }

  // Inline Reply Handling: Click [reply] to open inline composer
  document.addEventListener("click", (e) => {
    const replyBtn = e.target.closest(".tree-reply-trigger");
    if (!replyBtn) return;

    e.preventDefault();
    const commentId = replyBtn.getAttribute("data-id");
    const author = replyBtn.getAttribute("data-author") || "ANON";
    const slot = document.getElementById(`reply-slot-${commentId}`);
    if (!slot) return;

    // Toggle: if already open, close it
    if (slot.querySelector(".tree-inline-composer")) {
      slot.innerHTML = "";
      return;
    }

    // Close any other open reply slots
    document.querySelectorAll(".tree-reply-slot").forEach((s) => { s.innerHTML = ""; });

    // Open inline composer
    slot.innerHTML = `
      <form class="tree-inline-composer" data-parent-id="${commentId}">
        <span class="tree-branch-symbol font-mono">└──</span>
        <span class="tree-replying-tag font-mono">REPLY TO ${escapeForumHtml(author)}:</span>
        <input type="text" class="tree-inline-input font-mono" maxlength="300" placeholder="Type reply (Enter to send)..." autocomplete="off" />
        <button type="submit" class="tree-inline-submit font-mono">REPLY</button>
        <button type="button" class="tree-inline-cancel font-mono" title="Cancel">&times;</button>
      </form>
    `;

    const input = slot.querySelector(".tree-inline-input");
    if (input) {
      input.focus();
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape") {
          slot.innerHTML = "";
        }
      });
    }
  });

  // Handle inline reply form submission
  document.addEventListener("submit", async (e) => {
    const inlineForm = e.target.closest(".tree-inline-composer");
    if (!inlineForm) return;

    e.preventDefault();
    const parentId = inlineForm.getAttribute("data-parent-id");
    const input = inlineForm.querySelector(".tree-inline-input");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const submitBtn = inlineForm.querySelector(".tree-inline-submit");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "...";
    }

    try {
      await broadcastForumMessage(text, parentId);
    } finally {
      inlineForm.remove();
    }
  });

  // Handle inline reply cancel button
  document.addEventListener("click", (e) => {
    const cancelBtn = e.target.closest(".tree-inline-cancel");
    if (!cancelBtn) return;
    e.preventDefault();
    const composer = cancelBtn.closest(".tree-inline-composer");
    if (composer) composer.remove();
  });

  if (forumRefreshBtn) {
    forumRefreshBtn.addEventListener("click", () => {
      loadForumMessages();
    });
  }

  // Initial load
  if (document.getElementById("forum-messages-list")) {
    loadForumMessages();
  }
});
