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

  // Forward declarations for Doubt Solver so global listeners can invoke them
  let toggleDoubtSolver = function() {};
  let openDoubtSolver = function() {};
  let closeDoubtSolver = function() {};

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

    // 10. Shortcut 'D': Toggle AI Doubt Solver (KeyD or 'd'/'D', no Ctrl, Alt, Meta)
    if ((e.code === "KeyD" || e.key?.toLowerCase() === "d") && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      toggleDoubtSolver();
      return;
    }

    // 11. Escape closes all open panels, menus, directory tree, and Doubt Solver (strictly alone)
    if (e.key === "Escape" && noModifiers) {
      if (shortcutsWrapper) shortcutsWrapper.classList.remove("is-open");
      if (accountWrapper) accountWrapper.classList.remove("is-open");
      if (settingsWrapper) settingsWrapper.classList.remove("is-open");
      closeTreeExplicitly();
      closeDoubtSolver();
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

  async function fetchDuckDuckGoWebDefinition(query) {
    if (!query) return null;
    const clean = query.toLowerCase().replace(/^(what is|what are|define|explain|tell me about|how does|why does)\s+/i, "").trim();
    if (!clean || clean.length < 2) return null;

    let wikiTitle = TERM_ALIASES[clean];
    if (!wikiTitle) {
      for (const [k, v] of Object.entries(TERM_ALIASES)) {
        if (clean.includes(k)) {
          wikiTitle = v;
          break;
        }
      }
    }
    if (!wikiTitle) {
      wikiTitle = clean.charAt(0).toUpperCase() + clean.slice(1).replace(/\s+/g, "_");
    }

    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.extract && data.type !== "disambiguation") {
        return {
          title: data.title,
          extract: data.extract
        };
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  let currentDoubtContext = null;
  let activeDoubtMode = "explain";
  let activeQueryId = 0;

  // Create UI elements
  const doubtPill = document.createElement("div");
  doubtPill.className = "doubt-selection-pill";
  doubtPill.id = "doubt-selection-pill";
  doubtPill.title = "Ask DuckDuckGo Doubt Solver (Shortcut: D)";
  doubtPill.innerHTML = `
    <span class="doubt-pill-spark">🦆</span>
    <span>Explain</span>
    <span class="doubt-pill-key">D</span>
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
        <span class="doubt-context-badge" id="doubt-context-badge">SECTION CONTEXT</span>
        <button type="button" class="doubt-tile-close" id="doubt-tile-close" title="Close (Esc)">&times;</button>
      </div>
    </div>
    <div class="doubt-tile-body">
      <div class="doubt-context-card">
        <span class="doubt-context-label">REFERENCED CONTEXT:</span>
        <p class="doubt-context-snippet" id="doubt-context-snippet">Scanning visible screen...</p>
      </div>
      <div class="doubt-input-row">
        <input type="text" id="doubt-text-input" class="doubt-text-input" placeholder="Ask DuckDuckGo or press Enter to explain..." autocomplete="off">
        <button type="button" id="doubt-ask-btn" class="doubt-ask-btn">Ask DDG ↵</button>
      </div>
      <div class="doubt-chips-container" id="doubt-chips-container">
        <button type="button" class="doubt-chip-btn active" data-mode="explain">💡 Plain English</button>
        <button type="button" class="doubt-chip-btn" data-mode="keypoint">📊 Key Takeaway</button>
        <button type="button" class="doubt-chip-btn" data-mode="regulatory">⚖️ SEBI &amp; Risk</button>
        <button type="button" class="doubt-chip-btn" data-mode="formula">🧮 Math &amp; Metric</button>
      </div>
      <div class="doubt-output-container" id="doubt-output-container"></div>
    </div>
    <div class="doubt-tile-footer">
      <div class="doubt-footer-shortcuts">
        <span><kbd>D</kbd> toggle</span>
        <span><kbd>Esc</kbd> close</span>
        <span><kbd>Enter</kbd> ask</span>
      </div>
      <div class="doubt-footer-engine">
        <span>🦆 Powered by DuckDuckGo Engine</span>
      </div>
    </div>
  `;
  document.body.appendChild(doubtTile);

  const doubtCloseBtn = doubtTile.querySelector("#doubt-tile-close");
  const doubtContextBadge = doubtTile.querySelector("#doubt-context-badge");
  const doubtContextSnippet = doubtTile.querySelector("#doubt-context-snippet");
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
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : "";
      if (selectedText.length >= 2) {
        const parentSection = selection.anchorNode?.parentElement?.closest("section, div[id]");
        const sectionTitle = parentSection?.querySelector(".story-section-title, h2, h3, .institutional-title")?.textContent?.trim() || "";
        return {
          type: "selection",
          title: sectionTitle ? `SELECTION in ${sectionTitle}` : "SELECTED EXCERPT",
          text: selectedText
        };
      }

      let sectionEl = null;
      if (treeNodes && treeNodes[currentSubIndex]) {
        const href = treeNodes[currentSubIndex].getAttribute("href");
        if (href && href.startsWith("#") && href.length > 1) {
          try {
            sectionEl = document.querySelector(href);
          } catch (_) {
            sectionEl = null;
          }
        }
      }

      if (!sectionEl) {
        const sections = Array.from(document.querySelectorAll("section[id], .content-area > div, .institutional-title"));
        const scrollPos = window.scrollY + 100;
        for (const sec of sections) {
          const top = sec.offsetTop;
          const height = sec.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            sectionEl = sec;
            break;
          }
        }
        if (!sectionEl && sections.length > 0) sectionEl = sections[0];
      }

      const title = sectionEl?.querySelector(".story-section-title, h2, h3, .institutional-title")?.textContent?.trim() || "Visible Section";
      const paragraphs = Array.from(sectionEl?.querySelectorAll("p, li, .story-narrative-lead, .story-meta-tags, td, th") || [])
        .map(p => p.textContent.trim())
        .filter(t => t.length > 0)
        .join(" ");

      const text = paragraphs.length > 0 ? paragraphs : (sectionEl?.textContent?.replace(/\s+/g, " ").trim() || "Institutional research dossier content.");
      return {
        type: "section",
        title: title.replace(/^[^\w\s]+/, "").trim() || "Screen Content",
        text: text
      };
    } catch (err) {
      console.warn("[DoubtSolver] getVisibleScreenTarget error:", err);
      return {
        type: "section",
        title: "Visible Content",
        text: "Select any text or ask a question about this screen."
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
    openDoubtSolver();
  });

  const doubtNavBtn = document.getElementById("doubt-nav-btn");
  if (doubtNavBtn) {
    doubtNavBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleDoubtSolver();
    });
  }

  openDoubtSolver = function(contextOverride) {
    try {
      if (doubtPill) doubtPill.classList.remove("is-visible");
      currentDoubtContext = contextOverride || getVisibleScreenTarget() || {
        type: "section",
        title: "Visible Content",
        text: "Select any text or ask a question about this screen."
      };
      
      if (doubtContextBadge) {
        doubtContextBadge.textContent = (currentDoubtContext.title || "CONTENT").toUpperCase();
        doubtContextBadge.title = currentDoubtContext.title || "";
      }
      if (doubtContextSnippet) {
        doubtContextSnippet.textContent = currentDoubtContext.text || "Scanning visible screen...";
      }

      if (doubtTile) {
        doubtTile.classList.add("is-open");
      }

      executeDoubtQuery();

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

  function synthesizeDoubtAnswer(query, mode, context) {
    const rawText = context.text || "";
    const title = context.title || "Visible Content";
    const cleanQuery = (query || "").trim();
    const queryLower = cleanQuery.toLowerCase();

    // Semantic matching against knowledge base
    let matchedTopic = null;
    let highestScore = 0;

    for (const item of FORENSIC_KNOWLEDGE_BASE) {
      let score = 0;
      for (const term of item.terms) {
        if (queryLower && queryLower.includes(term)) score += 8;
        if (rawText.toLowerCase().includes(term)) score += 2;
        if (title.toLowerCase().includes(term)) score += 3;
      }
      if (score > highestScore) {
        highestScore = score;
        matchedTopic = item;
      }
    }

    const numbersFound = rawText.match(/(\d+(?:\.\d+)?%|\$\d+|\b\d+\s*(?:days|crore|months|years|bps)\b)/gi) || [];
    const uniqueNumbers = Array.from(new Set(numbersFound)).slice(0, 5);

    const sentences = rawText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 12);
    let bestSentence = sentences[0] || rawText.slice(0, 160);
    
    if (queryLower) {
      const qWords = queryLower.split(/\s+/).filter(w => w.length > 2 && !["what", "why", "how", "when", "where", "which", "does", "this", "that", "the", "and", "is", "are", "can", "you", "tell"].includes(w));
      let bestSentScore = 0;
      for (const s of sentences) {
        const sLower = s.toLowerCase();
        let sScore = 0;
        for (const w of qWords) {
          if (sLower.includes(w)) sScore += 2;
        }
        if (sScore > bestSentScore) {
          bestSentScore = sScore;
          bestSentence = s;
        }
      }
    }

    let questionEchoHtml = "";
    if (cleanQuery) {
      questionEchoHtml = `
        <div class="doubt-question-echo">
          <span class="doubt-q-badge font-mono">YOUR DOUBT:</span>
          <span class="doubt-q-text">"${escapeHtml(cleanQuery)}"</span>
        </div>
      `;
    }

    let directAnswerHtml = "";
    let screenEvidenceHtml = "";
    let takeawayHtml = "";

    const isWhyQuestion = queryLower.startsWith("why") || queryLower.includes(" why ");
    const isHowQuestion = queryLower.startsWith("how") || queryLower.includes(" how ");

    if (cleanQuery) {
      if (isWhyQuestion && matchedTopic) {
        directAnswerHtml = `<strong>Why this exists:</strong> ${matchedTopic.screenContext}`;
        screenEvidenceHtml = `<strong>Screen Context:</strong> In <strong>${escapeHtml(title)}</strong>, this principle guards against governance breakdown: "<em>${escapeHtml(bestSentence.slice(0, 160))}...</em>"`;
        takeawayHtml = `<strong>Statutory Rationale:</strong> ${matchedTopic.statutoryRule}`;
      } else if (isHowQuestion && matchedTopic) {
        directAnswerHtml = `<strong>Operational Mechanic:</strong> ${matchedTopic.concept}`;
        screenEvidenceHtml = `<strong>Execution Rule:</strong> "<em>${escapeHtml(bestSentence.slice(0, 160))}...</em>"`;
        takeawayHtml = `<strong>Statutory Standard:</strong> ${matchedTopic.statutoryRule}`;
      } else if (matchedTopic) {
        directAnswerHtml = `<strong>Concept Analysis:</strong> ${matchedTopic.concept}`;
        screenEvidenceHtml = `<strong>Visible Screen Application:</strong> ${matchedTopic.screenContext} (Referencing: "<em>${escapeHtml(bestSentence.slice(0, 150))}...</em>")`;
        takeawayHtml = `<strong>Forensic Standard:</strong> ${matchedTopic.statutoryRule}`;
      } else {
        directAnswerHtml = `<strong>Direct Context Explanation:</strong> Based on the visible content in <strong>${escapeHtml(title)}</strong>, this section sets out forensic parameters directly applicable to institutional research.`;
        screenEvidenceHtml = `<strong>Visible Excerpt:</strong> "<em>${escapeHtml(bestSentence.slice(0, 190))}...</em>"`;
        takeawayHtml = `<strong>Forensic Takeaway:</strong> Analyzed under the sovereign research methodology to eliminate speculative bias.`;
      }
    } else {
      if (mode === "regulatory") {
        directAnswerHtml = matchedTopic
          ? `<strong>Statutory Mandate:</strong> ${matchedTopic.statutoryRule}`
          : `<strong>Regulatory Compliance:</strong> Governed by SEBI (Listing Obligations and Disclosure Requirements) Regulations and Companies Act statutory disclosure mandates.`;
        screenEvidenceHtml = `<strong>Compliance Monitor:</strong> Audited under institutional governance rules to prevent minority shareholder wealth erosion.`;
        takeawayHtml = `<strong>Audit Benchmark:</strong> Any qualification or failure in this metric triggers an automatic governance risk downgrade.`;
      } else if (mode === "keypoint") {
        directAnswerHtml = `<strong>Primary Metric Target:</strong> ${uniqueNumbers.length > 0 ? `Key thresholds tracked on this screen: ${uniqueNumbers.map(n => `<span class="doubt-highlight-tag">${escapeHtml(n)}</span>`).join(" ")}.` : `Core institutional standard established for ${escapeHtml(title)}.`}`;
        screenEvidenceHtml = `<strong>Primary Screen Evidence:</strong> "${escapeHtml(bestSentence.slice(0, 180))}..."`;
        takeawayHtml = `<strong>Quantitative Takeaway:</strong> Deviations from this benchmark signal heightened systemic risk.`;
      } else if (mode === "formula") {
        directAnswerHtml = matchedTopic && matchedTopic.terms.includes("hhi")
          ? `<strong>Concentration Formula:</strong> <span class="doubt-highlight-tag">HHI = &Sigma; s<sub>i</sub><sup>2</sup></span> where <em>s<sub>i</sub></em> is the percentage weight of each constituent sector.`
          : `<strong>Weighting &amp; Scoring Logic:</strong> Multi-factor governance score: 60% Corporate Governance + 40% Forensic Solvency metrics.`;
        screenEvidenceHtml = `<strong>Portfolio Mechanics:</strong> Enforces a 25% single-sector cap with +/- 2.5% buffer bands to eliminate churn.`;
        takeawayHtml = `<strong>Mathematical Guarantee:</strong> Eliminates disproportionate skew from mega-cap enterprise concentration.`;
      } else {
        if (matchedTopic) {
          directAnswerHtml = `<strong>Plain English Concept:</strong> ${matchedTopic.concept}`;
          screenEvidenceHtml = `<strong>Visible On Your Screen:</strong> "${escapeHtml(bestSentence.slice(0, 170))}..."`;
          takeawayHtml = `<strong>Why It Matters:</strong> ${matchedTopic.screenContext}`;
        } else {
          directAnswerHtml = `<strong>Overview:</strong> Defines structural forensic rules and institutional research standards for <strong>${escapeHtml(title)}</strong>.`;
          screenEvidenceHtml = `<strong>Context Excerpt:</strong> "${escapeHtml(bestSentence.slice(0, 170))}..."`;
          takeawayHtml = `<strong>Forensic Watchout:</strong> Designed for rapid institutional vetting without promotional or speculative bias.`;
        }
      }
    }

    // Formulate optimized DuckDuckGo search queries
    let ddgSearchTerm = "";
    if (cleanQuery) {
      ddgSearchTerm = `${cleanQuery} Indian financial markets corporate governance SEBI`;
    } else if (matchedTopic) {
      ddgSearchTerm = `${matchedTopic.terms[0]} corporate governance Indian financial markets SEBI`;
    } else {
      ddgSearchTerm = `${title} corporate governance India stock market`;
    }

    const ddgAiUrl = `https://duckduckgo.com/?q=${encodeURIComponent(ddgSearchTerm)}&ia=chat`;
    const ddgWebUrl = `https://duckduckgo.com/?q=${encodeURIComponent(ddgSearchTerm)}`;

    const ddgActionBarHtml = `
      <div class="doubt-ddg-bar">
        <span class="doubt-ddg-bar-label">
          <span class="ddg-icon">🦆</span> DUCKDUCKGO ENGINE:
        </span>
        <div class="doubt-ddg-actions">
          <a href="${ddgAiUrl}" target="_blank" rel="noopener noreferrer" class="doubt-ddg-btn doubt-ddg-btn-ai" title="Ask DuckDuckGo AI Chat with full financial context">
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

    return `
      ${questionEchoHtml}
      <div class="doubt-output-section">
        <div class="doubt-output-header">1. CORE CONCEPT · DUCKDUCKGO SYNTHESIS</div>
        <div class="doubt-output-body">${directAnswerHtml}</div>
      </div>
      <div class="doubt-output-section">
        <div class="doubt-output-header">2. VISIBLE EVIDENCE &amp; CONTEXT</div>
        <div class="doubt-output-body">${screenEvidenceHtml}</div>
      </div>
      <div class="doubt-output-takeaway">
        ${takeawayHtml}
      </div>
      ${ddgActionBarHtml}
    `;
  }

  function executeDoubtQuery() {
    try {
      if (!currentDoubtContext) {
        currentDoubtContext = getVisibleScreenTarget();
      }
      const query = doubtTextInput ? doubtTextInput.value.trim() : "";
      const currentId = ++activeQueryId;
      
      // Active feedback on button
      if (doubtAskBtn) {
        doubtAskBtn.textContent = "Analyzing... 🦆";
        doubtAskBtn.disabled = true;
      }

      setTimeout(async () => {
        try {
          const resultHtml = synthesizeDoubtAnswer(query, activeDoubtMode, currentDoubtContext);
          renderDoubtAnswer(resultHtml);

          // If user asked a specific query, attempt async DuckDuckGo web enrichment
          if (query && query.length >= 2) {
            const webData = await fetchDuckDuckGoWebDefinition(query);
            if (currentId === activeQueryId && webData && doubtOutput) {
              const liveSection = document.createElement("div");
              liveSection.className = "doubt-output-section doubt-web-enrichment";
              liveSection.innerHTML = `
                <div class="doubt-output-header">🦆 DUCKDUCKGO WEB DEFINITION: ${escapeHtml(webData.title).toUpperCase()}</div>
                <div class="doubt-output-body">${escapeHtml(webData.extract.slice(0, 320))}...</div>
              `;
              const ddgBar = doubtOutput.querySelector(".doubt-ddg-bar");
              if (ddgBar) {
                doubtOutput.insertBefore(liveSection, ddgBar);
              } else {
                doubtOutput.appendChild(liveSection);
              }
            }
          }
        } finally {
          if (doubtAskBtn) {
            doubtAskBtn.textContent = "Ask DDG ↵";
            doubtAskBtn.disabled = false;
          }
        }
      }, 60);
    } catch (err) {
      console.error("[DoubtSolver] executeDoubtQuery error:", err);
      if (doubtAskBtn) {
        doubtAskBtn.textContent = "Ask DDG ↵";
        doubtAskBtn.disabled = false;
      }
    }
  }

  function renderDoubtAnswer(html) {
    doubtOutput.innerHTML = html;
  }

  doubtCloseBtn.addEventListener("click", closeDoubtSolver);

  doubtAskBtn.addEventListener("click", () => {
    executeDoubtQuery();
  });

  doubtTextInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeDoubtQuery();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeDoubtSolver();
    }
  });

  doubtChips.forEach(chip => {
    chip.addEventListener("click", () => {
      doubtChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeDoubtMode = chip.getAttribute("data-mode") || "explain";
      executeDoubtQuery();
    });
  });

  document.addEventListener("mousedown", (e) => {
    if (!doubtTile.classList.contains("is-open")) return;
    if (!doubtTile.contains(e.target) && !doubtPill.contains(e.target)) {
      closeDoubtSolver();
    }
  });
});
