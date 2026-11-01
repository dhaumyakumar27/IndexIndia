/**
 * IndexIndian (Firm D) — Core Institutional Interactions
 * Zero-bloat, lightweight vanilla JS across all 8 modular pages.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ================= 1. PAGE CONTEXT & VIEW DETECTION =================
  const pathname = window.location.pathname.toLowerCase();
  const currentFile = pathname.split("/").pop() || "index.html";
  const isGuideSuite = pathname.includes("guide") || pathname.includes("founder") || pathname.includes("investor") || pathname.includes("bottleneck");
  const isIndexSuite = !isGuideSuite;

  // Keyboard shortcut Tab switches between Guide landing <=> Index landing
  const targetOtherSuiteUrl = isIndexSuite ? "guide.html" : "index.html";

  // Forward declarations for Doubt Solver & Top Nav Search so global listeners can invoke them
  let toggleDoubtSolver = function() {};
  let openDoubtSolver = function() {};
  let closeDoubtSolver = function() {};
  let focusNavSearchBar = function() {};
  let closeNavSearchResults = function() {};
  let clearFinderHighlights = function() {};
  let nextFinderMatch = function() {};
  let prevFinderMatch = function() {};
  let isFinderActive = function() { return false; };

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
    if (window.innerWidth <= 1280 && typeof closeDoubtSolver === "function") {
      closeDoubtSolver();
    }
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
    if (window.innerWidth <= 1280 && typeof closeDoubtSolver === "function") {
      closeDoubtSolver();
    }
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

  let activeSectionEl = null;

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
      const activeEl = document.querySelector(href);
      if (activeEl !== activeSectionEl) {
        if (activeSectionEl) activeSectionEl.classList.remove("is-active-section");
        if (activeEl) activeEl.classList.add("is-active-section");
        activeSectionEl = activeEl;
      }
    }

    if (isTreeCurrentlyOpen()) {
      scrollTreeToNode(targetNode);
    }
    updateTreeTelemetryUI();
  }

  function navigateToNode(index, preferDivider = true) {
    highlightTreeNode(index);
    const targetNode = treeNodes[currentSubIndex];
    if (!targetNode) return;
    const href = targetNode.getAttribute("href");
    if (!href) return;

    if (href.startsWith("#")) {
      const targetEl = document.querySelector(href);
      if (targetEl) {
        let scrollEl = targetEl;
        if (preferDivider) {
          const prevEl = targetEl.previousElementSibling;
          if (prevEl && prevEl.classList.contains("story-act-divider")) {
            scrollEl = prevEl;
          }
        }
        const headerOffset = 76;
        const elPos = scrollEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
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

  function getActNodeIndices() {
    const indices = [];

    // Strategy 1: Story Act dividers in main viewport (investor.html has 7 acts)
    const actDividers = Array.from(document.querySelectorAll(".story-act-divider"));
    if (actDividers.length > 0) {
      actDividers.forEach((div) => {
        let next = div.nextElementSibling;
        while (next && !next.classList.contains("story-node-section") && !next.classList.contains("page-directory-section")) {
          next = next.nextElementSibling;
        }
        if (next && next.id) {
          const idx = treeNodes.findIndex((n) => n.getAttribute("href") === `#${next.id}`);
          if (idx !== -1 && !indices.includes(idx)) {
            indices.push(idx);
          }
        }
      });
    }

    // Strategy 2: If no act dividers, check multiple section headers in tree drawer
    if (indices.length <= 1) {
      const sectionHeaders = Array.from(document.querySelectorAll("#tree-content-scroll .tree-section-header"));
      if (sectionHeaders.length > 1) {
        indices.length = 0;
        sectionHeaders.forEach((hdr) => {
          let next = hdr.nextElementSibling;
          while (next && !next.classList.contains("tree-node")) {
            next = next.nextElementSibling;
          }
          if (next && next.classList.contains("tree-node")) {
            const idx = treeNodes.indexOf(next);
            if (idx !== -1 && !indices.includes(idx)) {
              indices.push(idx);
            }
          }
        });
      }
    }

    // Strategy 3: Graceful fallback for 5-node single-header pages: jump top / bottom
    if (indices.length <= 1 && treeNodes.length > 0) {
      indices.length = 0;
      indices.push(0);
      if (treeNodes.length > 1) {
        indices.push(treeNodes.length - 1);
      }
    }

    return indices;
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
    let sectionTargets = [];

    function updateSectionOffsets() {
      sectionTargets = [];
      for (let i = 0; i < treeNodes.length; i++) {
        const href = treeNodes[i].getAttribute("href") || "";
        if (href.startsWith("#")) {
          const el = document.querySelector(href);
          if (el) {
            const prev = el.previousElementSibling;
            const checkEl = (prev && prev.classList.contains("story-act-divider")) ? prev : el;
            sectionTargets.push({
              index: i,
              offsetTop: checkEl.offsetTop
            });
          }
        }
      }
    }

    updateSectionOffsets();
    window.addEventListener("resize", updateSectionOffsets, { passive: true });

    function runScrollSpy() {
      scrollSpyScheduled = false;
      const scrollPos = window.scrollY + 120;
      let matchedIdx = 0;

      for (let i = 0; i < sectionTargets.length; i++) {
        if (sectionTargets[i].offsetTop <= scrollPos) {
          matchedIdx = sectionTargets[i].index;
        } else {
          break;
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

  // ================= SMOOTH DELAYLESS KEYBOARD SCROLLING ENGINE =================
  // Continuous 60fps/120fps motion with ZERO repeat delay when holding arrow keys.
  // Uses integer pixel rounding (Math.trunc) to eliminate subpixel font rasterization jumping.
  let smoothScrollRaf = null;
  let activeArrowDirection = 0; // +1 = down, -1 = up, 0 = idle
  let smoothVelocity = 0;
  let isArrowHeld = false;
  let lastFrameTime = 0;
  let subPixelAccumulator = 0;

  const MAX_CRUISE_SPEED = 9.5; // pixels per frame at 60fps (~570px/sec cruising speed)
  const TAP_INITIAL_VELOCITY = 3.8; // gentle initial impulse on tap (~26-30px total displacement)
  const ACCELERATION = 0.42; // smooth ramp-up to cruising speed while held (~250ms)
  const FRICTION = 0.84; // silky ~120ms ease-out on key release

  function cancelSmoothScrollImmediately() {
    isArrowHeld = false;
    smoothVelocity = 0;
    activeArrowDirection = 0;
    subPixelAccumulator = 0;
    if (smoothScrollRaf) {
      cancelAnimationFrame(smoothScrollRaf);
      smoothScrollRaf = null;
    }
    lastFrameTime = 0;
  }

  function stepSmoothScroll(timestamp) {
    const elapsed = lastFrameTime ? Math.min(timestamp - lastFrameTime, 32) : 16.667;
    lastFrameTime = timestamp;
    const timeScale = elapsed / 16.667; // Normalized to 60fps

    if (isArrowHeld) {
      if (smoothVelocity < MAX_CRUISE_SPEED) {
        smoothVelocity = Math.min(MAX_CRUISE_SPEED, smoothVelocity + ACCELERATION * timeScale);
      }
    } else {
      smoothVelocity *= Math.pow(FRICTION, timeScale);
    }

    if (smoothVelocity > 0.4) {
      subPixelAccumulator += activeArrowDirection * smoothVelocity * timeScale;
      const intStep = Math.trunc(subPixelAccumulator);

      if (intStep !== 0) {
        subPixelAccumulator -= intStep;
        const prevScrollY = window.scrollY;
        window.scrollBy(0, intStep);

        // Stop if at top or bottom boundary
        if (window.scrollY === prevScrollY) {
          cancelSmoothScrollImmediately();
          return;
        }
      }

      smoothScrollRaf = requestAnimationFrame(stepSmoothScroll);
    } else {
      cancelSmoothScrollImmediately();
    }
  }

  function startSmoothScroll(direction) {
    activeArrowDirection = direction;
    isArrowHeld = true;
    if (smoothVelocity < TAP_INITIAL_VELOCITY) {
      smoothVelocity = TAP_INITIAL_VELOCITY;
    }
    if (!smoothScrollRaf) {
      lastFrameTime = 0;
      subPixelAccumulator = 0;
      smoothScrollRaf = requestAnimationFrame(stepSmoothScroll);
    }
  }

  function stopSmoothScroll() {
    isArrowHeld = false;
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

    // 5. "N" opens/closes Directory Tree (strictly alone, KeyN or 'n'/'N', no Ctrl, Alt, Meta)
    if ((e.code === "KeyN" || e.key?.toLowerCase() === "n") && noModifiers) {
      e.preventDefault();
      toggleTree();
      return;
    }

    // 5b. "/" focuses Universal Top Search Bar (strictly alone, KeySlash or '/')
    if ((e.code === "Slash" || e.key === "/") && noModifiers) {
      e.preventDefault();
      focusNavSearchBar();
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
        "guide.html",
        "founder.html",
        "investor.html",
        "bottleneck.html",
        "index.html",
        "graph.html",
        "directory.html",
        "source.html"
      ];

      const currentFile = pathname.split("/").pop().toLowerCase() || "index.html";
      let currIdx = allSectionPages.findIndex((p) => currentFile === p || (currentFile === "" && p === "index.html"));
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

    // 7. Shift + Arrow: Directly jump through Acts (I | II | III | IV ...) WITHOUT showing directory tree
    // Strictly Shift alone, no Ctrl, Alt, Meta (zero modifier crosstalk)
    if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      closeTreeExplicitly(); // Guarantee directory tree is NOT shown

      const actIndices = getActNodeIndices();
      if (actIndices.length > 0) {
        if (e.key === "ArrowDown") {
          const nextIdx = actIndices.find((idx) => idx > currentSubIndex);
          if (nextIdx !== undefined) {
            navigateToNode(nextIdx, true);
          } else {
            navigateToNode(actIndices[actIndices.length - 1], true);
          }
        } else {
          const prevIndices = actIndices.filter((idx) => idx < currentSubIndex);
          if (prevIndices.length > 0) {
            const prevIdx = prevIndices[prevIndices.length - 1];
            navigateToNode(prevIdx, true);
          } else {
            navigateToNode(actIndices[0], true);
          }
        }
      }
      return;
    }

    // 8. Normal Arrow Up / Down: Smooth delayless page scrolling (strictly alone, no modifiers)
    // Instant 0ms start when holding, integer-pixel translation with zero subpixel font jumping
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && noModifiers) {
      e.preventDefault();
      startSmoothScroll(e.key === "ArrowDown" ? 1 : -1);
      return;
    }

    // 9. Enter inside open tree navigates to current node (strictly alone)
    if (e.key === "Enter" && noModifiers && isTreeCurrentlyOpen()) {
      e.preventDefault();
      navigateToNode(currentSubIndex);
      return;
    }

    // 10. Shortcut 'M': Toggle DuckDuckGo Doubt Solver (KeyM or 'm'/'M', no Ctrl, Alt, Meta)
    if ((e.code === "KeyM" || e.key?.toLowerCase() === "m") && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      toggleDoubtSolver();
      return;
    }

    // 10b. In-Page Finder Active Navigation (Enter -> next match, Shift+Enter -> prev match)
    if (isFinderActive()) {
      if (e.key === "Enter" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (e.shiftKey) {
          prevFinderMatch();
        } else {
          nextFinderMatch();
        }
        return;
      }
    }

    // 11. Escape closes all open panels, menus, directory tree, Doubt Solver, Command Palette, and Finder
    if (e.key === "Escape" && noModifiers) {
      if (shortcutsWrapper) shortcutsWrapper.classList.remove("is-open");
      if (accountWrapper) accountWrapper.classList.remove("is-open");
      if (settingsWrapper) settingsWrapper.classList.remove("is-open");
      closeTreeExplicitly();
      closeDoubtSolver();
      closeNavSearchResults();
      clearFinderHighlights();
      return;
    }
  });

  document.addEventListener("keyup", (e) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

    if (e.key === "ArrowDown" && activeArrowDirection === 1) {
      stopSmoothScroll();
    } else if (e.key === "ArrowUp" && activeArrowDirection === -1) {
      stopSmoothScroll();
    }

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
    cancelSmoothScrollImmediately();
  });

  window.addEventListener("wheel", () => {
    if (smoothScrollRaf) {
      cancelSmoothScrollImmediately();
    }
  }, { passive: true });

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
    if (p.includes("guide")) return "guide";
    if (p.includes("founder")) return "founder";
    if (p.includes("investor")) return "investor";
    if (p.includes("bottleneck")) return "bottleneck";
    if (p.includes("graph")) return "graph";
    if (p.includes("directory")) return "directory";
    if (p.includes("source")) return "source";
    return "index";
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

  // ================= 9. AI DOUBT SOLVER & INTELLIGENT EXPLAINER (DuckDuckGo Engine) =================
  const FORENSIC_KNOWLEDGE_BASE = [
    {
      terms: ["promoter pledging", "pledge", "pledged shares", "encumbrance", "collateral"],
      concept: "Promoters borrow debt from NBFCs or mutual funds by using their company equity as loan collateral.",
      screenContext: "High pledging poses sudden solvency and control risk. If share prices fall below margin limits, lenders dump pledged shares onto the open market, triggering severe stock collapse.",
      statutoryRule: "SEBI LODR Regulation 31 requires quarterly disclosure of all encumbrances. The Sovereign Index penalizes pledging above 15% and automatically excludes firms above 25%."
    },
    {
      terms: ["related party transaction", "rpt", "related party", "transfer pricing", "siphoning", "unlisted entity"],
      concept: "Commercial or financial contracts between a listed firm and entities owned by its promoters, key executives, or their relatives.",
      screenContext: "Forensic audits flag RPTs as the primary vector for extracting corporate cash—via inflated consultancy fees, unbacked loans to private promoter firms, or below-market asset sales.",
      statutoryRule: "Companies Act Section 188 & SEBI LODR Regulation 23 require prior Audit Committee approval. Material RPTs (>10% turnover) require minority shareholder approval where promoter votes are disqualified."
    },
    {
      terms: ["auditor resignation", "auditor", "statutory audit", "qualified opinion", "preoccupation", "audit committee"],
      concept: "An independent external audit firm quitting its statutory mandate before completing the standard 5-year appointment term.",
      screenContext: "Abrupt auditor exits are the single highest correlated forensic red flag for corporate fraud, fabricated revenue, or restricted access to company books.",
      statutoryRule: "Under SEBI Circular CIR/CFD/CMD1/114/2019, auditors must provide explicit forensic reasons for exit; resigning within 45 days of a quarter end mandates completing limited review first."
    },
    {
      terms: ["board independence", "independent director", "board of directors", "director tenure", "woman director"],
      concept: "Directors having zero pecuniary, commercial, or family ties with promoters or executive management.",
      screenContext: "Independent boards act as the primary defense for minority public shareholders against promoter overreach and capital misallocation.",
      statutoryRule: "SEBI LODR mandates at least 50% independent directors when the Chairman is an executive or promoter, alongside at least one independent woman director and 2-term (10-year) maximum caps."
    },
    {
      terms: ["herfindahl", "hhi", "concentration", "sector cap", "weighting", "weights"],
      concept: "The Herfindahl-Hirschman Index (HHI = sum of squared sector weights) quantitatively measures portfolio concentration and shock vulnerability.",
      screenContext: "In India, unconstrained market-cap weighting leaves portfolios dangerously vulnerable to concentrated single-sector swings (e.g. banking >35%). The index enforces strict 25% sector caps.",
      statutoryRule: "An HHI < 1,000 indicates a well-diversified sovereign benchmark; HHI > 1,800 denotes high concentration risk."
    },
    {
      terms: ["quarterly rebalancing", "rebalance", "rebalancing", "turnover", "buffer", "effective date"],
      concept: "Periodic re-calculation of constituent weights, inclusions, and exclusions on a disciplined quarterly timetable.",
      screenContext: "Rebalancing prevents constituent drift while utilizing turnover buffer bands (+/- 2.5%) to minimize transaction friction and execution slippage.",
      statutoryRule: "Index reconstitution takes place on the last trading day of March, June, September, and December based on 30-day Volume Weighted Average Price (VWAP)."
    },
    {
      terms: ["cash flow", "cfo", "operating cash flow", "pat", "divergence", "revenue recognition"],
      concept: "Operating Cash Flow (CFO) measures actual cash generated from operations, contrasting with accounting Net Profit (PAT).",
      screenContext: "A persistent gap where PAT expands while CFO remains flat or negative signals artificial revenue booking, channel stuffing, or uncollectible receivables.",
      statutoryRule: "Forensic governance mandates a minimum CFO/PAT ratio > 0.70 across 3-year rolling windows."
    },
    {
      terms: ["contingent liabilities", "guarantees", "off balance sheet", "tax dispute", "litigation"],
      concept: "Potential liabilities that may become actual obligations depending on future judicial or tax outcomes.",
      screenContext: "Promoter-guaranteed corporate guarantees to speculative subsidiaries often precipitate sudden insolvency when subsidiary operations fail.",
      statutoryRule: "Contingent liabilities exceeding 50% of net worth trigger an automatic governance rating downgrade."
    },
    {
      terms: ["free float", "market cap", "public shareholding", "locked-in", "minimum public shareholding"],
      concept: "Shares readily available for public trading, explicitly subtracting promoter stakes, government holdings, and locked employee equity.",
      screenContext: "Free-float weighting ensures the benchmark mirrors true investable liquidity rather than un-tradable promoter wealth.",
      statutoryRule: "SEBI mandates Minimum Public Shareholding (MPS) of 25% for all listed firms in India."
    },
    {
      terms: ["working capital", "receivables", "debtor days", "inventory days", "dso"],
      concept: "The operational liquidity cycle measuring days cash remains locked in inventory and unpaid customer invoices.",
      screenContext: "A rapid expansion in DSO (Days Sales Outstanding) without revenue growth is the hallmark indicator of artificial distributor stocking.",
      statutoryRule: "Forensic filters flag enterprises whose cash conversion cycles diverge by >40% from industry median peers."
    },
    {
      terms: ["ebitda", "operating margin", "operating profit", "topline", "revenue"],
      concept: "Earnings Before Interest, Taxes, Depreciation, and Amortization measures pure core operating profitability before financing leverage.",
      screenContext: "Forensic screening checks whether EBITDA growth aligns with real cash collections rather than aggressive revenue recognition policies.",
      statutoryRule: "Audited financial statements under Ind AS 115 require contractual verification before recognizing revenue from unfulfilled customer commitments."
    },
    {
      terms: ["pe ratio", "price to earnings", "valuation", "multiple", "p/e"],
      concept: "The Price-to-Earnings ratio measures equity market pricing relative to annual earnings per share.",
      screenContext: "Extreme valuation multiples unsupported by forensic cash conversion ratios signal speculative bubbles vulnerable to sharp multiple contraction.",
      statutoryRule: "Benchmark index rules filter out companies with persistently negative earnings or unstable trailing P/E multiples > 100x unless justified by certified cash flows."
    },
    {
      terms: ["debt to equity", "leverage", "solvency", "interest coverage", "dscr"],
      concept: "Measures company debt obligations relative to net worth and operating earnings available to service interest.",
      screenContext: "Over-leveraged balance sheets combined with promoter encumbrances lead to systemic default during interest rate tightening cycles.",
      statutoryRule: "Forensic solvency gates mandate interest coverage ratio (EBIT / Interest Expense) > 2.5x for sovereign benchmark inclusion."
    },
    {
      terms: ["sebi", "lodr", "regulations", "regulator", "capital markets", "insider trading"],
      concept: "Securities and Exchange Board of India (SEBI) is the statutory regulator governing public securities, investor protection, and disclosures.",
      screenContext: "Strict adherence to SEBI LODR rules prevents promoters from treating public minority equity as private proprietary funds.",
      statutoryRule: "SEBI LODR Regulations 2015 enforce structured board composition, whistleblower mechanisms, and mandatory forensic audit disclosures."
    },
    {
      terms: ["roe", "roce", "return on equity", "return on capital employed", "profitability"],
      concept: "Measures capital efficiency and organic return generated on shareholder net worth and total invested capital.",
      screenContext: "Forensic DuPont analysis decomposes ROE to confirm high returns stem from operational margins rather than hazardous financial leverage.",
      statutoryRule: "Sustainable long-term sovereign constituent firms maintain ROCE exceeding the cost of capital (WACC) across complete 5-year cycles."
    },
    {
      terms: ["corporate governance", "governance", "minority shareholder", "promoter control"],
      concept: "System of rules, practices, and checks by which public enterprises are directed, controlled, and held accountable.",
      screenContext: "Superior corporate governance commands higher institutional valuation premiums and defends minority investors against capital expropriation.",
      statutoryRule: "The Sovereign Index allocates a dominant 60% forensic weighting to corporate governance rigor to eliminate toxic promoter structures."
    }
  ];

  const TERM_ALIASES = {
    "ebitda": "EBITDA",
    "pe ratio": "Price–earnings_ratio",
    "p/e ratio": "Price–earnings_ratio",
    "pe": "Price–earnings_ratio",
    "p/e": "Price–earnings_ratio",
    "roe": "Return_on_equity",
    "roce": "Return_on_capital_employed",
    "sebi": "Securities_and_Exchange_Board_of_India",
    "bse": "BSE_(formerly_Bombay_Stock_Exchange)",
    "nse": "National_Stock_Exchange_of_India",
    "rbi": "Reserve_Bank_of_India",
    "gdp": "Gross_domestic_product",
    "hhi": "Herfindahl–Hirschman_index",
    "herfindahl": "Herfindahl–Hirschman_index",
    "free float": "Public_float",
    "public float": "Public_float",
    "working capital": "Working_capital",
    "operating cash flow": "Operating_cash_flow",
    "cfo": "Operating_cash_flow",
    "pat": "Net_income",
    "insider trading": "Insider_trading",
    "corporate governance": "Corporate_governance",
    "related party transaction": "Transfer_pricing",
    "rpt": "Transfer_pricing",
    "promoter": "Promoter_(business)",
    "pledge": "Pledge_(law)",
    "solvency": "Solvency",
    "liquidity": "Market_liquidity",
    "dividend yield": "Dividend_yield",
    "market cap": "Market_capitalization",
    "market capitalization": "Market_capitalization"
  };

  // Simple Levenshtein distance for typo tolerance
  function calcLevenshtein(a, b) {
    const al = a.length, bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    const m = [];
    for (let i = 0; i <= bl; i++) m[i] = [i];
    for (let j = 0; j <= al; j++) m[0][j] = j;
    for (let i = 1; i <= bl; i++) {
      for (let j = 1; j <= al; j++) {
        const cost = a.charAt(j - 1) === b.charAt(i - 1) ? 0 : 1;
        m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
      }
    }
    return m[bl][al];
  }

  // Pre-compiled built-in knowledge for common concepts and financial/science terms
  const BUILTIN_CONCEPT_EXPLANATIONS = {
    "gearsmith": {
      title: "Gearsmith (Horologist & Clockwork Artisan)",
      category: "craft",
      explanation: "A gearsmith is a precision mechanical artisan, horologist, and clockwork engineer specializing in designing, cutting, and assembling interlocking gear trains, pinions, balance wheels, and automated mechanical devices (as depicted in this scene on the workbench with calipers, watchmaker loupes, and sapphire lubricants).",
      takeaway: "Mechanical Craft: Combines metallurgy, horology (the science of mechanical timekeeping), and micro-mechanics to engineer self-actuating automata."
    },
    "hearmith": {
      title: "Gearsmith (Horologist & Clockwork Artisan)",
      category: "craft",
      explanation: "A gearsmith is a precision mechanical artisan, horologist, and clockwork engineer specializing in designing, cutting, and assembling interlocking gear trains, pinions, balance wheels, and automated mechanical devices (as depicted in this scene on the workbench with calipers, watchmaker loupes, and sapphire lubricants).",
      takeaway: "Mechanical Craft: Combines metallurgy, horology (the science of mechanical timekeeping), and micro-mechanics to engineer self-actuating automata."
    },
    "mainspring": {
      title: "Mainspring",
      category: "science",
      explanation: "A spiral spring of tempered spring steel or alloy that stores mechanical potential energy when wound, serving as the power source for mechanical watches and clockwork automata.",
      takeaway: "Power Source: Provides the driving torque for clockwork escapements and gear trains."
    },
    "gimbal": {
      title: "Gimbal Ring Suspension",
      category: "science",
      explanation: "A pivoted support that allows the rotation of an object (such as an hourglass or marine chronometer) about an axis, keeping it level and stable regardless of external motion.",
      takeaway: "Stability Engineering: Used in navigation and horology to isolate delicate timing instruments from external motion."
    },
    "dragonfly": {
      title: "Clockwork Dragonfly Automaton",
      category: "science",
      explanation: "A miniature mechanical automaton crafted from gossamer copper wings, micro-gear trains, and a winding pinion that converts stored mainspring tension into flapping kinetic flight.",
      takeaway: "Kinematic Automata: Micro-scale clockwork mechanism mimicking biological flight mechanics through miniature gear reductions."
    },
    "sapphire lubricant": {
      title: "Sapphire Lubricant & Synthetic Jewels",
      category: "science",
      explanation: "Sapphire lubricant and synthetic sapphire/ruby jewel bearings are used in high-grade mechanical watches and horology to minimize frictional wear at high-frequency pivot points and balance wheel arbors.",
      takeaway: "Horological Longevity: Reduces friction and ensures consistent amplitude in oscillating gear assemblies."
    },
    "leo": {
      title: "Leo and Pip (Explorers)",
      category: "narrative",
      explanation: "Leo and Pip are the central exploratory protagonists navigating the clockwork realm, leaping across balance wheel platforms and unlocking ancient mechanical devices with precision keys.",
      takeaway: "Protagonists: The narrative viewpoint characters experiencing the clockwork citadel."
    },
    "pip": {
      title: "Leo and Pip (Explorers)",
      category: "narrative",
      explanation: "Leo and Pip are the central exploratory protagonists navigating the clockwork realm, leaping across balance wheel platforms and unlocking ancient mechanical devices with precision keys.",
      takeaway: "Protagonists: The narrative viewpoint characters experiencing the clockwork citadel."
    },
    "balance wheel": {
      title: "Balance Wheel",
      category: "science",
      explanation: "A balance wheel is the weighted, oscillating timekeeping element in mechanical watches and clockwork. Driven by a hairspring and escapement, it rotates back and forth at a precise resonant tempo to divide time into equal increments.",
      takeaway: "Horological Principle: The rotational oscillation of a balance wheel regulates mechanical timing with high precision."
    },
    "caliper": {
      title: "Calipers",
      category: "science",
      explanation: "A caliper is a precision measuring tool with two adjustable jaws used by horologists and mechanical engineers to measure the exact internal, external, and step dimensions of mechanical parts down to fractions of a millimeter.",
      takeaway: "Metrological Tool: Essential in mechanical fabrication to ensure exact tooth-meshing tolerances between gears."
    },
    "watchmaker loupe": {
      title: "Watchmaker Loupe",
      category: "science",
      explanation: "A watchmaker loupe is a small, high-magnification monocular lens held close to the eye to inspect miniature gear teeth, hairsprings, pivot jewels, and intricate clockwork mechanisms.",
      takeaway: "Optical Inspection: Allows micrometric inspection of gear train tolerances and jewel bearings."
    },
    "hourglass": {
      title: "Hourglass",
      category: "science",
      explanation: "An hourglass is an ancient mechanical chronometer consisting of two glass bulbs connected vertically by a narrow neck, measuring a specific duration by the regulated gravity-flow of uniform sand or crystalline particles.",
      takeaway: "Physical Principle: Granular gravity discharge maintains a steady flow rate independent of the height of the column."
    },
    "clockwork": {
      title: "Clockwork Mechanism",
      category: "science",
      explanation: "Clockwork refers to a complex mechanical device driven by a wound mainspring or weights, regulated by an escapement and balance wheel to perform autonomous, repetitive, or calculated movements.",
      takeaway: "Kinematic Engineering: Translates potential spring energy into rotational torque through interlocking gear reductions."
    },
    "pinion": {
      title: "Winding Pinion",
      category: "science",
      explanation: "A pinion is a small, high-precision cylindrical gear with teeth designed to mesh with a larger gear wheel or crown, commonly used in clockwork key-winding and escapement gear ratios.",
      takeaway: "Mechanical Advantage: Pinions provide high gear ratio step-ups in compact mechanical spaces."
    },
    "rainbow": {
      title: "Rainbow",
      category: "science",
      explanation: "A rainbow is an optical phenomenon that produces a multicolored spectrum of light in the sky or through a refractive medium. It is formed when light enters water droplets or crystal pillars, undergoes refraction (bending), reflects internally off the inner surface, and refracts again upon exiting, dispersing white light into its constituent wavelengths: red, orange, yellow, green, blue, indigo, and violet.",
      takeaway: "Optical Principle: Prismatic refraction splits polychromatic light based on differing refractive indices for each wavelength."
    },
    "stardust": {
      title: "Stardust",
      category: "science",
      explanation: "Stardust refers to microscopic cosmic dust and celestial particles formed from cooling matter expelled by dying stars, novae, and supernovae before coalescing into planetary systems and interstellar clouds. In literature and myth, it symbolizes enchanted or celestial essence.",
      takeaway: "Astrophysical Origin: All heavy elements in planets and matter were originally forged inside stars and dispersed across space as stardust."
    },
    "refraction": {
      title: "Refraction",
      category: "science",
      explanation: "Refraction is the bending of a wave (such as light or sound) when it passes obliquely from one transparent medium into another of different optical density, caused by a change in its propagation speed.",
      takeaway: "Physical Law: Governed by Snell's Law of refraction (n₁ sin θ₁ = n₂ sin θ₂)."
    },
    "ebitda": {
      title: "EBITDA",
      category: "finance",
      explanation: "Earnings Before Interest, Taxes, Depreciation, and Amortization (EBITDA) is a metric used to evaluate a company's operational profitability by stripping away non-operating decisions, debt financing costs, statutory taxes, and non-cash asset depreciation.",
      takeaway: "Forensic Benchmark: EBITDA is an unadjusted non-GAAP measure. Forensic diligence requires reconciling EBITDA to Operating Cash Flows (OCF) under Ind AS."
    },
    "cap table": {
      title: "Capitalization Table",
      category: "finance",
      explanation: "A capitalization table (cap table) details the equity ownership percentages, share classes, dilution rounds, warrants, and valuation stakes of founders, employees, and institutional investors in a corporation.",
      takeaway: "Statutory Rule: Audited under Section 62 and Section 42 of the Companies Act, 2013, to prevent unapproved dilution."
    },
    "promoter pledging": {
      title: "Promoter Pledging",
      category: "finance",
      explanation: "Promoter pledging occurs when controlling promoters borrow funds from financial institutions or NBFCs by placing their corporate equity shares as collateral. High pledge levels create significant systemic risk of forced margin liquidation during market downturns.",
      takeaway: "Statutory Mandate: Regulated under SEBI (SAST) Regulations, Regulation 31. Any pledge exceeding 20% of share capital triggers mandatory forensic disclosure."
    },
    "related party": {
      title: "Related Party Transactions (RPT)",
      category: "finance",
      explanation: "Transactions conducted between a corporate entity and its affiliated subsidiaries, key managerial personnel, promoters, or related business vehicles. In corporate forensics, RPTs are audited to prevent profit siphoning and off-market asset transfers.",
      takeaway: "Statutory Standard: Audited under Section 188 of the Companies Act, 2013, and SEBI LODR Regulation 23, requiring prior approval from independent audit committees."
    },
    "auditor resignation": {
      title: "Auditor Resignation",
      category: "finance",
      explanation: "Mid-term resignation of statutory auditors is a major forensic warning signal indicating disagreements over accounting treatments, failure by management to provide books, or concerns regarding going-concern viability.",
      takeaway: "Statutory Mandate: SEBI Circular CIR/CFD/CMD1/114/2019 requires resigning auditors to provide explicit disclosure of reasons within 24 hours."
    },
    "ibc": {
      title: "Insolvency and Bankruptcy Code (IBC)",
      category: "finance",
      explanation: "The Insolvency and Bankruptcy Code (IBC, 2016) is India's statutory framework for resolving corporate insolvency and distressed liquidation in a time-bound manner through the National Company Law Tribunal (NCLT).",
      takeaway: "Statutory Mechanism: Section 7 & Section 9 govern default triggers (minimum INR 1 crore default threshold)."
    }
  };

  // Comprehensive Linguistic Lexicon (Antonyms, Synonyms, Definitions for Word Queries)
  const LINGUISTIC_LEXICON = {
    whisper: {
      term: "Whisper",
      definition: "To speak very softly using one's breath without vibrating the vocal cords, producing a quiet, rustling sound.",
      synonyms: ["murmur", "mumble", "breathe", "hush", "susurrate", "rustle", "undertone", "sigh"],
      antonyms: ["shout", "scream", "yell", "roar", "bellow", "howl", "clamor", "shriek", "cry out", "boom"],
      explanation: "The primary opposite words (antonyms) for \"whisper\" are shout, scream, yell, roar, bellow, howl, clamor, shriek, and cry out. While a whisper minimizes acoustic volume to near inaudibility, its opposites represent high-volume, resonant vocal emissions."
    },
    prologue: {
      term: "Prologue",
      definition: "An introductory section, preface, or scene that establishes the background, lore, and opening context of a literary or theatrical narrative.",
      synonyms: ["prelude", "preface", "foreword", "introduction", "preamble", "proem", "overture", "front matter"],
      antonyms: ["epilogue", "afterword", "postscript", "conclusion", "coda", "finale"],
      explanation: "Common synonyms for \"prologue\" include prelude, preface, foreword, introduction, preamble, proem, and overture. Its direct structural counterpart and opposite is the epilogue (or afterword)."
    },
    epilogue: {
      term: "Epilogue",
      definition: "A concluding chapter or section at the end of a work that rounds out the narrative or reveals the final fates of characters.",
      synonyms: ["afterword", "coda", "postscript", "conclusion", "postlude", "finale"],
      antonyms: ["prologue", "preface", "introduction", "prelude", "foreword"],
      explanation: "Synonyms for \"epilogue\" include afterword, coda, postscript, conclusion, and finale. Its direct opposite is the prologue."
    },
    loose: {
      term: "Loose",
      definition: "Not firmly or tightly fixed, bound, or held in place; slack or unfastened.",
      synonyms: ["slack", "unfastened", "detached", "movable", "unsecured", "wobbly"],
      antonyms: ["tight", "firm", "secure", "fastened", "rigid", "fixed"],
      explanation: "Direct opposites for \"loose\" are tight, firm, secure, fastened, fixed, and rigid."
    },
    silent: {
      term: "Silent",
      definition: "Making or accompanied by no sound; completely quiet or hushed.",
      synonyms: ["quiet", "hushed", "soundless", "still", "mute", "inaudible"],
      antonyms: ["loud", "noisy", "resonant", "boisterous", "clamorous", "deafening"],
      explanation: "Direct opposites for \"silent\" are loud, noisy, resonant, clamorous, boisterous, and deafening."
    },
    ancient: {
      term: "Ancient",
      definition: "Belonging to the very distant past and no longer in existence; of great age.",
      synonyms: ["antique", "archaic", "primordial", "venerable", "timeworn", "age-old"],
      antonyms: ["modern", "contemporary", "novel", "current", "new", "recent"],
      explanation: "Direct opposites for \"ancient\" are modern, contemporary, recent, novel, and new."
    },
    dark: {
      term: "Dark",
      definition: "With little or no light.",
      synonyms: ["dim", "shadowy", "gloomy", "murky", "obscure", "somber"],
      antonyms: ["bright", "light", "luminous", "radiant", "illuminated", "brilliant"],
      explanation: "Direct opposites for \"dark\" are bright, light, luminous, radiant, and illuminated."
    },
    clockwork: {
      term: "Clockwork",
      definition: "A mechanism with a spring and toothed gear wheels, similar to that of a mechanical clock; operating with smooth mechanical regularity.",
      synonyms: ["mechanism", "gearwork", "horology", "automaton", "escapement", "precision mechanics"],
      antonyms: ["manual", "electronic", "digital", "irregular", "erratic", "chaotic"],
      explanation: "Related mechanical terms include gearwork, horology, escapement, and automata. Opposites include electronic, digital, or irregular mechanisms."
    },
    sentinel: {
      term: "Sentinel",
      definition: "A guard or watchman whose job is to stand and keep watch.",
      synonyms: ["guard", "watchman", "protector", "lookout", "warden", "guardian"],
      antonyms: ["infiltrator", "attacker", "intruder", "assailant"],
      explanation: "Synonyms for \"sentinel\" include guard, watchman, lookout, warden, and guardian."
    },
    constellation: {
      term: "Constellation",
      definition: "A recognizable group of stars traditionally named after its perceived form.",
      synonyms: ["asterism", "star pattern", "stellar cluster", "galaxy"],
      antonyms: ["void", "nebula"],
      explanation: "A recognizable celestial star pattern (e.g., Ursa Minor, Ursa Major, Cassiopeia)."
    },
    compass: {
      term: "Compass",
      definition: "A navigational instrument containing a magnetized pointer that indicates the direction of magnetic north.",
      synonyms: ["navigator", "magnetic indicator", "azimuth gauge", "direction finder"],
      antonyms: ["disorientation", "wanderer"],
      explanation: "A navigation instrument that aligns with geomagnetic field lines to establish celestial bearings."
    }
  };

  function detectLinguisticQuery(rawQuery) {
    if (!rawQuery) return null;
    const clean = rawQuery.replace(/[?.,!;:"'()]/g, " ").trim().toLowerCase();
    const isAntonym = /\b(opposite|opposites|antonym|antonyms|contrary|reverse)\b/i.test(clean);
    const isSynonym = /\b(synonym|synonyms|similar\s+words?|other\s+words?)\b/i.test(clean);
    const isDefinition = /\b(meaning|definition|what\s+is|define)\b/i.test(clean) && !isAntonym && !isSynonym;

    if (!isAntonym && !isSynonym && !isDefinition) return null;

    const stopWords = new Set([
      "what", "is", "are", "the", "of", "for", "words", "word", "in", "a", "an", "tell",
      "me", "some", "give", "opposite", "opposites", "antonym", "antonyms", "contrary",
      "synonym", "synonyms", "similar", "meaning", "definition", "define", "game", "weirdo", "answer"
    ]);

    const tokens = clean.split(/\s+/).filter((w) => w.length > 1 && !stopWords.has(w));
    if (tokens.length === 0) return null;

    let target = tokens[0];
    if (target.endsWith("s") && LINGUISTIC_LEXICON[target.slice(0, -1)]) {
      target = target.slice(0, -1);
    } else if (target === "prolouge") {
      target = "prologue";
    }

    return {
      type: isAntonym ? "antonym" : (isSynonym ? "synonym" : "definition"),
      targetWord: target,
      rawTokens: tokens
    };
  }

  async function resolveLinguisticAnswer(query, linguisticInfo) {
    const { type, targetWord } = linguisticInfo;
    const upperWord = targetWord.charAt(0).toUpperCase() + targetWord.slice(1);

    // 1. Built-in Lexicon lookup (0ms)
    const lex = LINGUISTIC_LEXICON[targetWord];
    if (lex) {
      if (type === "antonym") {
        return `
          <div class="doubt-plain-answer">
            <div class="doubt-plain-text font-serif">
              <strong>${escapeHtml(lex.term)} (Antonyms & Opposite Words):</strong> ${escapeHtml(lex.explanation)}
            </div>
          </div>
        `;
      } else if (type === "synonym") {
        return `
          <div class="doubt-plain-answer">
            <div class="doubt-plain-text font-serif">
              <strong>${escapeHtml(lex.term)} (Synonyms):</strong> Common synonyms for "${escapeHtml(lex.term.toLowerCase())}" include: ${escapeHtml(lex.synonyms.join(", "))}. ${escapeHtml(lex.definition)}
            </div>
          </div>
        `;
      } else {
        return `
          <div class="doubt-plain-answer">
            <div class="doubt-plain-text font-serif">
              <strong>${escapeHtml(lex.term)} (Definition):</strong> ${escapeHtml(lex.definition)} Related synonyms: ${escapeHtml(lex.synonyms.slice(0, 5).join(", "))}.
            </div>
          </div>
        `;
      }
    }

    // 2. Public Datamuse Linguistic API lookup (CORS-enabled)
    try {
      const rel = type === "antonym" ? "ant" : "syn";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1600);
      const res = await fetch(`https://api.datamuse.com/words?rel_${rel}=${encodeURIComponent(targetWord)}&max=8`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const wordsData = await res.json();
        const words = (wordsData || []).map((w) => w.word).filter(Boolean);
        if (words.length > 0) {
          const typeLabel = type === "antonym" ? "Antonyms & Opposite Words" : "Synonyms";
          return `
            <div class="doubt-plain-answer">
              <div class="doubt-plain-text font-serif">
                <strong>${escapeHtml(upperWord)} (${typeLabel}):</strong> Common ${type === "antonym" ? "opposite words" : "synonyms"} for "${escapeHtml(targetWord)}" include: <strong>${escapeHtml(words.join(", "))}</strong>.
              </div>
            </div>
          `;
        }
      }
    } catch (_) {}

    return null;
  }

  async function fetchDuckDuckGoInstantAnswer(term) {
    if (!term || term.length < 2) return null;
    const cleanTerm = term.trim();

    // 1. DuckDuckGo Instant Answer API (Free, CORS enabled)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1600);
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanTerm)}&format=json&no_html=1`;
      const res = await fetch(ddgUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const abstract = data.AbstractText || data.Abstract || data.Definition || data.Answer || "";
        if (abstract && abstract.length > 25) {
          return {
            source: "DuckDuckGo Instant Answer",
            title: data.Heading || cleanTerm,
            text: abstract
          };
        }
        const topics = data.RelatedTopics || [];
        if (topics.length > 0 && topics[0].Text && topics[0].Text.length > 25) {
          return {
            source: "DuckDuckGo Knowledge",
            title: data.Heading || cleanTerm,
            text: topics[0].Text
          };
        }
      }
    } catch (_) {}

    // 2. Wikipedia Summary API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1600);
      const wikiCap = cleanTerm.charAt(0).toUpperCase() + cleanTerm.slice(1);
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiCap.replace(/\s+/g, "_"))}`;
      const res = await fetch(wikiUrl, { headers: { "Accept": "application/json" }, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.extract && data.extract.length > 25) {
          return {
            source: "Wikipedia via DuckDuckGo",
            title: data.title || cleanTerm,
            text: data.extract
          };
        }
      }
    } catch (_) {}

    // 3. Wikipedia Search API as final fallback (with false-positive filter)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1600);
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTerm)}&format=json&origin=*`;
      const res = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const searchRes = data?.query?.search || [];
        if (searchRes.length > 0 && searchRes[0].snippet) {
          const cleanSnippet = searchRes[0].snippet.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
          const sLower = cleanSnippet.toLowerCase();
          const isActorBioSnippet =
            sLower.includes("drama pilot") ||
            sLower.includes("cast opposite") ||
            sLower.includes("starred opposite") ||
            sLower.includes("announced that") ||
            sLower.includes("left the whispers") ||
            (sLower.includes("television series") && cleanTerm.toLowerCase().includes("opposite"));

          if (!isActorBioSnippet) {
            return {
              source: "Wikipedia Search",
              title: searchRes[0].title || cleanTerm,
              text: cleanSnippet
            };
          }
        }
      }
    } catch (_) {}

    return null;
  }

  function extractCoreSubject(query, title, text) {
    if (!query) return { term: "concept", isTyposCorrected: false };
    const clean = query.replace(/[?.,!;:"'()]/g, " ").trim();
    const rawWords = clean.split(/\s+/).filter(w => {
      const l = w.toLowerCase();
      return l.length >= 2 && ![
        "what", "why", "how", "when", "where", "which", "is", "are", "was", "were",
        "does", "did", "do", "the", "a", "an", "and", "in", "on", "of", "to", "for",
        "called", "formed", "mean", "meaning", "it", "tell", "me", "about", "explain",
        "define", "can", "you", "who", "whom", "profession", "occupation", "job", "role",
        "career", "work"
      ].includes(l);
    });

    const screenTextCombined = ((title || "") + " " + (text || "")).toLowerCase();
    const screenWords = Array.from(new Set(screenTextCombined.match(/[a-zA-Z]{3,}/g) || []));

    let detectedTerm = "";
    let isTyposCorrected = false;

    for (const w of rawWords) {
      const wLower = w.toLowerCase();
      if (screenWords.includes(wLower)) {
        detectedTerm = wLower;
        break;
      }
      for (const sw of screenWords) {
        if (sw.length >= 4 && calcLevenshtein(wLower, sw) <= 2) {
          detectedTerm = sw;
          isTyposCorrected = true;
          break;
        }
      }
      if (detectedTerm) break;
    }

    if (!detectedTerm && rawWords.length > 0) {
      detectedTerm = rawWords.slice(0, 2).join(" ").toLowerCase();
    }

    return {
      term: detectedTerm || clean.toLowerCase(),
      isTyposCorrected: isTyposCorrected
    };
  }

  function synthesizeConceptAnswer(query, context, remoteData) {
    const rawText = context ? (context.text || "") : "";
    const title = context ? (context.title || "Visible Content") : "Visible Content";
    const cleanQuery = (query || "").trim();
    const subjectInfo = extractCoreSubject(cleanQuery, title, rawText);
    const term = subjectInfo.term;

    // Check built-in explanations first
    let matchedBuiltin = null;
    for (const [key, val] of Object.entries(BUILTIN_CONCEPT_EXPLANATIONS)) {
      if (term.includes(key) || key.includes(term) || cleanQuery.toLowerCase().includes(key)) {
        matchedBuiltin = val;
        break;
      }
    }

    // Check forensic knowledge base only for non-narrative screens or explicit financial terms
    let matchedForensic = null;
    let highestForensicScore = 0;
    const queryLower = cleanQuery.toLowerCase();
    const isNarrativeSection = title.includes("SCENE") || title.includes("04.") || title.includes("05.") || title.includes("ACT") || rawText.includes("Leo and Pip") || rawText.includes("clockwork") || rawText.includes("balance wheel");

    if (!isNarrativeSection) {
      for (const item of FORENSIC_KNOWLEDGE_BASE) {
        let score = 0;
        for (const t of item.terms) {
          if (queryLower.includes(t)) score += 8;
          if (term.includes(t)) score += 6;
        }
        if (score > highestForensicScore && score >= 6) {
          highestForensicScore = score;
          matchedForensic = item;
        }
      }
    }

    // Extract best sentence from visible screen
    const sentences = rawText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 12);
    let bestSentence = "";
    if (sentences.length > 0) {
      let bestSentScore = 0;
      bestSentence = sentences[0];
      for (const s of sentences) {
        const sLower = s.toLowerCase();
        let sScore = 0;
        if (term && sLower.includes(term)) sScore += 5;
        for (const w of queryLower.split(/\s+/).filter(w => w.length > 2)) {
          if (sLower.includes(w)) sScore += 2;
        }
        if (sScore > bestSentScore) {
          bestSentScore = sScore;
          bestSentence = s;
        }
      }
    }

    // Check if query is about a profession / craft / artisan or ends in -smith
    const isCraftOrProfession = term.endsWith("smith") || queryLower.includes("smith") || queryLower.includes("profession") || queryLower.includes("occupation") || queryLower.includes("artisan") || queryLower.includes("craftsman") || queryLower.includes("horolog") || queryLower.includes("maker");

    let conceptTitle = matchedBuiltin ? matchedBuiltin.title : (remoteData ? remoteData.title : (term ? term.toUpperCase() : "CONCEPT EXPLANATION"));
    let conceptBody = "";
    let takeawayText = "";

    if (matchedBuiltin) {
      conceptBody = matchedBuiltin.explanation;
      takeawayText = matchedBuiltin.takeaway;
    } else if (remoteData && remoteData.text) {
      conceptBody = remoteData.text;
      takeawayText = `Source verified via ${remoteData.source}.`;
    } else if (isCraftOrProfession) {
      const baseNoun = term.replace(/smith$/, "");
      const professionName = baseNoun ? `${baseNoun.charAt(0).toUpperCase() + baseNoun.slice(1)}smith` : "Horological Artisan";
      conceptTitle = `${professionName} (Horologist & Precision Artisan)`;
      conceptBody = `A ${term || "artisan"} is a specialized mechanical maker and craftsman who designs, fabricates, cuts, and regulates precision clockwork, gear trains, automata, and horological instruments using micro-tools such as calipers, loupes, and precision lubricants.`;
      takeawayText = `Craft & Horology: Combines kinetic mechanics, metallurgy, and micro-engineering to construct self-actuating gearwork.`;
    } else if (matchedForensic) {
      conceptBody = matchedForensic.concept;
      takeawayText = `Regulatory Benchmark: ${matchedForensic.statutoryRule}`;
    } else if (bestSentence) {
      conceptBody = `In this section: ${bestSentence}`;
      takeawayText = `Contextual explanation derived from active viewport content under "${title}".`;
    } else {
      conceptBody = `Detailed analysis and definition for "${escapeHtml(cleanQuery)}".`;
      takeawayText = `Search live DuckDuckGo index below for full details.`;
    }

    return `
      <div class="doubt-plain-answer">
        <div class="doubt-plain-text font-serif">
          ${conceptTitle ? `<strong>${escapeHtml(conceptTitle)}:</strong> ` : ""}${escapeHtml(conceptBody)}
        </div>
      </div>
    `;
  }

  async function resolveDoubtAnswer(query, context) {
    // 0. High-priority Linguistic Solver for antonyms, opposites, synonyms, word meanings
    const linguisticInfo = detectLinguisticQuery(query);
    if (linguisticInfo) {
      const linguisticAns = await resolveLinguisticAnswer(query, linguisticInfo);
      if (linguisticAns) return linguisticAns;
    }

    const rawText = context ? (context.text || "") : "";
    const title = context ? (context.title || "Visible Content") : "Visible Content";
    const subjectInfo = extractCoreSubject(query, title, rawText);
    const term = subjectInfo.term;

    // Fast check built-in knowledge first (0ms latency)
    for (const [key, val] of Object.entries(BUILTIN_CONCEPT_EXPLANATIONS)) {
      if (term.includes(key) || key.includes(term) || query.toLowerCase().includes(key)) {
        return synthesizeConceptAnswer(query, context, {
          source: "DuckDuckGo Built-in Knowledge",
          title: val.title,
          text: val.explanation
        });
      }
    }

    // Attempt online fetch from DuckDuckGo Instant Answer / Wikipedia
    try {
      const remote = await fetchDuckDuckGoInstantAnswer(term);
      if (remote) {
        return synthesizeConceptAnswer(query, context, remote);
      }
    } catch (_) {}

    // Fallback synthesis
    return synthesizeConceptAnswer(query, context, null);
  }

  const DOUBTS_STORAGE_KEY = "indexindia_doubts_history_v1";

  function getLocalDoubtsHistory() {
    try {
      const raw = localStorage.getItem(DOUBTS_STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      let healed = false;
      for (const item of items) {
        if (item.answerHtml && (
          item.answerHtml.includes("Brianna Brown") ||
          item.answerHtml.includes("drama pilot") ||
          item.answerHtml.includes("Lily Rabe") ||
          item.answerHtml.includes("The Whispers opposite") ||
          item.answerHtml.includes("Evaluated under sovereign corporate governance") ||
          item.answerHtml.includes("financial forensic standards") ||
          item.answerHtml.includes("Governed by statutory SEBI regulations") ||
          item.answerHtml.includes("Visible Reference:") ||
          item.answerHtml.includes("LIVE SCREEN ANALYSIS") ||
          item.answerHtml.includes("doubt-output-section") ||
          item.answerHtml.includes("doubt-ddg-bar") ||
          item.answerHtml.includes("doubt-plain-takeaway") ||
          item.answerHtml.includes("TAKEAWAY:") ||
          item.answerHtml.includes("DUCKDUCKGO ENGINE:") ||
          item.answerHtml.includes("doubt-output-takeaway") ||
          item.answerHtml.includes("Ask DuckDuckGo AI") ||
          item.answerHtml.includes("Web Search")
        )) {
          const ling = detectLinguisticQuery(item.question);
          if (ling && LINGUISTIC_LEXICON[ling.targetWord]) {
            const lex = LINGUISTIC_LEXICON[ling.targetWord];
            const isAnt = ling.type === "antonym";
            item.answerHtml = `
              <div class="doubt-plain-answer">
                <div class="doubt-plain-text font-serif">
                  <strong>${lex.term} (${isAnt ? "Antonyms & Opposite Words" : "Synonyms"}):</strong> ${isAnt ? lex.explanation : ("Common synonyms: " + lex.synonyms.join(", ") + ". " + lex.definition)}
                </div>
              </div>
            `;
          } else {
            item.answerHtml = synthesizeConceptAnswer(item.question, getVisibleScreenTarget(), null);
          }
          healed = true;
        }
      }
      if (healed) {
        saveLocalDoubtsHistory(items);
      }
      return items;
    } catch (e) {
      console.warn("[DoubtSolver] Local storage read error:", e);
      return [];
    }
  }

  function saveLocalDoubtsHistory(items) {
    try {
      localStorage.setItem(DOUBTS_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("[DoubtSolver] Local storage write error:", e);
    }
  }

  function clearLocalDoubtsHistory() {
    try {
      localStorage.removeItem(DOUBTS_STORAGE_KEY);
    } catch (e) {
      console.warn("[DoubtSolver] Local storage clear error:", e);
    }
  }

  function getExactTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const dd = pad(now.getDate());
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mmm = months[now.getMonth()];
    const yyyy = now.getFullYear();
    return {
      time: `${hh}:${mm}:${ss}`,
      date: `${dd} ${mmm} ${yyyy}`,
      full: `${hh}:${mm}:${ss} · ${dd} ${mmm} ${yyyy}`
    };
  }

  let currentDoubtContext = null;
  let activeDoubtMode = "doubts";
  let activeQueryId = 0;

  // Create UI elements
  const doubtPill = document.createElement("div");
  doubtPill.className = "doubt-selection-pill";
  doubtPill.id = "doubt-selection-pill";
  doubtPill.title = "Ask DuckDuckGo Doubt Solver (Shortcut: M)";
  doubtPill.innerHTML = `
    <span class="doubt-pill-spark">🦆</span>
    <span>Explain</span>
    <span class="doubt-pill-key">M</span>
  `;
  document.body.appendChild(doubtPill);

  const doubtTile = document.createElement("aside");
  doubtTile.className = "doubt-solver-tile";
  doubtTile.id = "doubt-solver-tile";
  doubtTile.setAttribute("role", "dialog");
  doubtTile.setAttribute("aria-label", "DuckDuckGo AI Doubt Solver");
  doubtTile.innerHTML = `
    <div class="doubt-tile-header">
      <div class="doubt-tile-brand">
        <span class="doubt-tile-brand-icon">🦆</span>
        <span>DUCKDUCKGO DOUBT SOLVER</span>
      </div>
      <div class="doubt-tile-controls">
        <button type="button" class="doubt-tile-close" id="doubt-tile-close" title="Close (Esc)">&times;</button>
      </div>
    </div>
    <div class="doubt-tile-body">
      <div class="doubt-input-row">
        <input type="text" id="doubt-text-input" class="doubt-text-input" placeholder="Ask a doubt or press Enter..." autocomplete="off">
        <button type="button" id="doubt-ask-btn" class="doubt-ask-btn">Ask DDG ↵</button>
      </div>
      <div class="doubt-chips-container" id="doubt-chips-container">
        <button type="button" class="doubt-chip-btn active" data-mode="doubts" id="chip-mode-doubts">💬 Doubts</button>
        <button type="button" class="doubt-chip-btn" data-mode="keytakeaway" id="chip-mode-takeaway">📊 Key Takeaway</button>
      </div>
      <div class="doubt-output-container" id="doubt-output-container"></div>
    </div>
  `;
  document.body.appendChild(doubtTile);

  const doubtCloseBtn = doubtTile.querySelector("#doubt-tile-close");
  const doubtTextInput = doubtTile.querySelector("#doubt-text-input");
  const doubtAskBtn = doubtTile.querySelector("#doubt-ask-btn");
  const doubtChips = doubtTile.querySelectorAll(".doubt-chip-btn");
  const doubtOutput = doubtTile.querySelector("#doubt-output-container");

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function getVisibleScreenTarget() {
    try {
      // 1. Text Selection has highest priority if user highlighted anything
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : "";
      if (selectedText.length >= 2) {
        let parentHeading = "";
        try {
          const anchorEl = selection.anchorNode?.nodeType === 1 ? selection.anchorNode : selection.anchorNode?.parentElement;
          const container = anchorEl?.closest("section, article, .story-node-section, .page-directory-section, .content-area > div");
          parentHeading = container?.querySelector(".story-section-title, h1, h2, h3, h4, .institutional-title")?.textContent?.trim() || "";
        } catch (_) {}

        return {
          type: "selection",
          title: parentHeading ? `Selection in: ${parentHeading.replace(/^[^\w\s\u00C0-\u017F]+/, "").trim()}` : "Selected Text",
          text: selectedText,
          excerpt: selectedText.length > 180 ? selectedText.slice(0, 180) + "..." : selectedText
        };
      }

      // 2. Real Viewport Reading Geometry
      const vpHeight = window.innerHeight || document.documentElement.clientHeight || 800;
      // Focus reading eye-level: between 12% and 78% down screen
      const focusTop = vpHeight * 0.12;
      const focusBottom = vpHeight * 0.78;
      const eyeLine = vpHeight * 0.38;

      // Collect candidate sections
      const candidates = Array.from(document.querySelectorAll(
        "section[id], .story-node-section, .page-directory-section, .story-section, .institutional-forum-section, .content-area > section"
      )).filter(el => {
        if (el.closest(".doubt-solver-tile") || el.closest(".top-nav") || el.closest(".rail-navigator")) return false;
        const rect = el.getBoundingClientRect();
        return rect.height > 20 && rect.bottom > 80 && rect.top < vpHeight - 40;
      });

      let bestSection = null;
      let maxScore = -99999;

      for (const el of candidates) {
        const rect = el.getBoundingClientRect();
        const visibleTop = Math.max(focusTop, rect.top);
        const visibleBottom = Math.min(focusBottom, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        if (visibleHeight > 0) {
          // Eye line inclusion bonus: if eyeLine is directly inside this section
          const spansEyeLine = (rect.top <= eyeLine && rect.bottom >= eyeLine) ? 400 : 0;
          const center = rect.top + (rect.height / 2);
          const distToEyeLine = Math.abs(center - eyeLine);
          const score = visibleHeight + spansEyeLine - (distToEyeLine * 0.25);
          if (score > maxScore) {
            maxScore = score;
            bestSection = el;
          }
        }
      }

      // Check in-page tree navigation sync if scrollspy active
      if (!bestSection && typeof treeNodes !== "undefined" && treeNodes && treeNodes[currentSubIndex]) {
        const href = treeNodes[currentSubIndex].getAttribute("href") || "";
        if (href.startsWith("#") && href.length > 1) {
          try {
            const el = document.querySelector(href);
            if (el) bestSection = el;
          } catch (_) {}
        }
      }

      if (!bestSection && candidates.length > 0) {
        bestSection = candidates[0];
      }

      // 3. Extract EXACT visible text currently inside the viewport
      let visibleTextBlocks = [];
      const searchContainers = bestSection ? [bestSection, document.querySelector(".content-area") || document.body] : [document.querySelector(".content-area") || document.body];

      for (const container of searchContainers) {
        if (!container) continue;
        const readableNodes = Array.from(container.querySelectorAll(
          ".story-narrative-lead, p, li, td, th, .story-tag, .font-mono, .stat-val, .data-metric"
        ));

        for (const node of readableNodes) {
          if (node.closest(".doubt-solver-tile") || node.closest(".top-nav") || node.closest(".rail-navigator") || node.closest("#tree-content-scroll")) continue;
          const r = node.getBoundingClientRect();
          if (r.bottom >= 70 && r.top <= vpHeight - 50 && r.height > 0) {
            const txt = node.textContent.trim().replace(/\s+/g, " ");
            if (txt.length > 5 && !visibleTextBlocks.includes(txt) && !txt.includes("DOUBT SOLVER")) {
              visibleTextBlocks.push(txt);
            }
          }
        }
        if (visibleTextBlocks.length > 0 && container === bestSection) break;
      }

      // Fallback if no sub-elements captured
      if (visibleTextBlocks.length === 0 && bestSection) {
        const raw = bestSection.textContent.replace(/\s+/g, " ").trim();
        if (raw.length > 10) visibleTextBlocks.push(raw.slice(0, 450));
      }

      // Find section heading / title
      let title = "";
      if (bestSection) {
        const heading = bestSection.querySelector(".story-section-title, h1, h2, h3, h4, .institutional-title");
        if (heading) {
          title = heading.textContent.trim();
        } else if (bestSection.id) {
          title = bestSection.id.replace(/^sec-/, "").replace(/-/g, " ").toUpperCase();
        }
      }

      if (!title) {
        const topHeading = Array.from(document.querySelectorAll("h1, h2, h3, .story-section-title, .institutional-title"))
          .filter(h => !h.closest(".doubt-solver-tile") && !h.closest(".top-nav"))
          .find(h => {
            const r = h.getBoundingClientRect();
            return r.bottom >= 0 && r.top <= vpHeight * 0.7;
          });
        title = topHeading ? topHeading.textContent.trim() : document.title.split("—")[0].trim();
      }

      const cleanTitle = title.replace(/^[^\w\s\u00C0-\u017F]+/, "").trim() || "Visible Screen";
      const cleanText = visibleTextBlocks.length > 0 ? visibleTextBlocks.join(" ") : "Visible screen content.";
      const excerpt = visibleTextBlocks[0] || cleanText.slice(0, 160);

      return {
        type: "section",
        title: cleanTitle,
        text: cleanText,
        excerpt: excerpt.length > 180 ? excerpt.slice(0, 180) + "..." : excerpt
      };
    } catch (err) {
      console.warn("[DoubtSolver] getVisibleScreenTarget error:", err);
      return {
        type: "section",
        title: document.title.split("—")[0].trim() || "Visible Screen",
        text: "Visible content on screen.",
        excerpt: "Visible content on screen."
      };
    }
  }

  function handleTextSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      doubtPill.classList.remove("is-visible");
      return;
    }
    const text = selection.toString().trim();
    if (text.length < 3) {
      doubtPill.classList.remove("is-visible");
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      doubtPill.classList.remove("is-visible");
      return;
    }

    const commonAncestor = range.commonAncestorContainer;
    const parentEl = commonAncestor.nodeType === 1 ? commonAncestor : commonAncestor.parentElement;
    if (parentEl && (parentEl.closest(".doubt-solver-tile") || parentEl.closest(".top-nav"))) {
      doubtPill.classList.remove("is-visible");
      return;
    }

    let top = window.scrollY + rect.top - 38;
    if (top < window.scrollY + 10) {
      top = window.scrollY + rect.bottom + 8;
    }
    const left = window.scrollX + Math.max(12, rect.left + (rect.width / 2) - 45);

    doubtPill.style.top = `${top}px`;
    doubtPill.style.left = `${left}px`;
    doubtPill.classList.add("is-visible");
  }

  document.addEventListener("mouseup", () => {
    setTimeout(handleTextSelection, 30);
  });
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      doubtPill.classList.remove("is-visible");
    }
  });

  doubtPill.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  doubtPill.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : "";
    openDoubtSolver();
    if (selectedText.length >= 2) {
      if (doubtTextInput) doubtTextInput.value = selectedText;
      askDoubt(selectedText);
    }
  });

  const doubtNavBtn = document.getElementById("doubt-nav-btn");
  if (doubtNavBtn) {
    doubtNavBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleDoubtSolver();
    });
  }

  function renderDoubtsView() {
    const history = getLocalDoubtsHistory();
    const currentTarget = currentDoubtContext || getVisibleScreenTarget();
    const title = currentTarget.title || "Visible Screen";
    const excerpt = currentTarget.excerpt || (currentTarget.text ? currentTarget.text.slice(0, 140) + "..." : "Reading visible page content.");

    if (!history || history.length === 0) {
      doubtOutput.innerHTML = `
        <div class="doubt-blank-page">
          <div class="doubt-blank-icon">🦆</div>
          <div class="doubt-blank-title">Doubts History</div>
          <p class="doubt-blank-sub">Ask any doubt in the box above and press Enter. Questions, plain English answers, and exact timestamps are stored strictly on your device.</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="doubt-history-actions-bar">
        <span class="doubt-history-count font-mono">${history.length} DOUBT${history.length > 1 ? "S" : ""} RECORDED ON THIS DEVICE</span>
        <button type="button" class="doubt-clear-all-btn font-mono" id="doubt-clear-all-btn" title="Clear all doubts history on this device">Clear History</button>
      </div>
      <div class="doubt-history-list">
    `;

    for (const item of history) {
      html += `
        <div class="doubt-history-card" data-id="${item.id}">
          <div class="doubt-history-meta">
            <div class="doubt-history-time font-mono">
              <span class="doubt-time-clock">🕒</span>
              <span>${escapeHtml(item.exactTimestamp)}</span>
            </div>
            <button type="button" class="doubt-item-del-btn" title="Delete this entry" data-id="${item.id}">&times;</button>
          </div>
          <div class="doubt-history-q">
            <span class="doubt-q-badge font-mono">DOUBT:</span>
            <span class="doubt-q-text">${escapeHtml(item.question)}</span>
          </div>
          <div class="doubt-history-a">
            ${item.answerHtml}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    doubtOutput.innerHTML = html;

    const clearBtn = doubtOutput.querySelector("#doubt-clear-all-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (confirm("Clear all doubts history stored on this device?")) {
          clearLocalDoubtsHistory();
          renderDoubtsView();
        }
      });
    }

    doubtOutput.querySelectorAll(".doubt-item-del-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const curr = getLocalDoubtsHistory();
        const filtered = curr.filter(x => x.id !== id);
        saveLocalDoubtsHistory(filtered);
        renderDoubtsView();
      });
    });
  }

  function renderKeyTakeawayView() {
    currentDoubtContext = getVisibleScreenTarget();
    const rawText = currentDoubtContext.text || "";
    const title = currentDoubtContext.title || "Visible Content";
    const excerpt = currentDoubtContext.excerpt || (rawText.slice(0, 160) + "...");

    const sentences = rawText.split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 15 && !s.toLowerCase().includes("institutional research hub") && !s.toLowerCase().includes("all rights reserved"));

    const keySentences = sentences.slice(0, 3);
    if (keySentences.length === 0) {
      keySentences.push(excerpt || "Visible screen content analyzed.");
    }

    const numbersFound = rawText.match(/(\d+(?:\.\d+)?%|\$\d+|\b\d+\s*(?:days|crore|months|years|bps|x|lakh)\b)/gi) || [];
    const uniqueNumbers = Array.from(new Set(numbersFound)).slice(0, 5);

    let matchedTopic = null;
    let highestScore = 0;
    for (const item of FORENSIC_KNOWLEDGE_BASE) {
      let score = 0;
      for (const term of item.terms) {
        if (rawText.toLowerCase().includes(term)) score += 2;
        if (title.toLowerCase().includes(term)) score += 3;
      }
      if (score > highestScore) {
        highestScore = score;
        matchedTopic = item;
      }
    }

    let metricsHtml = "";
    if (uniqueNumbers.length > 0) {
      metricsHtml = `
        <div class="doubt-takeaway-row">
          <span class="doubt-takeaway-label font-mono">TRACKED METRICS &amp; THRESHOLDS:</span>
          <div class="doubt-takeaway-tags">
            ${uniqueNumbers.map(n => `<span class="doubt-highlight-tag">${escapeHtml(n)}</span>`).join(" ")}
          </div>
        </div>
      `;
    }

    const isNarrative = title.includes("SCENE") || title.includes("04.") || title.includes("05.") || title.includes("ACT") || rawText.includes("Leo and Pip") || rawText.includes("clockwork");
    const ddgSearchTerm = isNarrative ? `${title} summary explanation` : `${title} Indian financial markets corporate governance SEBI summary`;
    const ddgAiUrl = `https://duckduckgo.com/?q=${encodeURIComponent(ddgSearchTerm)}&ia=chat`;
    const ddgWebUrl = `https://duckduckgo.com/?q=${encodeURIComponent(ddgSearchTerm)}`;

    const ddgActionBarHtml = `
      <div class="doubt-ddg-bar">
        <span class="doubt-ddg-bar-label">
          <span class="ddg-icon">🦆</span> DUCKDUCKGO ENGINE:
        </span>
        <div class="doubt-ddg-actions">
          <a href="${ddgAiUrl}" target="_blank" rel="noopener noreferrer" class="doubt-ddg-btn doubt-ddg-btn-ai" title="Ask DuckDuckGo AI about this screen">
            <span>Ask DuckDuckGo AI</span>
            <span class="ddg-arrow">↗</span>
          </a>
          <a href="${ddgWebUrl}" target="_blank" rel="noopener noreferrer" class="doubt-ddg-btn doubt-ddg-btn-web" title="Search live web on DuckDuckGo">
            <span>Web Search</span>
            <span class="ddg-arrow">↗</span>
          </a>
        </div>
      </div>
    `;

    doubtOutput.innerHTML = `
      <div class="doubt-takeaway-card">
        <div class="doubt-takeaway-header">
          <span class="doubt-takeaway-badge font-mono">LIVE SCREEN SCAN: ${escapeHtml(title).toUpperCase()}</span>
        </div>
        <div class="doubt-takeaway-source">
          <span class="doubt-source-label font-mono">READING VIEWPORT:</span>
          <span class="doubt-source-title font-mono">"${escapeHtml(title)}"</span>
        </div>
        <div class="doubt-takeaway-snippet">
          <div class="doubt-snippet-label font-mono">CURRENTLY VISIBLE TEXT:</div>
          <p class="doubt-snippet-text font-serif">"${escapeHtml(excerpt)}"</p>
        </div>
        <div class="doubt-takeaway-bullets">
          <div class="doubt-bullets-heading font-mono">KEY TAKEAWAY POINTS:</div>
          ${keySentences.map(s => `
            <div class="doubt-takeaway-bullet">
              <span class="doubt-bullet-dot">▸</span>
              <span>${escapeHtml(s)}</span>
            </div>
          `).join("")}
        </div>
        ${metricsHtml}
        <div class="doubt-takeaway-verdict">
          <strong>Synthesis:</strong> ${matchedTopic ? escapeHtml(matchedTopic.screenContext) : `Key institutional takeaways extracted directly from visible screen content under ${escapeHtml(title)}.`}
        </div>
        ${ddgActionBarHtml}
      </div>
    `;
  }

  openDoubtSolver = function(contextOverride) {
    try {
      if (window.innerWidth <= 1280 && typeof closeTreeExplicitly === "function") {
        closeTreeExplicitly();
      }
      if (doubtPill) doubtPill.classList.remove("is-visible");
      currentDoubtContext = contextOverride || getVisibleScreenTarget() || {
        type: "section",
        title: "Visible Content",
        text: "Select any text or ask a question about this screen."
      };

      if (doubtTile) {
        doubtTile.classList.add("is-open");
      }

      if (activeDoubtMode === "doubts") {
        renderDoubtsView();
      } else {
        renderKeyTakeawayView();
      }

      setTimeout(() => {
        if (doubtTextInput) {
          doubtTextInput.focus();
          doubtTextInput.select();
        }
      }, 50);
    } catch (err) {
      console.error("[DoubtSolver] openDoubtSolver error:", err);
    }
  };

  closeDoubtSolver = function() {
    try {
      if (doubtTile) doubtTile.classList.remove("is-open");
      if (doubtPill) doubtPill.classList.remove("is-visible");
      if (doubtTextInput) doubtTextInput.blur();
    } catch (err) {
      console.error("[DoubtSolver] closeDoubtSolver error:", err);
    }
  };

  toggleDoubtSolver = function() {
    if (doubtTile && doubtTile.classList.contains("is-open")) {
      closeDoubtSolver();
    } else {
      openDoubtSolver();
    }
  };

  // Expose on window for direct access
  window.toggleDoubtSolver = toggleDoubtSolver;
  window.openDoubtSolver = openDoubtSolver;
  window.closeDoubtSolver = closeDoubtSolver;

  function synthesizeDoubtAnswer(query, context) {
    return synthesizeConceptAnswer(query, context, null);
  }

  async function askDoubt(query) {
    const trimmed = (query || "").trim();
    if (!trimmed) {
      if (doubtTextInput) doubtTextInput.focus();
      return;
    }

    if (activeDoubtMode !== "doubts") {
      activeDoubtMode = "doubts";
      doubtChips.forEach(c => {
        c.classList.toggle("active", c.getAttribute("data-mode") === "doubts");
      });
      if (doubtTextInput) {
        doubtTextInput.placeholder = "Ask a doubt or press Enter...";
      }
    }

    const currentId = ++activeQueryId;
    if (doubtAskBtn) {
      doubtAskBtn.textContent = "Solving... 🦆";
      doubtAskBtn.disabled = true;
    }

    // Always ensure fresh screen context if user didn't make an explicit selection
    if (!currentDoubtContext || currentDoubtContext.type !== "selection") {
      currentDoubtContext = getVisibleScreenTarget();
    }
    const context = currentDoubtContext;
    const timeInfo = getExactTimestamp();

    try {
      const resolvedAnswer = await resolveDoubtAnswer(trimmed, context);

      if (currentId === activeQueryId) {
        const newRecord = {
          id: "doubt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
          timestamp: Date.now(),
          exactTimestamp: timeInfo.full,
          question: trimmed,
          answerHtml: resolvedAnswer
        };

        const currentHistory = getLocalDoubtsHistory();
        const updatedHistory = [newRecord, ...currentHistory];
        saveLocalDoubtsHistory(updatedHistory);

        if (doubtTextInput) doubtTextInput.value = "";
        renderDoubtsView();
      }
    } catch (err) {
      console.error("[DoubtSolver] askDoubt error:", err);
      const fallbackAns = synthesizeConceptAnswer(trimmed, context, null);
      const newRecord = {
        id: "doubt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
        timestamp: Date.now(),
        exactTimestamp: timeInfo.full,
        question: trimmed,
        answerHtml: fallbackAns
      };
      saveLocalDoubtsHistory([newRecord, ...getLocalDoubtsHistory()]);
      renderDoubtsView();
    } finally {
      if (doubtAskBtn) {
        doubtAskBtn.textContent = "Ask DDG ↵";
        doubtAskBtn.disabled = false;
      }
    }
  }

  doubtCloseBtn.addEventListener("click", closeDoubtSolver);

  doubtAskBtn.addEventListener("click", () => {
    const q = doubtTextInput ? doubtTextInput.value : "";
    askDoubt(q);
  });

  doubtTextInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = doubtTextInput ? doubtTextInput.value : "";
      askDoubt(q);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeDoubtSolver();
    }
  });

  doubtChips.forEach(chip => {
    chip.addEventListener("click", () => {
      doubtChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeDoubtMode = chip.getAttribute("data-mode") || "doubts";
      currentDoubtContext = getVisibleScreenTarget();
      if (activeDoubtMode === "doubts") {
        if (doubtTextInput) doubtTextInput.placeholder = "Ask a doubt or press Enter...";
        renderDoubtsView();
      } else {
        if (doubtTextInput) doubtTextInput.placeholder = "Ask a question about this takeaway...";
        renderKeyTakeawayView();
      }
    });
  });

  document.addEventListener("mousedown", (e) => {
    if (!doubtTile.classList.contains("is-open")) return;
    if (!doubtTile.contains(e.target) && !doubtPill.contains(e.target)) {
      closeDoubtSolver();
    }
  });

  // ================= 10. EDGE HOVER TRIGGER SYSTEM (Left: Directory Tree, Right: Doubt AI) =================
  // Force directory tree & duckduckgo doubt solver to appear as floating windows by moving cursor to the very end of sides
  let treeOpenedByHover = false;
  let doubtOpenedByHover = false;
  let doubtLeaveTimer = null;

  // Create invisible edge sensor zones for immediate pointer detection
  const edgeSensorLeft = document.createElement("div");
  edgeSensorLeft.id = "edge-sensor-left";
  edgeSensorLeft.className = "edge-sensor-zone edge-sensor-left";
  edgeSensorLeft.setAttribute("aria-hidden", "true");
  document.body.appendChild(edgeSensorLeft);

  const edgeSensorRight = document.createElement("div");
  edgeSensorRight.id = "edge-sensor-right";
  edgeSensorRight.className = "edge-sensor-zone edge-sensor-right";
  edgeSensorRight.setAttribute("aria-hidden", "true");
  document.body.appendChild(edgeSensorRight);

  function triggerLeftEdgeTree() {
    if (!isTreeCurrentlyOpen()) {
      treeOpenedByHover = true;
      if (railNavigator) railNavigator.classList.remove("is-closed");
      openRailPanel();
    }
  }

  function triggerRightEdgeDoubt() {
    if (!doubtTile.classList.contains("is-open")) {
      doubtOpenedByHover = true;
      openDoubtSolver();
    }
  }

  function handleDoubtHoverLeave() {
    if (!doubtOpenedByHover) return;
    if (doubtTextInput && document.activeElement === doubtTextInput) return;
    if (doubtTextInput && doubtTextInput.value.trim().length > 0) return;

    if (doubtLeaveTimer) clearTimeout(doubtLeaveTimer);
    doubtLeaveTimer = setTimeout(() => {
      const isTileHovered = doubtTile && doubtTile.matches(":hover");
      const isInputFocused = doubtTextInput && document.activeElement === doubtTextInput;
      if (!isTileHovered && !isInputFocused && doubtOpenedByHover) {
        closeDoubtSolver();
        doubtOpenedByHover = false;
      }
    }, 380);
  }

  // Edge Sensor DOM Listeners
  edgeSensorLeft.addEventListener("mouseenter", () => {
    triggerLeftEdgeTree();
  });

  edgeSensorRight.addEventListener("mouseenter", () => {
    triggerRightEdgeDoubt();
  });

  // Global mousemove for rapid cursor flicks to the absolute edge
  window.addEventListener("mousemove", (e) => {
    if (e.buttons !== 0) return; // Don't trigger if user is dragging/selecting text or dragging scrollbar

    const clientX = e.clientX;
    const clientY = e.clientY;
    const winWidth = window.innerWidth;

    // Left Edge Trigger (<= 14px): open Directory Tree
    if (clientX <= 14 && clientY >= 50) {
      triggerLeftEdgeTree();
    }

    // Right Edge Trigger (>= winWidth - 14px): open Doubt AI
    if (clientX >= winWidth - 14 && clientY >= 50) {
      triggerRightEdgeDoubt();
    }

    // If Tree was opened by edge hover and is not pinned: close when mouse leaves panel to the right
    if (treeOpenedByHover && !isPinned && isTreeCurrentlyOpen()) {
      if (clientX > 390) {
        closeRailPanel(220);
        treeOpenedByHover = false;
      }
    }

    // If Doubt Solver was opened by edge hover: check if mouse moved away to the left
    if (doubtOpenedByHover && doubtTile && doubtTile.classList.contains("is-open")) {
      if (clientX < winWidth - 440) {
        handleDoubtHoverLeave();
      }
    }
  }, { passive: true });

  // When user enters doubtTile, cancel any leave timer
  if (doubtTile) {
    doubtTile.addEventListener("mouseenter", () => {
      if (doubtLeaveTimer) clearTimeout(doubtLeaveTimer);
    });
    doubtTile.addEventListener("mouseleave", () => {
      handleDoubtHoverLeave();
    });
    // If user clicks anywhere inside the tile or focuses input, make it stay open
    doubtTile.addEventListener("focusin", () => {
      doubtOpenedByHover = false;
    });
    doubtTile.addEventListener("mousedown", () => {
      doubtOpenedByHover = false;
    });
  }

  // Ensure shortcut toggles reset the hover flags
  const origToggleTree = toggleTree;
  toggleTree = function(forceState) {
    treeOpenedByHover = false;
    origToggleTree(forceState);
  };

  const origToggleDoubt = toggleDoubtSolver;
  toggleDoubtSolver = function() {
    doubtOpenedByHover = false;
    origToggleDoubt();
  };

  // ================= 11. RIGID TOP-NAV SEARCH BAR & COMMAND PALETTE (Triggered by /) =================
  let navSearchBarWrapper = document.getElementById("nav-search-bar-wrapper");
  let navSearchInput = document.getElementById("nav-search-input");
  let navSearchResultsDropdown = document.getElementById("nav-search-results-dropdown");
  let paletteCurrentItems = [];
  let paletteSelectedIndex = -1;

  // In-Page Finder state
  finderMatches = [];
  let currentFinderMatchIdx = 0;
  let currentFinderQuery = "";

  // If search bar is not in HTML, dynamically inject it into .nav-left beside .view-switcher
  if (!navSearchBarWrapper) {
    const navLeft = document.querySelector(".nav-left");
    if (navLeft) {
      navSearchBarWrapper = document.createElement("div");
      navSearchBarWrapper.id = "nav-search-bar-wrapper";
      navSearchBarWrapper.className = "nav-search-bar-wrapper";
      navSearchBarWrapper.innerHTML = `
        <div class="nav-search-bar" id="nav-search-bar">
          <span class="nav-search-icon">🔍</span>
          <input type="text" class="nav-search-input" id="nav-search-input" placeholder="Search website, shortcuts, sections... (/)" autocomplete="off" spellcheck="false" />
          <kbd class="nav-search-kbd" title="Press / to search">/</kbd>
        </div>
        <div class="nav-search-results-dropdown" id="nav-search-results-dropdown" role="listbox"></div>
      `;
      navLeft.appendChild(navSearchBarWrapper);
      navSearchInput = navSearchBarWrapper.querySelector("#nav-search-input");
      navSearchResultsDropdown = navSearchBarWrapper.querySelector("#nav-search-results-dropdown");
    }
  }

  // Build In-Page Finder Floating Bar DOM
  inpageFinderBar = document.getElementById("inpage-finder-bar");
  if (!inpageFinderBar) {
    inpageFinderBar = document.createElement("div");
    inpageFinderBar.id = "inpage-finder-bar";
    inpageFinderBar.className = "inpage-finder-bar";
    inpageFinderBar.setAttribute("role", "search");
    inpageFinderBar.setAttribute("aria-label", "In-Page Finder");
    inpageFinderBar.innerHTML = `
      <span class="finder-icon">🔍</span>
      <span class="finder-query-text" id="finder-query-text">""</span>
      <span class="finder-match-count font-mono" id="finder-match-count">0 of 0</span>
      <div class="finder-nav-btns">
        <button type="button" class="finder-btn" id="finder-btn-prev" title="Previous Match (Shift+Enter or ▲)">▲</button>
        <button type="button" class="finder-btn" id="finder-btn-next" title="Next Match (Enter or ▼)">▼</button>
      </div>
      <button type="button" class="finder-close-btn" id="finder-close-btn" title="Close Finder (Esc)">&times;</button>
    `;
    document.body.appendChild(inpageFinderBar);
  }

  const finderQueryText = inpageFinderBar.querySelector("#finder-query-text");
  const finderMatchCount = inpageFinderBar.querySelector("#finder-match-count");
  const finderBtnPrev = inpageFinderBar.querySelector("#finder-btn-prev");
  const finderBtnNext = inpageFinderBar.querySelector("#finder-btn-next");
  const finderCloseBtn = inpageFinderBar.querySelector("#finder-close-btn");

  isFinderActive = function() {
    return Boolean(inpageFinderBar && inpageFinderBar.classList.contains("is-visible") && finderMatches.length > 0);
  };

  // Helper Functions for Settings Actions
  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("theme-dark");
      document.body.classList.remove("theme-light");
      localStorage.setItem("indexindian_theme", "dark");
      if (contrastToggle) contrastToggle.checked = true;
    } else {
      document.body.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
      localStorage.setItem("indexindian_theme", "light");
      if (contrastToggle) contrastToggle.checked = false;
    }
  }

  function toggleThemeMode() {
    const isDark = document.body.classList.contains("theme-dark");
    applyTheme(isDark ? "light" : "dark");
  }

  function applyFontSize(size) {
    document.documentElement.classList.remove("font-size-small", "font-size-medium", "font-size-large");
    document.documentElement.classList.add(`font-size-${size}`);
    localStorage.setItem("indexindian_font_size", size);
    if (fontSizeLabel) fontSizeLabel.textContent = size.charAt(0).toUpperCase() + size.slice(1);
    const activeItem = document.querySelector(`#list-font-size .dropdown-item[data-val="${size}"]`);
    if (activeItem) {
      document.querySelectorAll("#list-font-size .dropdown-item").forEach((el) => el.classList.remove("active"));
      activeItem.classList.add("active");
    }
  }

  function applyFontStyle(style) {
    document.body.classList.remove("font-style-reading", "font-style-typewriter");
    document.body.classList.add(`font-style-${style}`);
    localStorage.setItem("indexindian_font_style", style);
    if (fontStyleLabel) fontStyleLabel.textContent = style === "reading" ? "Long Reading" : "Typewriter";
    const activeItem = document.querySelector(`#list-font-style .dropdown-item[data-val="${style}"]`);
    if (activeItem) {
      document.querySelectorAll("#list-font-style .dropdown-item").forEach((el) => el.classList.remove("active"));
      activeItem.classList.add("active");
    }
  }

  function toggleBackgroundGrid() {
    document.body.classList.toggle("no-grid");
    if (gridToggle) gridToggle.checked = !document.body.classList.contains("no-grid");
  }

  function navigateToSectionAnchor(hash) {
    closeNavSearchResults();
    try {
      const targetEl = document.querySelector(hash);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        targetEl.classList.add("section-focus-pulse");
        setTimeout(() => targetEl.classList.remove("section-focus-pulse"), 1800);
        history.replaceState(null, "", hash);
      } else {
        window.location.hash = hash;
      }
    } catch (_) {
      window.location.hash = hash;
    }
  }

  // In-Page Highlighting & Walker Engine
  clearFinderHighlights = function() {
    const marks = Array.from(document.querySelectorAll("mark.finder-match"));
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
    finderMatches = [];
    currentFinderMatchIdx = 0;
    currentFinderQuery = "";
    if (inpageFinderBar) inpageFinderBar.classList.remove("is-visible");
  };

  function countInPageMatches(query) {
    if (!query || query.trim().length < 2) return 0;
    const root = document.querySelector(".content-area") || document.querySelector("main") || document.body;
    const text = root.innerText || root.textContent || "";
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = text.match(new RegExp(escaped, "gi"));
    return matches ? matches.length : 0;
  }

  function highlightInPageText(query) {
    clearFinderHighlights();
    if (!query || query.trim().length < 2) return 0;
    const trimmed = query.trim();
    currentFinderQuery = trimmed;

    const root = document.querySelector(".content-area") || document.querySelector("main") || document.body;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toUpperCase();
          if (["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "BUTTON", "NOSCRIPT"].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (
            parent.closest(".nav-search-bar-wrapper") ||
            parent.closest(".inpage-finder-bar") ||
            parent.closest(".doubt-solver-tile") ||
            parent.closest(".top-nav") ||
            parent.closest(".rail-navigator")
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode);
      currentNode = walker.nextNode();
    }

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");

    textNodes.forEach((node) => {
      const text = node.nodeValue;
      if (!regex.test(text)) return;
      regex.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        }
        const mark = document.createElement("mark");
        mark.className = "finder-match";
        mark.textContent = match[0];
        frag.appendChild(mark);
        finderMatches.push(mark);
        lastIdx = regex.lastIndex;
      }
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }
      if (node.parentNode) {
        node.parentNode.replaceChild(frag, node);
      }
    });

    if (finderMatches.length > 0) {
      currentFinderMatchIdx = 0;
      updateFinderUI();
      showFinderMatch(0);
      if (inpageFinderBar) inpageFinderBar.classList.add("is-visible");
    }

    return finderMatches.length;
  }

  function updateFinderUI() {
    if (finderQueryText) finderQueryText.textContent = `"${currentFinderQuery}"`;
    if (finderMatchCount) {
      if (finderMatches.length > 0) {
        finderMatchCount.textContent = `${currentFinderMatchIdx + 1} of ${finderMatches.length}`;
      } else {
        finderMatchCount.textContent = "0 matches";
      }
    }
  }

  function showFinderMatch(index) {
    if (finderMatches.length === 0) return;
    currentFinderMatchIdx = (index + finderMatches.length) % finderMatches.length;
    finderMatches.forEach((m, i) => {
      m.classList.toggle("finder-match-active", i === currentFinderMatchIdx);
    });
    updateFinderUI();
    const target = finderMatches[currentFinderMatchIdx];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  nextFinderMatch = function() {
    if (finderMatches.length === 0) return;
    showFinderMatch(currentFinderMatchIdx + 1);
  };

  prevFinderMatch = function() {
    if (finderMatches.length === 0) return;
    showFinderMatch(currentFinderMatchIdx - 1);
  };

  if (finderBtnNext) finderBtnNext.addEventListener("click", nextFinderMatch);
  if (finderBtnPrev) finderBtnPrev.addEventListener("click", prevFinderMatch);
  if (finderCloseBtn) finderCloseBtn.addEventListener("click", clearFinderHighlights);

  // Universal Registries
  function getAllShortcutBindings() {
    return [
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Step Section Directly",
        subtitle: "Move directly up or down sections without opening directory drawer",
        badge: "Ctrl + ↓ / ↑",
        keywords: "step section directly move next previous section jump ctrl down up arrow shortcut binding"
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Cycle Sub-Pages (x | y | z)",
        subtitle: "Tab through contextual sub-views (Graph | Directory | Source)",
        badge: "Tab",
        keywords: "cycle sub pages tab perspective views graph directory source shortcut binding"
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Switch Guide <=> Index Suite",
        subtitle: "Switch between Guide institutional narrative and Index market intelligence",
        badge: "Hold Tab",
        keywords: "switch suite guide index hold tab long press toggle suite landing shortcut binding"
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Move Act (I | II | III | IV | V | VI)",
        subtitle: "Jump directly through narrative story acts without opening drawer",
        badge: "Shift + ↓ / ↑",
        keywords: "move act shift down up jump chapter acts narrative story shortcut binding"
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Scroll Page Smoothly",
        subtitle: "Continuous delayless page scrolling with zero subpixel font jump",
        badge: "↓ / ↑",
        keywords: "scroll page smoothly arrow down up keyboard scroll navigation shortcut binding"
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Directory Tree Drawer",
        subtitle: "Toggle section tree drawer sticked to the left side of page",
        badge: "N",
        keywords: "directory tree drawer sections table of contents navigation sticked left side shortcut binding",
        action: () => openTreeExplicitly(true)
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Universal Search & Command Palette",
        subtitle: "Focus top search bar to search website, shortcuts, settings, and sections",
        badge: "/",
        keywords: "universal search command palette search bar slash find everything shortcut binding",
        action: () => focusNavSearchBar()
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "DuckDuckGo Doubt Solver",
        subtitle: "Toggle AI doubt solver drawer sticked to the right side of page",
        badge: "M",
        keywords: "doubt solver doubt ai duckduckgo ddg questions answers right drawer sticked right side shortcut binding",
        action: () => openDoubtSolver()
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Account Dossier",
        subtitle: "Toggle institutional profile, user clearance role, and sessions",
        badge: "[",
        keywords: "account dossier profile clearance role user session brackets shortcut binding",
        action: () => {
          if (accountWrapper) {
            if (shortcutsWrapper) shortcutsWrapper.classList.remove("is-open");
            if (settingsWrapper) settingsWrapper.classList.remove("is-open");
            accountWrapper.classList.toggle("is-open");
          }
        }
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Display Settings Panel",
        subtitle: "Toggle high-contrast themes, typography scale, and font styles",
        badge: "]",
        keywords: "display settings panel preferences contrast font size style typography brackets shortcut binding",
        action: () => {
          if (settingsWrapper) {
            if (shortcutsWrapper) shortcutsWrapper.classList.remove("is-open");
            if (accountWrapper) accountWrapper.classList.remove("is-open");
            settingsWrapper.classList.toggle("is-open");
          }
        }
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Shortcuts Cheatsheet",
        subtitle: "Open the complete institutional keyboard shortcuts reference",
        badge: "?",
        keywords: "shortcuts panel cheatsheet keyboard reference help question mark shortcut binding",
        action: () => {
          if (shortcutsWrapper) {
            if (accountWrapper) accountWrapper.classList.remove("is-open");
            if (settingsWrapper) settingsWrapper.classList.remove("is-open");
            shortcutsWrapper.classList.toggle("is-open");
          }
        }
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Close Open Overlays",
        subtitle: "Dismiss all open drawers, flyouts, and in-page highlight finders",
        badge: "Esc",
        keywords: "close escape dismiss overlays drawers panels highlights cancel shortcut binding",
        action: () => {
          closeTreeExplicitly();
          closeDoubtSolver();
          closeNavSearchResults();
          clearFinderHighlights();
        }
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⚡",
        title: "Send Forum Broadcast",
        subtitle: "Publish query or finding to the anonymous institutional forum",
        badge: "Ctrl + ↵",
        keywords: "send forum broadcast publish post enter ctrl return comment shortcut binding"
      }
    ];
  }

  function getCommandsRegistry() {
    return [
      {
        category: "SETTINGS & APPEARANCE",
        icon: "🌓",
        title: "Toggle Dark / Light Theme",
        subtitle: "Switch between high-contrast light and dark display modes",
        badge: "Theme",
        keywords: "dark mode light mode theme contrast appearance night day black white",
        action: () => toggleThemeMode()
      },
      {
        category: "SETTINGS & APPEARANCE",
        icon: "☀️",
        title: "Switch to Light Mode",
        subtitle: "Clean institutional paper-white contrast",
        badge: "Light",
        keywords: "light mode white paper day bright",
        action: () => applyTheme("light")
      },
      {
        category: "SETTINGS & APPEARANCE",
        icon: "🌙",
        title: "Switch to Dark Mode",
        subtitle: "OLED dark mode with high-contrast text",
        badge: "Dark",
        keywords: "dark mode black night oled dim",
        action: () => applyTheme("dark")
      },
      {
        category: "SETTINGS & APPEARANCE",
        icon: "🔤",
        title: "Font Size: Small (85%)",
        subtitle: "Dense financial dossier scaling",
        badge: "Font",
        keywords: "font size small compact text scale zoom dense",
        action: () => applyFontSize("small")
      },
      {
        category: "SETTINGS & APPEARANCE",
        icon: "🔤",
        title: "Font Size: Medium (Default 100%)",
        subtitle: "Balanced reading scale",
        badge: "Font",
        keywords: "font size medium default normal standard text scale",
        action: () => applyFontSize("medium")
      },
      {
        category: "SETTINGS & APPEARANCE",
        icon: "🔤",
        title: "Font Size: Large (115%)",
        subtitle: "Enlarged presentation text scale",
        badge: "Font",
        keywords: "font size large big zoom text scale",
        action: () => applyFontSize("large")
      },
      {
        category: "SETTINGS & APPEARANCE",
        icon: "📖",
        title: "Font Style: Long Reading (Serif)",
        subtitle: "Institutional editorial serif typography",
        badge: "Serif",
        keywords: "font style serif reading editorial typography book",
        action: () => applyFontStyle("reading")
      },
      {
        category: "SETTINGS & APPEARANCE",
        icon: "⌨️",
        title: "Font Style: Typewriter (Monospace)",
        subtitle: "Bloomberg terminal typewriter monospace font",
        badge: "Mono",
        keywords: "font style typewriter monospace code terminal courier",
        action: () => applyFontStyle("typewriter")
      },
      {
        category: "SETTINGS & APPEARANCE",
        icon: "▦",
        title: "Toggle Background Grid",
        subtitle: "Show or hide subtle background precision grid",
        badge: "Grid",
        keywords: "grid lines background toggle display layout",
        action: () => toggleBackgroundGrid()
      },
      {
        category: "NAVIGATION & PANELS",
        icon: "🌳",
        title: "Directory Sections Tree",
        subtitle: "Toggle section tree drawer sticked to left side",
        badge: "N",
        keywords: "directory tree rail sections table of contents drawer navigation",
        action: () => openTreeExplicitly(true)
      },
      {
        category: "NAVIGATION & PANELS",
        icon: "🦆",
        title: "DuckDuckGo AI Doubt Solver",
        subtitle: "Ask questions, resolve market doubts, and scan screen",
        badge: "M",
        keywords: "doubt solver duckduckgo ddg ai explainer question ask search",
        action: () => openDoubtSolver()
      },
      {
        category: "NAVIGATION & PANELS",
        icon: "🔀",
        title: isIndexSuite ? "Switch to Guide Suite (Narrative)" : "Switch to Index Suite (Market Hub)",
        subtitle: isIndexSuite ? "Jump to Guide Landing (Acts I – VI)" : "Jump to Index Landing (B2B Data)",
        badge: "Hold Tab",
        keywords: "switch suite guide index tab toggle landing",
        action: () => {
          window.location.href = targetOtherSuiteUrl;
        }
      }
    ];
  }

  function getPageSectionsRegistry() {
    const sections = [];

    // Current page sections from treeNodes
    treeNodes.forEach((node) => {
      const href = node.getAttribute("href") || "";
      const label = node.querySelector(".tree-label, .tree-node-title")?.textContent?.trim() || node.textContent.trim();
      const num = node.querySelector(".tree-num")?.textContent?.trim() || "";
      if (label && href) {
        sections.push({
          category: "DIRECTORY & SECTIONS",
          icon: "📂",
          title: num ? `${num} ${label}` : label,
          subtitle: href.startsWith("#") ? `In-Page Anchor (${href})` : `Navigate to ${href}`,
          badge: href.startsWith("#") ? "Anchor" : "Page",
          keywords: `section chapter act ${label} ${href}`,
          action: () => {
            if (href.startsWith("#")) {
              navigateToSectionAnchor(href);
            } else {
              window.location.href = href;
            }
          }
        });
      }
    });

    // Core Hubs & Modular Directories
    const HUB_PAGES = [
      { title: "Guide Landing — Complete Institutional Narrative", file: "guide.html", sub: "Acts I – VI Narrative & Case Study", kw: "guide story narrative prologue acts" },
      { title: "Founder Dossier — Promoter Concentration & Pledging", file: "founder.html", sub: "Equity dilution, family trusts, pledge dynamics", kw: "founder promoter shares pledge trusts equity" },
      { title: "Investor Dossier — Institutional Flow Analysis", file: "investor.html", sub: "FII vs DII allocation & institutional flows", kw: "investor fii dii foreign domestic capital flows" },
      { title: "Bottleneck Matrix — Regulatory Chokepoints", file: "bottleneck.html", sub: "SEBI, RBI, MCA systemic friction points", kw: "bottleneck regulatory chokepoint sebi rbi mca friction" },
      { title: "Index Landing — Market Capitalization Hub", file: "index.html", sub: "Indian equity markets overview & indices", kw: "index market marketcap valuation multiples" },
      { title: "Graph Network — Ownership Webs & Circular Cross-Holdings", file: "graph.html", sub: "Ultimate beneficial ownership spider web", kw: "graph network ownership cross holding web corporate" },
      { title: "Corporate Directory — Comprehensive Entity Registry", file: "directory.html", sub: "Nifty 50, Midcap, and categorized companies", kw: "directory corporate entities list companies database" },
      { title: "Sources & Methodology — Disclosures & API Feeds", file: "source.html", sub: "Exchange filings, research papers, legal citations", kw: "sources methodology references citations exchange sebi filings api" }
    ];

    HUB_PAGES.forEach((hub) => {
      const isCurrent = currentFile === hub.file;
      sections.push({
        category: "PAGES & DIRECTORIES",
        icon: isCurrent ? "📍" : "📄",
        title: hub.title,
        subtitle: isCurrent ? "Currently viewing this page" : hub.sub,
        badge: isCurrent ? "Current" : "Go",
        keywords: `${hub.kw} ${hub.title} ${hub.file}`,
        action: () => {
          if (!isCurrent) window.location.href = hub.file;
        }
      });
    });

    return sections;
  }

  // Render Search Results (NO recommended list when empty, only appears when query typed)
  function renderSearchResults(query) {
    const q = (query || "").trim().toLowerCase();
    if (!navSearchResultsDropdown) return;

    if (q.length === 0) {
      // Per user request: do NOT make recommended list appear beneath search bar
      navSearchResultsDropdown.classList.remove("is-open");
      navSearchResultsDropdown.innerHTML = "";
      paletteCurrentItems = [];
      paletteSelectedIndex = -1;
      return;
    }

    navSearchResultsDropdown.innerHTML = "";
    paletteCurrentItems = [];
    navSearchResultsDropdown.classList.add("is-open");

    // 1. In-Page Finder Dynamic Result if query length >= 2
    if (q.length >= 2) {
      const pageMatchesCount = countInPageMatches(q);
      const inPageFinderItem = {
        category: "IN-PAGE TEXT SEARCH",
        icon: "🔍",
        title: `Find on page: "${query.trim()}"`,
        subtitle: pageMatchesCount > 0 ? `${pageMatchesCount} occurrences highlighted with soft orange theme` : "Search whole page text",
        badge: pageMatchesCount > 0 ? `${pageMatchesCount} matches` : "Find",
        keywords: q,
        action: () => {
          closeNavSearchResults();
          highlightInPageText(query.trim());
        }
      };
      paletteCurrentItems.push(inPageFinderItem);
    }

    const shortcuts = getAllShortcutBindings();
    const commands = getCommandsRegistry();
    const sections = getPageSectionsRegistry();

    // 2. Filter Shortcuts
    const filteredShortcuts = shortcuts.filter((sc) => {
      const titleMatch = sc.title.toLowerCase().includes(q);
      const subMatch = sc.subtitle.toLowerCase().includes(q);
      const kwMatch = sc.keywords.toLowerCase().includes(q);
      const badgeMatch = sc.badge.toLowerCase().includes(q);
      return titleMatch || subMatch || kwMatch || badgeMatch;
    });

    // 3. Filter Commands
    const filteredCommands = commands.filter((cmd) => {
      const titleMatch = cmd.title.toLowerCase().includes(q);
      const keywordsMatch = cmd.keywords.toLowerCase().includes(q);
      return titleMatch || keywordsMatch;
    });

    // 4. Filter Sections & Pages
    const filteredSections = sections.filter((sec) => {
      const titleMatch = sec.title.toLowerCase().includes(q);
      const subMatch = sec.subtitle && sec.subtitle.toLowerCase().includes(q);
      const kwMatch = sec.keywords && sec.keywords.toLowerCase().includes(q);
      return titleMatch || subMatch || kwMatch;
    });

    filteredShortcuts.forEach((s) => paletteCurrentItems.push(s));
    filteredCommands.forEach((c) => paletteCurrentItems.push(c));
    filteredSections.forEach((s) => paletteCurrentItems.push(s));

    if (paletteCurrentItems.length === 0) {
      navSearchResultsDropdown.innerHTML = `
        <div class="palette-empty-state">
          <p>No results matching "<strong>${escapeHtml(query)}</strong>"</p>
          <p style="font-size: 0.72rem; margin-top: 5px; opacity: 0.7;">Try searching for <em>step section</em>, <em>dark mode</em>, <em>doubt</em>, or an act.</p>
        </div>
      `;
      paletteSelectedIndex = -1;
      return;
    }

    let currentGroup = "";
    paletteCurrentItems.forEach((item, index) => {
      if (item.category !== currentGroup) {
        currentGroup = item.category;
        const groupHeader = document.createElement("div");
        groupHeader.className = "palette-group-title";
        groupHeader.textContent = currentGroup;
        navSearchResultsDropdown.appendChild(groupHeader);
      }

      const itemEl = document.createElement("div");
      itemEl.className = "palette-item" + (index === 0 ? " is-selected" : "");
      itemEl.setAttribute("role", "option");
      itemEl.setAttribute("data-index", String(index));
      itemEl.innerHTML = `
        <div class="palette-item-left">
          <span class="palette-item-icon">${item.icon || "▸"}</span>
          <div class="palette-item-text">
            <span class="palette-item-title">${escapeHtml(item.title)}</span>
            ${item.subtitle ? `<span class="palette-item-subtitle">${escapeHtml(item.subtitle)}</span>` : ""}
          </div>
        </div>
        <div class="palette-item-right">
          ${item.badge ? `<span class="palette-item-badge">${escapeHtml(item.badge)}</span>` : ""}
        </div>
      `;

      itemEl.addEventListener("click", () => {
        executePaletteItem(index);
      });

      itemEl.addEventListener("mouseenter", () => {
        setPaletteSelectedIndex(index);
      });

      navSearchResultsDropdown.appendChild(itemEl);
    });

    paletteSelectedIndex = 0;
  }

  function setPaletteSelectedIndex(index) {
    if (paletteCurrentItems.length === 0 || !navSearchResultsDropdown) return;
    paletteSelectedIndex = Math.max(0, Math.min(index, paletteCurrentItems.length - 1));
    const allItemEls = navSearchResultsDropdown.querySelectorAll(".palette-item");
    allItemEls.forEach((el, i) => {
      const isSelected = i === paletteSelectedIndex;
      el.classList.toggle("is-selected", isSelected);
      if (isSelected) {
        el.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function executePaletteItem(index) {
    const item = paletteCurrentItems[index];
    if (!item) return;
    closeNavSearchResults();
    if (typeof item.action === "function") {
      item.action();
    }
  }

  focusNavSearchBar = function() {
    if (navSearchInput) {
      navSearchInput.focus();
      navSearchInput.select();
    }
  };

  closeNavSearchResults = function() {
    if (navSearchResultsDropdown) {
      navSearchResultsDropdown.classList.remove("is-open");
      navSearchResultsDropdown.innerHTML = "";
    }
    if (navSearchInput) {
      navSearchInput.blur();
    }
    paletteCurrentItems = [];
    paletteSelectedIndex = -1;
  };

  window.focusNavSearchBar = focusNavSearchBar;
  window.closeNavSearchResults = closeNavSearchResults;

  if (navSearchInput) {
    navSearchInput.addEventListener("input", (e) => {
      renderSearchResults(e.target.value);
    });

    navSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPaletteSelectedIndex(paletteSelectedIndex + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setPaletteSelectedIndex(paletteSelectedIndex - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (paletteSelectedIndex >= 0 && paletteSelectedIndex < paletteCurrentItems.length) {
          executePaletteItem(paletteSelectedIndex);
        } else if (navSearchInput.value.trim().length >= 2) {
          closeNavSearchResults();
          highlightInPageText(navSearchInput.value.trim());
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeNavSearchResults();
      }
    });
  }

  document.addEventListener("mousedown", (e) => {
    if (navSearchBarWrapper && !navSearchBarWrapper.contains(e.target)) {
      closeNavSearchResults();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth <= 1280) {
      if (isTreeCurrentlyOpen() && doubtTile && doubtTile.classList.contains("is-open")) {
        closeDoubtSolver();
      }
    }
  });
});
