/**
 * IndexIndia (Firm D) — Core Institutional Interactions
 * Zero-bloat, lightweight vanilla JS across all modular pages.
 */

// Level 3 Forensic Telemetry & Error Buffer (global, single-bind guard)
window.__indexIndiaErrors = window.__indexIndiaErrors || [];
if (!window.__indexIndiaTelemetryBound) {
  window.__indexIndiaTelemetryBound = true;
  window.addEventListener("error", (event) => {
    try {
      window.__indexIndiaErrors.push({
        type: "Uncaught Exception",
        message: event.message || String(event),
        source: `${event.filename || "inline"}:${event.lineno || 0}:${event.colno || 0}`,
        time: new Date().toLocaleTimeString("en-IN", { hour12: false })
      });
      if (typeof window.refreshTelemetryDisplay === "function") window.refreshTelemetryDisplay();
    } catch (_) {}
  });
  window.addEventListener("unhandledrejection", (event) => {
    try {
      window.__indexIndiaErrors.push({
        type: "Unhandled Promise Rejection",
        message: event.reason ? (event.reason.stack || event.reason.message || String(event.reason)) : "Unknown rejection",
        source: "Promise",
        time: new Date().toLocaleTimeString("en-IN", { hour12: false })
      });
      if (typeof window.refreshTelemetryDisplay === "function") window.refreshTelemetryDisplay();
    } catch (_) {}
  });
  const _origConsoleErr = console.error;
  console.error = function(...args) {
    try {
      window.__indexIndiaErrors.push({
        type: "console.error",
        message: args.map((a) => (typeof a === "object" ? (a?.stack || JSON.stringify(a)) : String(a))).join(" "),
        source: "Console",
        time: new Date().toLocaleTimeString("en-IN", { hour12: false })
      });
      if (typeof window.refreshTelemetryDisplay === "function") window.refreshTelemetryDisplay();
    } catch (_) {}
    _origConsoleErr.apply(console, args);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  // ================= 1. PAGE CONTEXT & VIEW DETECTION =================
  const pathname = window.location.pathname.toLowerCase();
  const currentFile = pathname.split("/").pop() || "guide.html";
  const isGuideSuite = true;
  const isIndexSuite = false;

  // Forward declarations for Doubt Solver, Top Nav Search & Top-Center Utility Bars
  let toggleDoubtSolver = function() {};
  let openDoubtSolver = function() {};
  let closeDoubtSolver = function() {};
  let focusNavSearchBar = function() {};
  let closeNavSearchResults = function() {};
  let clearFinderHighlights = function() {};
  let nextFinderMatch = function() {};
  let prevFinderMatch = function() {};
  let isFinderActive = function() { return false; };
  let toggleAnnotationPanel = function() {};
  let openAnnotationPanel = function() {};
  let closeAnnotationPanel = function() {};
  let isAnnotationPanelActive = function() { return false; };
  let toggleTopBar = function() {};
  let hideTopBar = function() {};
  let showTopBar = function() {};
  let isTopBarHidden = function() { return false; };
  let registerTopFloatingBar = function() {};
  let openTopFloatingBar = function() {};
  let closeTopFloatingBar = function() {};
  let toggleTopFloatingBar = function() {};
  let closeAllTopFloatingBars = function() {};
  let hideTopFloatingHoverPreview = function() {};
  let pinTopFloatingBar = function() {};
  let syncAllShortcutToolBarsUI = function() {};
  let setGridSizePx = function() {};

  // Global Annotation Storage State (hoisted to prevent TDZ errors in account panel)
  const ANNOTATION_STORAGE_KEY = `indexindia_annotations_${window.location.pathname.replace(/\/$/, "") || "/"}`;
  let annotationsData = {
    version: 1,
    strokes: [],
    textboxes: [],
    stickynotes: [],
    highlights: [],
    stickers: []
  };

  // ================= 2. LEFT RAIL & DIRECTORY TREE NAVIGATION =================
  const railNavigator = document.getElementById("rail-navigator");
  const railTrack = document.getElementById("rail-track");
  const railTreePanel = document.getElementById("rail-tree-panel");
  const treeContentScroll = document.getElementById("tree-content-scroll");
  let treeNodes = Array.from(document.querySelectorAll(".tree-node"));
  let tickMarks = Array.from(document.querySelectorAll(".tick-mark"));
  const btnPinTree = document.getElementById("btn-pin-tree");
  const btnCloseTree = document.getElementById("btn-close-tree");
  const treeScrubStrip = document.getElementById("tree-scrub-strip");
  const treeScrubIndicator = document.getElementById("tree-scrub-indicator");
  const railTreeStatus = document.getElementById("rail-tree-status");
  let hasInPageTree = false;
  let currentSubIndex = 0;
  let updateSectionOffsets = function() {};
  let rebindTreeAndTicksEvents = function() {};

  // Helper to resolve icon from section title keywords
  function getSmartIconForTitle(title) {
    const lower = (title || "").toLowerCase();
    if (lower.includes("audit") || lower.includes("checklist") || lower.includes("caro")) return "📋";
    if (lower.includes("portal") || lower.includes("filing") || lower.includes("mca")) return "📜";
    if (lower.includes("matrix") || lower.includes("performance") || lower.includes("index")) return "📊";
    if (lower.includes("ratio") || lower.includes("cap") || lower.includes("table") || lower.includes("bse") || lower.includes("nse")) return "📈";
    if (lower.includes("database") || lower.includes("drhp") || lower.includes("sebi")) return "📖";
    if (lower.includes("tender") || lower.includes("gem") || lower.includes("procurement")) return "🗄️";
    if (lower.includes("tax") || lower.includes("contingent") || lower.includes("warning") || lower.includes("risk")) return "⚠️";
    if (lower.includes("cash") || lower.includes("burn") || lower.includes("liquidity")) return "💸";
    if (lower.includes("pledge") || lower.includes("spiral")) return "📉";
    if (lower.includes("cycle") || lower.includes("vesting") || lower.includes("timeline")) return "⏱️";
    if (lower.includes("tech") || lower.includes("nre")) return "⚙️";
    if (lower.includes("trl") || lower.includes("sovereign")) return "🚀";
    if (lower.includes("moat") || lower.includes("homologation") || lower.includes("compliance")) return "🛡️";
    if (lower.includes("comment") || lower.includes("stream") || lower.includes("forum")) return "💬";
    if (lower.includes("disclaimer")) return "📑";
    return "📄";
  }

  // Auto-generate directory tree by scanning core section names or direct semantic div classes
  function autoBuildDirectoryTree() {
    if (!treeContentScroll) return false;

    // If HTML already provides curated manual tree nodes (such as guide.html), NEVER overwrite them!
    const existingCuratedNodes = treeContentScroll.querySelectorAll(".tree-node");
    if (existingCuratedNodes.length > 0) {
      return false;
    }

    const contentRoot = document.querySelector(".content-area") || document.querySelector("main") || document.querySelector("article");
    if (!contentRoot) return false;

    // Pattern to match hierarchical section numbering: e.g. 1.1, 1.1.1, 01.1, 01.1.2, 1.2.1, 01, 1, etc.
    const SEC_NUM_REGEX = /(?:^|\s|[(\[{])(?:Section\s+)?(\d+(?:\.\d+)+|\d{1,2})\s*(?:[—–\-:.)\]}]*\s*)(.*)/i;
    // Unicode emoji pattern at the beginning of headings
    const EMOJI_PREFIX_REGEX = /^([\p{Extended_Pictographic}\u2600-\u27bf\u2300-\u23ff\u2b50\u2b55\uFE0F\u200D]+)\s*/u;

    // Scan candidate elements in contentRoot in DOM tree order:
    // Supports semantic classes (.doc-module, .doc-section, .doc-subsection, .doc-subsubsection, etc.)
    // as well as headings and legacy section wrappers.
    const elements = Array.from(contentRoot.querySelectorAll(
      ".doc-module, .doc-act, .story-act-divider, .module-divider, .doc-section, .doc-subsection, .doc-subsubsection, .tree-section, .tree-subsection, .story-node-section, .page-directory-section, .forum-directory-section, .institutional-forum-section, h1, h2, h3, h4, h5, h6, .story-section-title, .forum-title, [class*='section-title'], [data-node-idx]"
    ));

    const items = [];
    const processedEls = new Set();
    const seenIds = new Set();

    elements.forEach((el) => {
      if (processedEls.has(el)) return;

      // 1. MODULE / ACT DIVIDER DETECTION (.doc-module, .doc-act, .story-act-divider, etc.)
      if (el.classList.contains("doc-module") || el.classList.contains("doc-act") || el.classList.contains("story-act-divider") || el.classList.contains("module-divider")) {
        processedEls.add(el);
        const titleEl = el.querySelector(".module-title, .doc-module-title, .story-act-title") || el.querySelector("h2, h3") || el;
        el.querySelectorAll(".module-title, .doc-module-title, .story-act-title, h1, h2, h3, h4, span").forEach((child) => processedEls.add(child));
        let rawTitle = (el.getAttribute("data-module-title") || titleEl.textContent).trim().replace(/\s+/g, " ");
        rawTitle = rawTitle.replace(/\[.*?\]/g, "").trim();
        items.push({
          type: "module",
          title: rawTitle.toUpperCase(),
          el: el
        });
        return;
      }

      // 2. EXPLICIT SEMANTIC SECTION / SUBSECTION DIV DETECTION
      // Supports .doc-section, .doc-subsection, .doc-subsubsection, .tree-section, .tree-subsection
      const isExplicitSec = el.classList.contains("doc-section") ||
                            el.classList.contains("doc-subsection") ||
                            el.classList.contains("doc-subsubsection") ||
                            el.classList.contains("tree-section") ||
                            el.classList.contains("tree-subsection");

      if (isExplicitSec) {
        processedEls.add(el);

        // Find title element and number element within this section
        const titleEl = el.querySelector(".section-title, .subsection-title, .subsubsection-title, .doc-title") ||
                        el.querySelector("h1, h2, h3, h4, h5, h6");
        const numEl = el.querySelector(".section-number, .subsection-number, .subsubsection-number, .sec-num, .doc-num");

        let rawTitle = (el.getAttribute("data-section-title") || (titleEl ? titleEl.textContent : "")).trim().replace(/\s+/g, " ");
        let num = (el.getAttribute("data-section-num") || (numEl ? numEl.textContent : "")).trim();

        // Mark direct heading / number elements as processed so they don't trigger secondary heading scan
        if (titleEl) processedEls.add(titleEl);
        if (numEl) processedEls.add(numEl);
        el.querySelectorAll(".section-header, .subsection-header, .subsubsection-header, .story-section-meta").forEach((h) => {
          h.querySelectorAll("h1, h2, h3, h4, h5, h6, span").forEach((c) => processedEls.add(c));
        });

        // If number not in data attribute or .section-number, test regex on title or el
        if (!num) {
          const numMatch = rawTitle.match(SEC_NUM_REGEX);
          if (numMatch) {
            num = numMatch[1];
            rawTitle = numMatch[2].trim();
          }
        }

        // Clean icon
        let icon = el.getAttribute("data-icon") || "";
        const emojiMatch = rawTitle.match(EMOJI_PREFIX_REGEX);
        if (emojiMatch) {
          if (!icon) icon = emojiMatch[1];
          rawTitle = rawTitle.slice(emojiMatch[0].length).trim();
        }

        // Strip leading dashes or colons
        let cleanTitle = rawTitle.replace(/^[—–\-:.)\]}]\s*/, "").trim();

        if (num || cleanTitle) {
          const displayNum = num || String(items.length + 1);

          let targetId = el.id;
          if (!targetId) {
            targetId = "sec-" + displayNum.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
            el.id = targetId;
          }
          let uniqueId = targetId;
          let counter = 2;
          while (seenIds.has(uniqueId)) {
            uniqueId = `${targetId}-${counter++}`;
          }
          seenIds.add(uniqueId);
          el.id = uniqueId;

          // Determine explicit level
          let explicitLevel = parseInt(el.getAttribute("data-level"), 10);
          if (isNaN(explicitLevel)) {
            if (el.classList.contains("doc-subsubsection") || el.classList.contains("tree-subsubsection")) {
              explicitLevel = 3;
            } else if (el.classList.contains("doc-subsection") || el.classList.contains("tree-subsection")) {
              explicitLevel = 2;
            } else if (el.classList.contains("doc-section") || el.classList.contains("tree-section")) {
              explicitLevel = 1;
            }
          }

          if (!icon) {
            icon = getSmartIconForTitle(cleanTitle);
          }

          const numParts = displayNum.split(".");
          items.push({
            type: "node",
            id: uniqueId,
            num: displayNum,
            title: cleanTitle,
            displayName: cleanTitle ? `${displayNum} ${cleanTitle}` : displayNum,
            icon: icon,
            dots: numParts.length - 1,
            numPartsLength: numParts.length,
            explicitLevel: !isNaN(explicitLevel) ? explicitLevel : null,
            el: el,
            parentSec: el
          });
          return;
        }
      }

      // 3. BACKWARD-COMPATIBLE HEADING REGEX SCAN
      let rawText = el.textContent.trim().replace(/\s+/g, " ");
      let icon = "";
      const emojiMatch = rawText.match(EMOJI_PREFIX_REGEX);
      if (emojiMatch) {
        icon = emojiMatch[1];
        rawText = rawText.slice(emojiMatch[0].length).trim();
      }

      const numMatch = rawText.match(SEC_NUM_REGEX);
      if (numMatch) {
        processedEls.add(el);
        const parentSec = el.closest("section") || el.closest(".doc-section, .story-node-section, .page-directory-section, .forum-directory-section");
        if (parentSec) {
          parentSec.querySelectorAll("h1, h2, h3, h4, h5, h6, .story-section-title, .forum-title, [class*='section-title']").forEach((child) => processedEls.add(child));
        }

        const num = numMatch[1];
        let title = numMatch[2].trim();
        // Remove leading dashes/colons if any
        title = title.replace(/^[—–\-:.)\]}]\s*/, "").trim();

        // Determine anchor target ID
        let targetId = (parentSec && parentSec.id) ? parentSec.id : el.id;
        if (!targetId) {
          targetId = "sec-" + num.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
          if (parentSec) {
            parentSec.id = targetId;
          } else {
            el.id = targetId;
          }
        }

        // Ensure unique targetId
        let uniqueId = targetId;
        let counter = 2;
        while (seenIds.has(uniqueId)) {
          uniqueId = `${targetId}-${counter++}`;
        }
        seenIds.add(uniqueId);
        if (parentSec) parentSec.id = uniqueId; else el.id = uniqueId;

        // Extract explicit data-level if provided
        const explicitLevel = parseInt(el.getAttribute("data-level") || (parentSec ? parentSec.getAttribute("data-level") : null), 10);

        // Smart icon fallback if no emoji was in text
        if (!icon) {
          icon = getSmartIconForTitle(title);
        }

        const numParts = num.split(".");
        items.push({
          type: "node",
          id: uniqueId,
          num: num,
          title: title,
          displayName: title ? `${num} ${title}` : num,
          icon: icon,
          dots: numParts.length - 1,
          numPartsLength: numParts.length,
          explicitLevel: !isNaN(explicitLevel) ? explicitLevel : null,
          el: el,
          parentSec: parentSec
        });
      }
    });

    const nodeItems = items.filter((it) => it.type === "node");

    // Graceful fallback: If page does NOT have numbered sections, don't destroy manual links
    if (nodeItems.length < 2) {
      return false;
    }

    // Calculate nesting levels dynamically based on dot count / segments
    const minParts = Math.min(...nodeItems.map((n) => n.numPartsLength));
    nodeItems.forEach((n) => {
      if (n.explicitLevel) {
        n.level = n.explicitLevel;
      } else {
        n.level = Math.min(Math.max((n.numPartsLength - minParts) + 1, 1), 4);
      }
    });

    // Check signature to avoid unnecessary DOM re-renders if tree content has not changed
    const signature = items.map((it) => it.type === "module" ? `M:${it.title}` : `N:${it.id}:${it.num}:${it.title}:${it.level}:${it.icon}`).join("|");
    if (signature === autoBuildDirectoryTree.lastSignature) {
      return false;
    }
    autoBuildDirectoryTree.lastSignature = signature;

    // Helper for tree branch guides: ├──, └── (first line | bars removed; chapters are main sections)
    function getTreeGuide(level, isLastInBranch) {
      if (level === 1) {
        return "";
      } else {
        return isLastInBranch ? "└──" : "├──";
      }
    }

    // Build the HTML for the Directory Tree
    let treeHtml = "";
    let nodeCounter = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type === "module") {
        if (!item.title.toUpperCase().includes("DIRECTORY TREE HIERARCHY")) {
          treeHtml += `<div class="tree-section-header">${item.title}</div>\n`;
        }
      } else {
        const idx = nodeCounter++;
        let isLastInBranch = true;
        for (let j = i + 1; j < items.length; j++) {
          const next = items[j];
          if (next.type === "module") {
            isLastInBranch = true;
            break;
          }
          if (next.level < item.level) {
            isLastInBranch = true;
            break;
          }
          if (next.level === item.level) {
            isLastInBranch = false;
            break;
          }
          if (next.level > item.level) {
            isLastInBranch = false;
            break;
          }
        }

        const guide = getTreeGuide(item.level, isLastInBranch);
        const guideHtml = guide ? `  <span class="tree-guide font-mono">${guide}</span>\n` : "";
        const badge = String(idx + 1).padStart(2, "0");
        const activeClass = idx === currentSubIndex ? " active" : "";
        const chapterClass = item.level === 1 ? " tree-chapter-node" : " tree-subtopic-node";

        treeHtml += `<a href="#${item.id}" class="tree-node${chapterClass}${activeClass}" data-index="${idx}" data-level="${item.level}">
${guideHtml}  <span class="tree-name font-mono">${item.displayName}</span>
  <span class="tree-badge font-mono">${badge}</span>
</a>\n`;
      }
    }

    // Update #tree-content-scroll
    treeContentScroll.innerHTML = treeHtml;

    // Build matching ticks for #rail-ticks
    const railTicks = document.getElementById("rail-ticks");
    if (railTicks) {
      let ticksHtml = "";
      nodeItems.forEach((node, idx) => {
        const activeClass = idx === currentSubIndex ? " active" : "";
        ticksHtml += `<div class="tick-mark${activeClass}" data-index="${idx}" title="${node.displayName}"></div>\n`;
      });
      railTicks.innerHTML = ticksHtml;
    }

    // Rebind elements and event listeners
    treeNodes = Array.from(document.querySelectorAll("#tree-content-scroll .tree-node"));
    tickMarks = Array.from(document.querySelectorAll("#rail-ticks .tick-mark"));
    hasInPageTree = treeNodes.some((n) => (n.getAttribute("href") || "").startsWith("#"));

    if (typeof rebindTreeAndTicksEvents === "function") {
      rebindTreeAndTicksEvents();
    }
    return true;
  }

  // Run initial auto-build if page has numbered sections
  autoBuildDirectoryTree();

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
  currentSubIndex = activeNodeIdx;


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
      railTreeStatus.textContent = `SECTION ${curr}/${total}`;
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
    if (window.innerWidth <= 1280 && typeof closeDoubtSolver === "function" && document.body.classList.contains("gemini-permanent")) {
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

    const navTreeBtn = document.getElementById("nav-tree-toggle-btn");
    if (navTreeBtn) navTreeBtn.classList.add("is-active");

    if (isPinned) {
      document.body.classList.add("tree-permanent");
    }

    if (btnPinTree) {
      btnPinTree.classList.toggle("is-active", isPinned);
      btnPinTree.setAttribute("aria-pressed", isPinned ? "true" : "false");
    }
    updateTreeTelemetryUI();
    scrollTreeToNode(treeNodes[currentSubIndex]);
  }

  function closeTreeExplicitly() {
    isPinned = false;
    document.body.classList.remove("tree-permanent");
    if (railLeaveTimer) clearTimeout(railLeaveTimer);

    if (railNavigator) {
      railNavigator.classList.remove("is-open", "is-pinned");
      railNavigator.classList.add("is-closed");
    }
    if (railTrack) railTrack.classList.remove("is-hidden");
    if (railTreePanel) railTreePanel.classList.remove("is-open");

    const navTreeBtn = document.getElementById("nav-tree-toggle-btn");
    if (navTreeBtn) navTreeBtn.classList.remove("is-active");

    if (btnPinTree) {
      btnPinTree.classList.remove("is-active");
      btnPinTree.setAttribute("aria-pressed", "false");
    }
  }

  function toggleTree(forceState) {
    let shouldOpen = typeof forceState === "boolean" ? forceState : !isPinned;
    if (shouldOpen) {
      openTreeExplicitly(true);
    } else {
      closeTreeExplicitly();
    }
  }

  function openRailPanel() {
    if (isPinned) return;
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

  function closeRailPanel(delay = 180) {
    if (isPinned) return;
    if (railLeaveTimer) clearTimeout(railLeaveTimer);
    railLeaveTimer = setTimeout(() => {
      const isNavHovered = railNavigator && railNavigator.matches(":hover");
      const isPanelHovered = railTreePanel && railTreePanel.matches(":hover");
      if (!isNavHovered && !isPanelHovered && !isPinned) {
        if (railNavigator) railNavigator.classList.remove("is-open");
        if (railTrack) railTrack.classList.remove("is-hidden");
        if (railTreePanel) railTreePanel.classList.remove("is-open");
        const navTreeBtn = document.getElementById("nav-tree-toggle-btn");
        if (navTreeBtn && !isPinned) navTreeBtn.classList.remove("is-active");
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

  // Close Directory Tree when clicking outside (only if in hover/preview mode, NOT if permanently pinned)
  document.addEventListener("mousedown", (e) => {
    if (!isTreeCurrentlyOpen() || isPinned) return;
    const navTreeBtn = document.getElementById("nav-tree-toggle-btn");
    if (
      railNavigator &&
      !railNavigator.contains(e.target) &&
      (!navTreeBtn || !navTreeBtn.contains(e.target))
    ) {
      closeTreeExplicitly();
    }
  });

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

  if (railTreePanel) {
    railTreePanel.addEventListener("mouseenter", openRailPanel);
    railTreePanel.addEventListener("mouseleave", () => closeRailPanel(250));
  }

  // Dynamic ScrollSpy for in-page section anchors
  let scrollSpyScheduled = false;
  let sectionTargets = [];

  updateSectionOffsets = function() {
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
  };

  function runScrollSpy() {
    scrollSpyScheduled = false;
    if (!hasInPageTree || sectionTargets.length === 0) return;
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

  window.addEventListener("resize", () => {
    if (typeof updateSectionOffsets === "function") updateSectionOffsets();
  }, { passive: true });

  window.addEventListener("scroll", () => {
    if (!scrollSpyScheduled) {
      scrollSpyScheduled = true;
      requestAnimationFrame(runScrollSpy);
    }
  }, { passive: true });

  // Re-bind click and hover listeners to tree nodes and rail ticks
  rebindTreeAndTicksEvents = function() {
    treeNodes = Array.from(document.querySelectorAll("#tree-content-scroll .tree-node"));
    tickMarks = Array.from(document.querySelectorAll("#rail-ticks .tick-mark"));
    hasInPageTree = treeNodes.some((n) => (n.getAttribute("href") || "").startsWith("#"));

    if (currentSubIndex >= treeNodes.length) {
      currentSubIndex = Math.max(0, treeNodes.length - 1);
    }

    treeNodes.forEach((node, idx) => {
      node.onclick = (e) => {
        const href = node.getAttribute("href") || "";
        if (href.startsWith("#")) {
          e.preventDefault();
          navigateToNode(idx);
        } else {
          highlightTreeNode(idx);
        }
      };
    });

    tickMarks.forEach((tick, i) => {
      tick.onmouseenter = openRailPanel;
      tick.onclick = (e) => {
        e.stopPropagation();
        const targetNodeIdx = Math.round((i / Math.max(tickMarks.length - 1, 1)) * (treeNodes.length - 1));
        navigateToNode(targetNodeIdx);
      };
    });

    updateSectionOffsets();
    updateTreeTelemetryUI();
    highlightTreeNode(currentSubIndex);
  };

  // Perform initial binding
  rebindTreeAndTicksEvents();

  // MutationObserver: automatically detects when sections/content change in the webpage
  let autoTreeDebounceTimer = null;
  function observeContentChanges() {
    const target = document.querySelector(".content-area") || document.querySelector("main");
    if (!target || typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver((mutations) => {
      let hasRelevantMutation = false;
      for (const m of mutations) {
        if (m.type === "childList") {
          hasRelevantMutation = true;
          break;
        }
        if (m.type === "characterData") {
          const parent = m.target.parentElement;
          if (parent && (parent.closest("h1, h2, h3, h4, h5, h6, .story-section-title, .forum-title, .story-act-divider") || parent.matches("h1, h2, h3, h4, h5, h6"))) {
            hasRelevantMutation = true;
            break;
          }
        }
      }

      if (!hasRelevantMutation) return;

      if (autoTreeDebounceTimer) clearTimeout(autoTreeDebounceTimer);
      autoTreeDebounceTimer = setTimeout(() => {
        if (!treeContentScroll || treeContentScroll.querySelectorAll(".tree-node").length === 0) {
          autoBuildDirectoryTree();
        }
        if (typeof injectSectionDoubtButtons === "function") {
          injectSectionDoubtButtons();
        }
      }, 150);
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  observeContentChanges();

  // Expose global methods for manual refresh if needed
  window.autoBuildDirectoryTree = autoBuildDirectoryTree;
  window.refreshDirectoryTree = autoBuildDirectoryTree;


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

  // ================= 3. TOP-CENTER FLOATING UTILITY BARS SYSTEM =================
  function escFloatHtml(str) {
    return String(str || "").replace(/[&<>'"]/g, (tag) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "\"": "&quot;"
    }[tag] || tag));
  }

  function makeFloatingBarDraggable(barEl, handleSelector = ".palette-drag-handle") {
    if (!barEl) return;
    const handle = barEl.querySelector(handleSelector);
    if (!handle || handle.dataset.dragBound === "1") return;
    handle.dataset.dragBound = "1";

    let isDraggingBar = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    handle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest("button, input, textarea, select, a, label")) return;
      isDraggingBar = true;
      const rect = barEl.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      barEl.classList.add("is-dragging-bar");
      barEl.style.transform = "none";
      barEl.style.left = `${rect.left}px`;
      barEl.style.top = `${rect.top}px`;
      e.preventDefault();
    });

    handle.addEventListener("pointermove", (e) => {
      if (!isDraggingBar) return;
      const maxX = Math.max(10, window.innerWidth - barEl.offsetWidth - 10);
      const maxY = Math.max(10, window.innerHeight - barEl.offsetHeight - 10);
      const nextX = Math.max(10, Math.min(maxX, e.clientX - dragOffsetX));
      const nextY = Math.max(10, Math.min(maxY, e.clientY - dragOffsetY));
      barEl.style.left = `${nextX}px`;
      barEl.style.top = `${nextY}px`;
    });

    const stopBarDrag = (e) => {
      if (isDraggingBar) {
        isDraggingBar = false;
        barEl.classList.remove("is-dragging-bar");
        try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };
    handle.addEventListener("pointerup", stopBarDrag);
    handle.addEventListener("pointercancel", stopBarDrag);
  }

  const TopCenterFloatingManager = (() => {
    const entries = new Map();
    const leaveTimers = new Map();
    let pinnedBarId = null;
    let hoverBarId = null;
    let suppressedHoverId = null;

    function resetBarPosition(barEl) {
      if (!barEl) return;
      if (!barEl.style.left && !barEl.style.top && !barEl.style.transform) return;
      barEl.classList.add("is-dragging-bar");
      barEl.style.left = "";
      barEl.style.top = "";
      barEl.style.transform = "";
      void barEl.offsetWidth;
      barEl.classList.remove("is-dragging-bar");
    }

    function clearTimer(id) {
      const t = leaveTimers.get(id);
      if (t) {
        clearTimeout(t);
        leaveTimers.delete(id);
      }
    }

    function getAliasShortcutBtn(id) {
      return document.getElementById(`pinned-shortcut-${id}`);
    }

    function syncAliasShortcutBtn(id, { active = false, previewing = false } = {}) {
      const aliasBtn = getAliasShortcutBtn(id);
      if (!aliasBtn) return;
      aliasBtn.classList.toggle("is-active", Boolean(active));
      aliasBtn.classList.toggle("is-previewing", Boolean(previewing));
    }

    function isCursorInsideEntry(entry) {
      if (!entry) return false;
      if (entry.bar && entry.bar.matches(":hover")) return true;
      if (entry.wrapper && entry.wrapper.matches(":hover")) return true;
      if (entry.btn && entry.btn.matches(":hover")) return true;
      const aliasBtn = getAliasShortcutBtn(entry.id);
      if (aliasBtn && aliasBtn.matches(":hover")) return true;
      if (Array.isArray(entry.extraHoverSelectors)) {
        for (const sel of entry.extraHoverSelectors) {
          const el = document.querySelector(sel);
          if (el && el.matches(":hover")) return true;
        }
      }
      return false;
    }

    function closeEntry(id, { suppressHover = false } = {}) {
      clearTimer(id);
      const entry = entries.get(id);
      if (!entry) return;
      const wasVisible = Boolean(
        (entry.bar && entry.bar.classList.contains("is-visible")) ||
        pinnedBarId === id ||
        hoverBarId === id
      );
      if (pinnedBarId === id) pinnedBarId = null;
      if (hoverBarId === id) hoverBarId = null;
      if (suppressHover) suppressedHoverId = id;

      if (entry.bar) {
        entry.bar.classList.remove("is-visible", "is-previewing", "is-pinned");
      }
      if (entry.btn) {
        entry.btn.classList.remove("is-active", "is-previewing");
      }
      syncAliasShortcutBtn(id, { active: false, previewing: false });
      if (entry.wrapper) {
        entry.wrapper.classList.remove("is-open");
      }
      if (wasVisible && typeof entry.onClose === "function") {
        entry.onClose();
      }
    }

    function hideHoverPreview() {
      if (hoverBarId && hoverBarId !== pinnedBarId) {
        closeEntry(hoverBarId, { suppressHover: false });
      }
    }

    function showHoverPreview(id) {
      if (pinnedBarId !== null) return;
      if (suppressedHoverId === id) return;
      if (document.querySelector(".panel-trigger-wrapper.is-dragging")) return;

      const entry = entries.get(id);
      if (!entry || !entry.bar) return;

      const customizerBar = document.getElementById("shortcut-customizer-bar");
      if (customizerBar && customizerBar.classList.contains("is-visible")) {
        customizerBar.classList.remove("is-visible");
      }

      clearTimer(id);
      if (hoverBarId && hoverBarId !== id) {
        closeEntry(hoverBarId, { suppressHover: false });
      }

      const wasHidden = !entry.bar.classList.contains("is-visible");
      if (wasHidden) {
        resetBarPosition(entry.bar);
      }

      hoverBarId = id;
      entry.bar.classList.add("is-visible", "is-previewing");
      entry.bar.classList.remove("is-pinned");
      if (entry.btn) {
        entry.btn.classList.add("is-previewing");
        entry.btn.classList.remove("is-active");
      }
      syncAliasShortcutBtn(id, { active: false, previewing: true });
      if (typeof entry.onPreview === "function") {
        entry.onPreview();
      }
    }

    function scheduleLeave(id) {
      clearTimer(id);
      leaveTimers.set(id, setTimeout(() => {
        leaveTimers.delete(id);
        if (pinnedBarId === id) return;
        const entry = entries.get(id);
        if (!entry) return;
        if (isCursorInsideEntry(entry)) return;
        if (hoverBarId === id) {
          closeEntry(id, { suppressHover: false });
        }
      }, 300));
    }

    function pin(id, fromInteraction = false) {
      const entry = entries.get(id);
      if (!entry || !entry.bar) return;

      const customizerBar = document.getElementById("shortcut-customizer-bar");
      if (customizerBar && customizerBar.classList.contains("is-visible")) {
        customizerBar.classList.remove("is-visible");
      }

      clearTimer(id);
      suppressedHoverId = null;

      if (pinnedBarId && pinnedBarId !== id) {
        closeEntry(pinnedBarId, { suppressHover: false });
      }
      if (hoverBarId && hoverBarId !== id) {
        closeEntry(hoverBarId, { suppressHover: false });
      }

      const promotedFromHover = entry.bar.classList.contains("is-visible");
      hoverBarId = null;
      pinnedBarId = id;

      if (!promotedFromHover) {
        resetBarPosition(entry.bar);
      }

      entry.bar.classList.add("is-visible", "is-pinned");
      entry.bar.classList.remove("is-previewing");
      if (entry.btn) {
        entry.btn.classList.add("is-active");
        entry.btn.classList.remove("is-previewing");
      }
      syncAliasShortcutBtn(id, { active: true, previewing: false });
      if (typeof entry.onPin === "function") {
        entry.onPin({ fromInteraction: Boolean(fromInteraction), promotedFromHover });
      }
    }

    function togglePin(id) {
      if (pinnedBarId === id) {
        const entry = entries.get(id);
        const triggerEl = entry && (entry.wrapper || entry.btn);
        const aliasBtn = getAliasShortcutBtn(id);
        const isHoveringTrigger = Boolean(
          (triggerEl && triggerEl.matches(":hover")) ||
          (aliasBtn && aliasBtn.matches(":hover"))
        );
        closeEntry(id, { suppressHover: isHoveringTrigger });
      } else {
        pin(id, false);
      }
    }

    function closeAll() {
      const curPinned = pinnedBarId;
      const curHover = hoverBarId;
      if (curPinned) closeEntry(curPinned, { suppressHover: false });
      if (curHover && curHover !== curPinned) closeEntry(curHover, { suppressHover: false });
    }

    function unregister(id) {
      clearTimer(id);
      if (pinnedBarId === id || hoverBarId === id) {
        closeEntry(id, { suppressHover: false });
      }
      entries.delete(id);
    }

    function register(config) {
      if (!config || !config.id) return;
      const id = config.id;
      const entry = {
        id,
        wrapper: config.wrapper || document.getElementById(config.wrapperId || ""),
        btn: config.btn || document.getElementById(config.btnId || ""),
        bar: config.bar || document.getElementById(config.barId || ""),
        closeBtnSelector: config.closeBtnSelector || ".palette-close-btn",
        extraHoverSelectors: config.extraHoverSelectors || [],
        onPreview: config.onPreview || null,
        onPin: config.onPin || null,
        onClose: config.onClose || null
      };
      entries.set(id, entry);

      const triggerEl = entry.wrapper || entry.btn;
      if (triggerEl && triggerEl.dataset.tcBound !== "1") {
        triggerEl.dataset.tcBound = "1";
        triggerEl.addEventListener("mouseenter", () => {
          showHoverPreview(id);
        });
        triggerEl.addEventListener("mouseleave", () => {
          if (suppressedHoverId === id) {
            suppressedHoverId = null;
          }
          if (pinnedBarId !== id && hoverBarId === id) {
            scheduleLeave(id);
          }
        });
      }

      if (config.bindClick !== false && entry.btn && entry.btn.dataset.tcClickBound !== "1") {
        entry.btn.dataset.tcClickBound = "1";
        entry.btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          togglePin(id);
        });
      }

      if (entry.bar && entry.bar.dataset.tcBarBound !== "1") {
        entry.bar.dataset.tcBarBound = "1";
        entry.bar.addEventListener("mouseenter", () => {
          clearTimer(id);
        });
        entry.bar.addEventListener("mouseleave", () => {
          if (pinnedBarId !== id && hoverBarId === id) {
            scheduleLeave(id);
          }
        });

        // Promoting hover preview to pinned immediately on inner interaction
        entry.bar.addEventListener("pointerdown", (e) => {
          const t = e.target instanceof Element ? e.target : e.target?.parentElement;
          if (t && entry.closeBtnSelector && t.closest(entry.closeBtnSelector)) return;
          if (pinnedBarId !== id) {
            pin(id, true);
          }
        });
        entry.bar.addEventListener("focusin", (e) => {
          const t = e.target instanceof Element ? e.target : e.target?.parentElement;
          if (t && entry.closeBtnSelector && t.closest(entry.closeBtnSelector)) return;
          if (pinnedBarId !== id && hoverBarId === id) {
            pin(id, true);
          }
        });
        entry.bar.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            if (document.activeElement && typeof document.activeElement.blur === "function") {
              document.activeElement.blur();
            }
            closeEntry(id, { suppressHover: false });
          }
        });

        const closeBtn = entry.bar.querySelector(entry.closeBtnSelector);
        if (closeBtn) {
          closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeEntry(id, { suppressHover: false });
          });
        }
      }
    }

    // Outside click ONLY closes an unpinned hover preview; NEVER closes a pinned bar
    document.addEventListener("pointerdown", (e) => {
      if (pinnedBarId !== null || !hoverBarId) return;
      const entry = entries.get(hoverBarId);
      if (!entry) return;
      const t = e.target instanceof Element ? e.target : e.target?.parentElement;
      if (!t) return;
      if (entry.bar && entry.bar.contains(t)) return;
      if (entry.wrapper && entry.wrapper.contains(t)) return;
      if (entry.btn && entry.btn.contains(t)) return;
      const aliasBtn = getAliasShortcutBtn(hoverBarId);
      if (aliasBtn && aliasBtn.contains(t)) return;
      if (Array.isArray(entry.extraHoverSelectors)) {
        for (const sel of entry.extraHoverSelectors) {
          if (t.closest(sel)) return;
        }
      }
      closeEntry(hoverBarId, { suppressHover: false });
    });

    return {
      register,
      unregister,
      pin,
      close: (id) => closeEntry(id, { suppressHover: false }),
      toggle: togglePin,
      closeAll,
      hideHoverPreview,
      showHoverPreview,
      scheduleLeave,
      clearSuppressedHover: (id) => {
        if (suppressedHoverId === id) suppressedHoverId = null;
      },
      getPinnedId: () => pinnedBarId,
      getHoverId: () => hoverBarId
    };
  })();

  registerTopFloatingBar = (cfg) => TopCenterFloatingManager.register(cfg);
  openTopFloatingBar = (id) => TopCenterFloatingManager.pin(id, false);
  pinTopFloatingBar = (id) => TopCenterFloatingManager.pin(id, false);
  closeTopFloatingBar = (id) => TopCenterFloatingManager.close(id);
  toggleTopFloatingBar = (id) => TopCenterFloatingManager.toggle(id);
  closeAllTopFloatingBars = () => TopCenterFloatingManager.closeAll();
  hideTopFloatingHoverPreview = () => TopCenterFloatingManager.hideHoverPreview();

  window.openTopFloatingBar = openTopFloatingBar;
  window.closeTopFloatingBar = closeTopFloatingBar;
  window.toggleTopFloatingBar = toggleTopFloatingBar;
  window.closeAllTopFloatingBars = closeAllTopFloatingBars;

  // --- Inject 4 Top-Center Utility Floating Bars (Contact, Shortcuts, Account, Settings) ---
  function ensureUtilityFloatingBars() {
    // 1. CONTACT US FLOATING BAR
    if (!document.getElementById("contact-floating-bar")) {
      const contactBar = document.createElement("div");
      contactBar.id = "contact-floating-bar";
      contactBar.className = "utility-floating-bar contact-floating-bar";
      contactBar.setAttribute("role", "dialog");
      contactBar.setAttribute("aria-label", "Contact Us & Resolution");
      contactBar.innerHTML = `
        <div class="utility-bar-header">
          <div class="utility-bar-title-wrap">
            <span class="palette-drag-handle" title="Drag Panel">
              <svg width="10" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2.5"/><circle cx="8" cy="12" r="2.5"/><circle cx="8" cy="20" r="2.5"/><circle cx="16" cy="4" r="2.5"/><circle cx="16" cy="12" r="2.5"/><circle cx="16" cy="20" r="2.5"/></svg>
            </span>
            <span class="utility-bar-title">[CONTACT US]</span>
          </div>
          <div class="utility-bar-meta-group">
            <span class="contact-inline-status" id="contact-inline-status" aria-live="polite"></span>
            <span class="contact-bar-email-pill" id="contact-auth-email-pill" style="display:none;"></span>
            <input type="email" class="contact-bar-email-input" id="contact-guest-email" placeholder="Reply email (optional)" autocomplete="email" spellcheck="false" />
            <button type="button" class="palette-close-btn" id="contact-bar-close-btn" data-hover-tag="[CLOSE]" aria-label="Close">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="contact-bar-body">
          <div class="contact-float-top-grid">
            <div class="contact-type-col" role="radiogroup" aria-label="Submission Type">
              <label class="contact-pill-option">
                <input type="radio" name="contact_float_type" id="contact-type-issue" value="Report an Issue" checked />
                <span class="contact-pill-btn">Report an Issue</span>
              </label>
              <label class="contact-pill-option">
                <input type="radio" name="contact_float_type" id="contact-type-improvement" value="Suggest an Improvement" />
                <span class="contact-pill-btn">Suggest an Improvement</span>
              </label>
            </div>
            <div class="contact-class-grid" role="radiogroup" aria-label="Classification">
              <label class="contact-pill-option">
                <input type="radio" name="contact_float_classification" value="Data / Mathematical Anomalies" />
                <span class="contact-pill-btn">Data / Formula</span>
              </label>
              <label class="contact-pill-option">
                <input type="radio" name="contact_float_classification" value="Terminal UI / Visual Bugs" />
                <span class="contact-pill-btn">Terminal / UI</span>
              </label>
              <label class="contact-pill-option">
                <input type="radio" name="contact_float_classification" value="Login / Account Sync" />
                <span class="contact-pill-btn">Auth &amp; Account</span>
              </label>
              <label class="contact-pill-option">
                <input type="radio" name="contact_float_classification" value="Membership & Billing" />
                <span class="contact-pill-btn">Billing / Payment</span>
              </label>
              <label class="contact-pill-option">
                <input type="radio" name="contact_float_classification" value="Gemini AI Doubt Solver" />
                <span class="contact-pill-btn">Gemini AI</span>
              </label>
              <label class="contact-pill-option">
                <input type="radio" name="contact_float_classification" value="General Technical / Other" checked />
                <span class="contact-pill-btn">Other / General</span>
              </label>
            </div>
          </div>
          <textarea id="contact-comment-input" class="contact-float-textarea" rows="4" placeholder="Comment — describe the issue, error steps, or improvement idea..."></textarea>
          <input type="file" id="contact-float-file-input" accept="image/png,image/jpeg,image/webp,image/gif" multiple style="display:none;" />
          <div class="screenshot-upload-error font-mono" id="contact-float-upload-error" style="display:none;"></div>
          <div class="contact-float-screenshots" id="contact-float-screenshots"></div>
          <div class="contact-float-actions-row">
            <button type="button" class="contact-action-btn" id="contact-bar-upload-btn" data-hover-tag="[UPLOAD SCREENSHOT]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span id="contact-upload-btn-label">Upload Screenshot</span>
            </button>
            <button type="button" class="contact-action-btn contact-action-btn--primary" id="contact-bar-dispatch-btn" data-hover-tag="[DISPATCH]">Dispatch</button>
            <button type="button" class="contact-action-btn" id="contact-bar-direct-email-btn" data-hover-tag="[DIRECT EMAIL]">Send a direct email to us if this page is broken</button>
          </div>
        </div>
      `;
      document.body.appendChild(contactBar);
      makeFloatingBarDraggable(contactBar);
    }

    // 2. SHORTCUTS FLOATING BAR (3 Columns)
    if (!document.getElementById("shortcuts-floating-bar")) {
      const shortcutsBar = document.createElement("div");
      shortcutsBar.id = "shortcuts-floating-bar";
      shortcutsBar.className = "utility-floating-bar shortcuts-floating-bar";
      shortcutsBar.setAttribute("role", "dialog");
      shortcutsBar.setAttribute("aria-label", "Keyboard Shortcuts");
      shortcutsBar.innerHTML = `
        <div class="utility-bar-header">
          <div class="utility-bar-title-wrap">
            <span class="palette-drag-handle" title="Drag Panel">
              <svg width="10" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2.5"/><circle cx="8" cy="12" r="2.5"/><circle cx="8" cy="20" r="2.5"/><circle cx="16" cy="4" r="2.5"/><circle cx="16" cy="12" r="2.5"/><circle cx="16" cy="20" r="2.5"/></svg>
            </span>
            <span class="utility-bar-title">[KEYBOARD SHORTCUTS]</span>
            <span class="shortcuts-header-hint">Click any badge to customize (letters require Ctrl/Alt)</span>
          </div>
          <div class="utility-bar-meta-group">
            <button type="button" class="shortcut-reset-btn font-mono" id="btn-reset-shortcuts" data-hover-tag="[RESET SHORTCUTS]">Reset Defaults</button>
            <button type="button" class="palette-close-btn" id="shortcuts-bar-close-btn" data-hover-tag="[CLOSE]" aria-label="Close">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="shortcuts-bar-body" id="shortcuts-panel"></div>
      `;
      document.body.appendChild(shortcutsBar);
      makeFloatingBarDraggable(shortcutsBar);
    }

    // 3. ACCOUNT FLOATING BAR
    if (!document.getElementById("account-floating-bar")) {
      const accountBar = document.createElement("div");
      accountBar.id = "account-floating-bar";
      accountBar.className = "utility-floating-bar account-floating-bar";
      accountBar.setAttribute("role", "dialog");
      accountBar.setAttribute("aria-label", "Account Dossier");
      accountBar.innerHTML = `
        <div class="utility-bar-header">
          <div class="utility-bar-title-wrap">
            <span class="palette-drag-handle" title="Drag Panel">
              <svg width="10" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2.5"/><circle cx="8" cy="12" r="2.5"/><circle cx="8" cy="20" r="2.5"/><circle cx="16" cy="4" r="2.5"/><circle cx="16" cy="12" r="2.5"/><circle cx="16" cy="20" r="2.5"/></svg>
            </span>
            <span class="utility-bar-title">[ACCOUNT DOSSIER]</span>
          </div>
          <div class="utility-bar-meta-group">
            <span class="active-pulse-indicator" id="account-bar-status-pill" style="font-size:0.68rem;">
              <span class="pulse-dot"></span> Cloud Sync
            </span>
            <button type="button" class="palette-close-btn" id="account-bar-close-btn" data-hover-tag="[CLOSE]" aria-label="Close">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="account-bar-body" id="account-panel"></div>
      `;
      document.body.appendChild(accountBar);
      makeFloatingBarDraggable(accountBar);
    }

    // 4. SETTINGS FLOATING BAR (Single horizontal row matching edit bar)
    if (!document.getElementById("settings-floating-bar")) {
      const settingsBar = document.createElement("div");
      settingsBar.id = "settings-floating-bar";
      settingsBar.className = "utility-floating-bar settings-floating-bar";
      settingsBar.setAttribute("role", "dialog");
      settingsBar.setAttribute("aria-label", "Display Settings");
      settingsBar.innerHTML = `
        <span class="palette-drag-handle" title="Drag Settings Bar">
          <svg width="10" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2.5"/><circle cx="8" cy="12" r="2.5"/><circle cx="8" cy="20" r="2.5"/><circle cx="16" cy="4" r="2.5"/><circle cx="16" cy="12" r="2.5"/><circle cx="16" cy="20" r="2.5"/></svg>
        </span>
        <div class="settings-bar-inline" id="settings-panel">
          <div class="custom-dropdown-row">
            <span class="custom-dropdown-label">Font Size</span>
            <div class="custom-dropdown" id="dropdown-font-size">
              <button type="button" class="dropdown-trigger" id="btn-font-size-trigger" aria-haspopup="listbox" aria-expanded="false">
                <span id="font-size-label">Medium</span>
                <svg class="dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div class="dropdown-menu-list" id="list-font-size" role="listbox">
                <button type="button" class="dropdown-item" data-type="font-size" data-val="small">Small (85%)</button>
                <button type="button" class="dropdown-item active" data-type="font-size" data-val="medium">Medium (Default)</button>
                <button type="button" class="dropdown-item" data-type="font-size" data-val="large">Large (115%)</button>
              </div>
            </div>
          </div>
          <span class="palette-sep">|</span>
          <div class="custom-dropdown-row">
            <span class="custom-dropdown-label">Font Style</span>
            <div class="custom-dropdown" id="dropdown-font-style">
              <button type="button" class="dropdown-trigger" id="btn-font-style-trigger" aria-haspopup="listbox" aria-expanded="false">
                <span id="font-style-label">Reading</span>
                <svg class="dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div class="dropdown-menu-list" id="list-font-style" role="listbox">
                <button type="button" class="dropdown-item active" data-type="font-style" data-val="reading">Reading (Sans)</button>
                <button type="button" class="dropdown-item" data-type="font-style" data-val="typewriter">Typewriter (Mono)</button>
              </div>
            </div>
          </div>
          <span class="palette-sep">|</span>
          <label class="setting-toggle-row" for="grid-toggle">
            <span>Grid</span>
            <input type="checkbox" id="grid-toggle" checked />
          </label>
          <span class="palette-sep">|</span>
          <label class="setting-toggle-row" for="contrast-toggle">
            <span>Dark Theme</span>
            <input type="checkbox" id="contrast-toggle" />
          </label>
        </div>
        <span class="palette-sep">|</span>
        <button type="button" class="palette-close-btn" id="settings-bar-close-btn" data-hover-tag="[CLOSE]" aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
      document.body.appendChild(settingsBar);
      makeFloatingBarDraggable(settingsBar);
    }

    // 5. STATUTORY & PRIVACY FLOATING BAR (Top-center floating panel matching other utility bars)
    if (!document.getElementById("statutory-floating-bar")) {
      const statutoryBar = document.createElement("div");
      statutoryBar.id = "statutory-floating-bar";
      statutoryBar.className = "utility-floating-bar statutory-floating-bar";
      statutoryBar.setAttribute("role", "dialog");
      statutoryBar.setAttribute("aria-label", "Statutory Intelligence & Privacy Dossier");
      statutoryBar.innerHTML = `
        <div class="utility-bar-header">
          <div class="utility-bar-title-wrap">
            <span class="palette-drag-handle" title="Drag Panel">
              <svg width="10" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2.5"/><circle cx="8" cy="12" r="2.5"/><circle cx="8" cy="20" r="2.5"/><circle cx="16" cy="4" r="2.5"/><circle cx="16" cy="12" r="2.5"/><circle cx="16" cy="20" r="2.5"/></svg>
            </span>
            <span class="utility-bar-title">[STATUTORY &amp; PRIVACY DOSSIER]</span>
          </div>
          <div class="utility-bar-meta-group">
            <span class="statutory-pill-badge font-mono">REGULATORY COMPLIANT</span>
            <button type="button" class="palette-close-btn" id="statutory-bar-close-btn" data-hover-tag="[CLOSE]" aria-label="Close">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="statutory-bar-body">
          <div class="statutory-card-item">
            <div class="statutory-card-header">
              <span class="statutory-card-tag font-mono">01 &bull; AI TELEMETRY</span>
              <h4 class="statutory-card-title">Gemini AI Model Boundaries &amp; Accuracy Limits</h4>
            </div>
            <p class="statutory-card-text">
              The Gemini AI companion utilizes Google foundation language models via edge telemetry. Responses are computed probabilistically from statutory contexts (Companies Act 2013, SEBI LODR, LLP Act 2008). AI responses are auxiliary reference guides and do not constitute formal legal opinions from an Advocate on Record or audit rulings from the Ministry of Corporate Affairs.
            </p>
          </div>

          <div class="statutory-card-item">
            <div class="statutory-card-header">
              <span class="statutory-card-tag font-mono">02 &bull; SOVEREIGN CLEARANCE</span>
              <h4 class="statutory-card-title">Terms &amp; Conditions of Institutional Access</h4>
            </div>
            <p class="statutory-card-text">
              Purchasers of the Sovereign Pass receive a revocable, non-exclusive, single-analyst license for internal research. Deploying automated scrapers, botnets, or brute-force extraction routines against IndexIndia CDN endpoints or Supabase instances is strictly prohibited and terminates clearance immediately.
            </p>
          </div>

          <div class="statutory-card-item">
            <div class="statutory-card-header">
              <span class="statutory-card-tag font-mono">03 &bull; DATA PRIVACY</span>
              <h4 class="statutory-card-title">Zero Third-Party Data Selling Guarantee</h4>
            </div>
            <p class="statutory-card-text">
              IndexIndia does <strong>NOT</strong> sell, rent, monetize, or broker user identities, email addresses, payment records, or research behaviors to third parties, data aggregators, or hedge funds. Diligence annotations and reading progress remain strictly local-first and encrypted in your personal cloud profile.
            </p>
          </div>

          <div class="statutory-card-item">
            <div class="statutory-card-header">
              <span class="statutory-card-tag font-mono">04 &bull; FAIR DEALING</span>
              <h4 class="statutory-card-title">Public Domain Diligence &amp; Copyright Compliance</h4>
            </div>
            <p class="statutory-card-text">
              Statutory citations and corporate balance sheet taxonomies are published under <strong>Section 52(1)(a)(i) of the Copyright Act, 1957 (India)</strong>, governing fair dealing for research, private study, and review. Primary sources derive from publicly published gazette notifications of MCA, SEBI, and RBI.
            </p>
          </div>

          <div class="statutory-card-item">
            <div class="statutory-card-header">
              <span class="statutory-card-tag font-mono">05 &bull; SETTLEMENT</span>
              <h4 class="statutory-card-title">Razorpay &amp; Sovereign Merchant Terms</h4>
            </div>
            <p class="statutory-card-text">
              All transactions are settled securely in Indian Rupees (INR) via Razorpay Software Pvt. Ltd. adhering to RBI tokenization and PCI-DSS Level 1 directives. Instant cryptographic provisioning activates pass clearance across the browser session upon payment confirmation.
            </p>
          </div>
        </div>
      `;
      document.body.appendChild(statutoryBar);
      makeFloatingBarDraggable(statutoryBar);
    }
  }

  ensureUtilityFloatingBars();

  // --- Contact Us Floating Bar State & Dispatch Engine ---
  let contactUploadedScreenshots = [];
  const CONTACT_MAX_SCREENSHOTS = 2;
  const CONTACT_MAX_BYTES = 2.5 * 1024 * 1024;

  function setContactInlineStatus(text, tone = "") {
    const statusEl = document.getElementById("contact-inline-status");
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.className = "contact-inline-status" + (tone ? ` is-${tone}` : "");
  }

  function refreshContactAuthUI() {
    const sb = window.IndexIndiaSupabase;
    const user = sb && typeof sb.getUser === "function" ? sb.getUser() : null;
    const authPill = document.getElementById("contact-auth-email-pill");
    const guestInput = document.getElementById("contact-guest-email");

    if (user && user.email) {
      if (authPill) {
        authPill.textContent = `From: ${user.email}`;
        authPill.title = user.email;
        authPill.style.display = "inline-flex";
      }
      if (guestInput) guestInput.style.display = "none";
    } else {
      if (authPill) authPill.style.display = "none";
      if (guestInput) {
        guestInput.style.display = "inline-block";
        try {
          const savedGuest = localStorage.getItem("indexindia_guest_contact_email");
          if (savedGuest && !guestInput.value) guestInput.value = savedGuest;
        } catch (_) {}
      }
    }
  }

  async function copyImageDataUrlToClipboard(dataUrl) {
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") return false;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const pngBlob = blob.type === "image/png" ? blob : await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width || 800;
          canvas.height = img.height || 600;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((b) => resolve(b || blob), "image/png");
        };
        img.onerror = () => resolve(blob);
        img.src = dataUrl;
      });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
      return true;
    } catch (_) {
      return false;
    }
  }

  function renderContactFloatingScreenshots() {
    const grid = document.getElementById("contact-float-screenshots");
    const errEl = document.getElementById("contact-float-upload-error");
    const uploadBtn = document.getElementById("contact-bar-upload-btn");
    const uploadLabel = document.getElementById("contact-upload-btn-label");
    if (!grid) return;

    grid.innerHTML = "";
    if (contactUploadedScreenshots.length === 0) {
      grid.style.display = "none";
      if (uploadBtn) uploadBtn.disabled = false;
      if (uploadLabel) uploadLabel.textContent = "Upload Screenshot";
      return;
    }

    grid.style.display = "grid";
    contactUploadedScreenshots.forEach((s, idx) => {
      const card = document.createElement("div");
      card.className = "screenshot-preview-card";
      card.innerHTML = `
        <img src="${s.dataUrl}" alt="${escFloatHtml(s.filename)}" class="screenshot-card-thumb" />
        <div class="screenshot-card-info">
          <span class="screenshot-card-name" title="${escFloatHtml(s.filename)}">${escFloatHtml(s.filename)}</span>
          <span class="screenshot-card-size font-mono">${escFloatHtml(s.sizeStr)}</span>
        </div>
        <button type="button" class="screenshot-card-remove contact-rm-shot-btn" data-idx="${idx}" data-hover-tag="[REMOVE]" aria-label="Remove screenshot">✕</button>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll(".contact-rm-shot-btn").forEach((rmBtn) => {
      rmBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(rmBtn.getAttribute("data-idx"), 10);
        if (!isNaN(idx)) {
          contactUploadedScreenshots.splice(idx, 1);
          if (errEl) {
            errEl.textContent = "";
            errEl.style.display = "none";
          }
          renderContactFloatingScreenshots();
        }
      });
    });

    if (contactUploadedScreenshots.length >= CONTACT_MAX_SCREENSHOTS) {
      if (uploadBtn) uploadBtn.disabled = true;
      if (uploadLabel) uploadLabel.textContent = "Screenshots (2/2)";
    } else {
      if (uploadBtn) uploadBtn.disabled = false;
      if (uploadLabel) uploadLabel.textContent = `Add Another (${contactUploadedScreenshots.length}/${CONTACT_MAX_SCREENSHOTS})`;
    }
  }

  function initContactFloatingBarEvents() {
    const contactBar = document.getElementById("contact-floating-bar");
    if (!contactBar || contactBar.dataset.eventsBound === "1") return;
    contactBar.dataset.eventsBound = "1";

    const uploadBtn = document.getElementById("contact-bar-upload-btn");
    const fileInput = document.getElementById("contact-float-file-input");
    const errEl = document.getElementById("contact-float-upload-error");
    const commentEl = document.getElementById("contact-comment-input");
    const guestEmailEl = document.getElementById("contact-guest-email");
    const dispatchBtn = document.getElementById("contact-bar-dispatch-btn");
    const directEmailBtn = document.getElementById("contact-bar-direct-email-btn");

    function updateTypePlaceholder() {
      const checkedType = contactBar.querySelector('input[name="contact_float_type"]:checked')?.value || "Report an Issue";
      if (!commentEl) return;
      if (checkedType.toLowerCase().includes("improvement")) {
        commentEl.placeholder = "Comment — describe your suggested improvement, workflow benefit, or idea...";
      } else {
        commentEl.placeholder = "Comment — describe the issue, error steps, or bug you encountered...";
      }
    }

    contactBar.querySelectorAll('input[name="contact_float_type"]').forEach((r) => {
      r.addEventListener("change", updateTypePlaceholder);
    });

    if (guestEmailEl) {
      guestEmailEl.addEventListener("change", () => {
        try { localStorage.setItem("indexindia_guest_contact_email", guestEmailEl.value.trim()); } catch (_) {}
      });
    }

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (errEl) { errEl.style.display = "none"; errEl.textContent = ""; }
        if (contactUploadedScreenshots.length >= CONTACT_MAX_SCREENSHOTS) {
          if (errEl) {
            errEl.textContent = "Maximum 2 screenshots allowed. Remove one to upload another.";
            errEl.style.display = "block";
          }
          return;
        }
        fileInput.value = "";
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        if (errEl) { errEl.style.display = "none"; errEl.textContent = ""; }
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remaining = CONTACT_MAX_SCREENSHOTS - contactUploadedScreenshots.length;
        if (files.length > remaining) {
          if (errEl) {
            errEl.textContent = `Maximum ${CONTACT_MAX_SCREENSHOTS} screenshots allowed (${remaining} slot remaining).`;
            errEl.style.display = "block";
          }
          return;
        }

        for (const f of files) {
          if (f.size > CONTACT_MAX_BYTES) {
            const mb = (f.size / (1024 * 1024)).toFixed(2);
            if (errEl) {
              errEl.textContent = `"${f.name}" exceeds 2.5 MB (${mb} MB). Choose a smaller image.`;
              errEl.style.display = "block";
            }
            return;
          }
        }

        let loadedCount = 0;
        files.forEach((f) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const sizeKb = (f.size / 1024).toFixed(1);
            contactUploadedScreenshots.push({
              file: f,
              filename: f.name,
              dataUrl: ev.target.result,
              sizeStr: f.size >= 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKb} KB`
            });
            loadedCount++;
            if (loadedCount === files.length) {
              renderContactFloatingScreenshots();
            }
          };
          reader.readAsDataURL(f);
        });
      });
    }

    function buildContactDispatchPayload() {
      const sb = window.IndexIndiaSupabase;
      const user = sb && typeof sb.getUser === "function" ? sb.getUser() : null;
      const typedGuest = guestEmailEl ? guestEmailEl.value.trim() : "";
      const userEmail = (user && user.email) ? user.email : (typedGuest || "visitor@indexindia.in");

      const subType = contactBar.querySelector('input[name="contact_float_type"]:checked')?.value || "Report an Issue";
      const category = contactBar.querySelector('input[name="contact_float_classification"]:checked')?.value || "General Technical / Other";
      const isIssue = subType.toLowerCase().includes("issue");
      const typeTag = isIssue ? "ISSUE" : "IMPROVEMENT";
      const description = commentEl ? commentEl.value.trim() : "";

      const randHex = Math.random().toString(36).substring(2, 7).toUpperCase();
      const tsNum = Date.now().toString().slice(-4);
      const ticketId = `INC-IND-${tsNum}-${randHex}`;
      const targetAdminEmail = "dhaumyakumar27@gmail.com";
      const emailSubject = `[INDEXINDIA] [${typeTag}] [${category.toUpperCase()}] - ${ticketId}`;
      const timestampIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      const platform = navigator.userAgentData?.platform || navigator.platform || "Web";
      const viewport = `${window.innerWidth} × ${window.innerHeight}`;
      const screenRes = `${window.screen.width} × ${window.screen.height} @ ${window.devicePixelRatio || 1}x`;
      const currentTheme = document.body.classList.contains("theme-dark") ? "Dark Theme" : "Light Theme";
      const currentFont = document.body.classList.contains("font-style-typewriter") ? "Typewriter (Mono)" : "Reading (Sans)";
      const errorsArr = Array.isArray(window.__indexIndiaErrors) ? window.__indexIndiaErrors : [];
      const consoleCount = errorsArr.length;

      const screenshotDetailsText = contactUploadedScreenshots.length > 0
        ? contactUploadedScreenshots.map((s, idx) => `File ${idx + 1}: ${s.filename} (${s.sizeStr})`).join("\n")
        : "NONE";

      const rawBody = `[INDEXINDIA DISPATCH]
Ticket ID: ${ticketId}
Date & Time (IST): ${timestampIST}
SUBMISSION TYPE: ${typeTag}
CLASSIFICATION: ${category}
User Contact Email: ${userEmail}
Page: ${window.location.href}

${isIssue ? "Error Report / Technical Symptoms:" : "Improvement Proposal / Feature Specification:"}
--------------------------------------------------
${description || "(No comment entered — page/telemetry diagnostic)"}
--------------------------------------------------
Terminal Telemetry:
Platform: ${platform}
Viewport: ${viewport}
Screen Resolution: ${screenRes}
Theme: ${currentTheme} | Font: ${currentFont}
User Agent: ${navigator.userAgent}
Recorded Console Errors: ${consoleCount}
${consoleCount > 0 ? "\nConsole Error Buffer:\n" + errorsArr.slice(-15).map(e => `[${e.time}] [${e.type}] ${e.message} (${e.source})`).join("\n") + "\n" : ""}
Clipped Screenshots:
${screenshotDetailsText}
`;

      const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F4F4F6;color:#111;margin:0;padding:20px;}
.email-container{max-width:640px;margin:0 auto;background:#fff;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;}
.email-header{background:#000;color:#fff;padding:24px;border-bottom:3px solid #FF3B00;}
.badge{display:inline-block;background:#FF3B00;color:#fff;font-size:11px;font-weight:700;padding:4px 8px;border-radius:3px;text-transform:uppercase;font-family:monospace;}
.email-body{padding:24px;line-height:1.6;font-size:14px;}
.meta-table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;}
.meta-table td{padding:8px 10px;border-bottom:1px solid #f0f0f0;}
.meta-label{color:#6B7280;font-weight:600;width:140px;}
.description-box{background:#F9FAFB;border:1px solid #E5E7EB;border-left:4px solid #FF3B00;padding:14px;border-radius:4px;white-space:pre-wrap;font-family:monospace;font-size:13px;margin-bottom:20px;color:#111827;}
.telemetry-box{background:#18181B;color:#E4E4E7;border-radius:6px;padding:16px;font-family:monospace;font-size:12px;margin-top:16px;}
.logs-box{max-height:160px;overflow-y:auto;background:#09090B;color:#FCA5A5;padding:10px;border-radius:4px;font-size:11px;margin-top:8px;white-space:pre-wrap;word-break:break-all;}
</style></head><body><div class="email-container">
<div class="email-header"><span class="badge">${escFloatHtml(typeTag)} &bull; ${escFloatHtml(category)}</span>
<h1 style="margin:12px 0 0;font-size:19px;color:#fff;">IndexIndia ${escFloatHtml(typeTag)}: ${escFloatHtml(ticketId)}</h1></div>
<div class="email-body"><table class="meta-table">
<tr><td class="meta-label">Ticket Reference</td><td><strong style="color:#FF3B00;">${escFloatHtml(ticketId)}</strong></td></tr>
<tr><td class="meta-label">Submission Type</td><td><strong>${escFloatHtml(typeTag)}</strong></td></tr>
<tr><td class="meta-label">Classification</td><td><strong>${escFloatHtml(category)}</strong></td></tr>
<tr><td class="meta-label">Submitter Email</td><td>${escFloatHtml(userEmail)}</td></tr>
<tr><td class="meta-label">Timestamp (IST)</td><td>${escFloatHtml(timestampIST)}</td></tr>
<tr><td class="meta-label">Page URL</td><td>${escFloatHtml(window.location.href)}</td></tr>
<tr><td class="meta-label">Screenshot(s)</td><td>${contactUploadedScreenshots.length > 0 ? contactUploadedScreenshots.map((s, i) => `File ${i + 1}: ${escFloatHtml(s.filename)} (${escFloatHtml(s.sizeStr)})`).join("<br>") : "None"}</td></tr>
</table>
<div class="description-box">${escFloatHtml(description || "(No comment entered)")}</div>
<div class="telemetry-box"><div>Platform: ${escFloatHtml(platform)} | Viewport: ${escFloatHtml(viewport)} | Screen: ${escFloatHtml(screenRes)}</div>
<div>Theme: ${escFloatHtml(currentTheme)} | Font: ${escFloatHtml(currentFont)}</div>
${consoleCount > 0 ? `<div class="logs-box">${escFloatHtml(errorsArr.slice(-15).map(e => `[${e.time}] [${e.type}] ${e.message}`).join("\n"))}</div>` : `<div style="color:#10B981;margin-top:6px;">✓ Zero console errors captured</div>`}
</div></div></div></body></html>`;

      return {
        ticketId,
        userEmail,
        typeTag,
        isIssue,
        category,
        description,
        targetAdminEmail,
        emailSubject,
        timestampIST,
        platform,
        viewport,
        screenRes,
        currentTheme,
        currentFont,
        consoleCount,
        errorsArr,
        rawBody,
        htmlContent
      };
    }

    if (dispatchBtn) {
      dispatchBtn.addEventListener("click", async () => {
        if (guestEmailEl && guestEmailEl.style.display !== "none" && guestEmailEl.value.trim()) {
          if (!guestEmailEl.checkValidity()) {
            guestEmailEl.reportValidity();
            return;
          }
          try { localStorage.setItem("indexindia_guest_contact_email", guestEmailEl.value.trim()); } catch (_) {}
        }

        const commentText = commentEl ? commentEl.value.trim() : "";
        if (!commentText) {
          setContactInlineStatus("Please enter a comment before dispatching.", "error");
          if (commentEl) commentEl.focus();
          return;
        }

        const p = buildContactDispatchPayload();
        dispatchBtn.disabled = true;
        dispatchBtn.textContent = "Dispatching...";
        setContactInlineStatus("Transmitting report...", "info");

        const CLOUDFLARE_WORKER_URL = (localStorage.getItem("indexindia_cf_worker_url") || "https://indexindia.dhaumyakumar27-235.workers.dev").trim();
        const customResendKey = (localStorage.getItem("indexindia_resend_api_key") || "").trim();

        let delivered = false;
        let needsActivation = false;

        // 1. Primary FormSubmit AJAX Relay
        try {
          const fsFormData = new FormData();
          fsFormData.append("_captcha", "false");
          fsFormData.append("_template", "table");
          fsFormData.append("_subject", p.emailSubject);
          fsFormData.append("_replyto", p.userEmail);
          fsFormData.append("Submission_Type", p.typeTag);
          fsFormData.append("Classification", p.category);
          fsFormData.append("Ticket_ID", p.ticketId);
          fsFormData.append("Email", p.userEmail);
          fsFormData.append("Timestamp_IST", p.timestampIST);
          fsFormData.append("Platform", p.platform);
          fsFormData.append("Viewport", p.viewport);
          fsFormData.append("Screen", p.screenRes);
          fsFormData.append("Theme_and_Font", `${p.currentTheme} | ${p.currentFont}`);
          fsFormData.append("Description", p.description);
          if (p.consoleCount > 0) {
            fsFormData.append("Console_Errors", p.errorsArr.slice(-15).map(e => `[${e.time}] [${e.type}] ${e.message} (${e.source})`).join("\n"));
          }
          contactUploadedScreenshots.forEach((s, idx) => {
            if (s.file) {
              const attachKey = idx === 0 ? "attachment" : `attachment_${idx + 1}`;
              fsFormData.append(attachKey, s.file, s.filename || `screenshot_${idx + 1}.png`);
            }
          });

          const fsResp = await fetch("https://formsubmit.co/ajax/dhaumyakumar27@gmail.com", {
            method: "POST",
            headers: { "Accept": "application/json" },
            body: fsFormData
          });
          if (fsResp.ok) {
            const fsData = await fsResp.json().catch(() => ({}));
            if (fsData.success === "true" || fsData.success === true) {
              delivered = true;
            } else if (typeof fsData.message === "string" && fsData.message.toLowerCase().includes("activation")) {
              needsActivation = true;
            }
          }
        } catch (_) {}

        // 2. Cloudflare Worker Relay
        if (!delivered) {
          try {
            const workerPayload = {
              type: p.isIssue ? "contact_issue" : "feedback_proposal",
              ticketId: p.ticketId,
              category: p.category,
              subject: p.emailSubject,
              email: p.userEmail,
              description: p.description,
              html: p.htmlContent
            };
            if (contactUploadedScreenshots.length > 0) {
              workerPayload.screenshots = contactUploadedScreenshots.map((s, idx) => ({
                filename: s.filename || `screenshot-${p.ticketId}-${idx + 1}.png`,
                content: s.dataUrl.split(",")[1]
              }));
              workerPayload.screenshot = workerPayload.screenshots[0];
            }
            const resp = await fetch(`${CLOUDFLARE_WORKER_URL}/api/contact-inquiry`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(workerPayload)
            });
            if (resp.ok) {
              const resData = await resp.json().catch(() => ({}));
              if (resData.success) delivered = true;
            }
          } catch (_) {}
        }

        // 3. Direct Resend API Fallback
        if (!delivered && customResendKey) {
          try {
            const resendPayload = {
              from: "IndexIndia <onboarding@resend.dev>",
              to: [p.targetAdminEmail],
              reply_to: p.userEmail,
              subject: p.emailSubject,
              text: p.rawBody,
              html: p.htmlContent
            };
            if (contactUploadedScreenshots.length > 0) {
              resendPayload.attachments = contactUploadedScreenshots.map((s, idx) => ({
                filename: s.filename || `screenshot-${p.ticketId}-${idx + 1}.png`,
                content: s.dataUrl.split(",")[1]
              }));
            }
            const rResp = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${customResendKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(resendPayload)
            });
            if (rResp.ok) delivered = true;
          } catch (_) {}
        }

        if (delivered) {
          setContactInlineStatus(`✓ Dispatched [${p.ticketId}]`, "success");
          dispatchBtn.textContent = "Dispatched ✓";
          if (commentEl) commentEl.value = "";
          contactUploadedScreenshots = [];
          renderContactFloatingScreenshots();
          setTimeout(() => {
            dispatchBtn.textContent = "Dispatch";
            dispatchBtn.disabled = false;
          }, 2200);
        } else {
          dispatchBtn.textContent = "Dispatch";
          dispatchBtn.disabled = false;
          if (needsActivation) {
            setContactInlineStatus("Check inbox to activate FormSubmit or use Direct Email", "error");
          } else {
            setContactInlineStatus(`Relay unavailable — use Direct Email button`, "error");
          }
        }
      });
    }

    if (directEmailBtn) {
      directEmailBtn.addEventListener("click", async () => {
        const p = buildContactDispatchPayload();
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(p.targetAdminEmail)}&su=${encodeURIComponent(p.emailSubject)}&body=${encodeURIComponent(p.rawBody)}`;
        // Synchronously open Gmail tab inside click gesture so popup blockers don't block it
        try {
          window.open(gmailUrl, "_blank", "noopener");
        } catch (_) {}

        if (contactUploadedScreenshots.length > 0) {
          const copied = await copyImageDataUrlToClipboard(contactUploadedScreenshots[0].dataUrl);
          if (copied) {
            setContactInlineStatus("Gmail opened + screenshot copied (Ctrl+V)", "success");
          } else {
            setContactInlineStatus("Gmail opened — attach screenshot manually", "info");
          }
        } else {
          setContactInlineStatus("Gmail compose opened", "success");
        }
      });
    }
  }

  initContactFloatingBarEvents();
  refreshContactAuthUI();

  const shortcutsWrapper = document.getElementById("shortcuts-wrapper");
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  const accountWrapper = document.getElementById("account-wrapper");
  const accountBtn = document.getElementById("account-btn");
  const settingsWrapper = document.getElementById("settings-wrapper");
  const settingsBtn = document.getElementById("settings-btn");
  const contactNavWrapper = document.getElementById("contact-nav-wrapper");
  const contactNavBtn = document.getElementById("contact-nav-btn");

  TopCenterFloatingManager.register({
    id: "contact",
    wrapper: contactNavWrapper,
    btn: contactNavBtn,
    barId: "contact-floating-bar",
    onPreview: () => {
      refreshContactAuthUI();
    },
    onPin: ({ fromInteraction }) => {
      refreshContactAuthUI();
      if (!fromInteraction) {
        setTimeout(() => {
          document.getElementById("contact-comment-input")?.focus();
        }, 40);
      }
    }
  });

  TopCenterFloatingManager.register({
    id: "shortcuts",
    wrapper: shortcutsWrapper,
    btn: shortcutsBtn,
    barId: "shortcuts-floating-bar",
    onClose: () => {
      if (typeof recordingShortcutAction === "string" && typeof stopRecordingShortcut === "function") {
        stopRecordingShortcut(false);
      }
    }
  });

  TopCenterFloatingManager.register({
    id: "account",
    wrapper: accountWrapper,
    btn: accountBtn,
    barId: "account-floating-bar",
    onPreview: () => {
      const panel = document.getElementById("account-panel");
      if (panel && !panel.hasChildNodes() && typeof renderAccountPanel === "function") {
        renderAccountPanel();
      }
    },
    onPin: ({ fromInteraction }) => {
      if (!fromInteraction && typeof renderAccountPanel === "function") {
        renderAccountPanel();
      }
    }
  });

  TopCenterFloatingManager.register({
    id: "settings",
    wrapper: settingsWrapper,
    btn: settingsBtn,
    barId: "settings-floating-bar",
    onClose: () => {
      document.querySelectorAll("#settings-floating-bar .custom-dropdown.is-open").forEach((d) => {
        d.classList.remove("is-open");
      });
    }
  });

  const statutoryNavWrapper = document.getElementById("statutory-nav-wrapper");
  const statutoryNavBtn = document.getElementById("nav-statutory-btn");

  TopCenterFloatingManager.register({
    id: "statutory",
    wrapper: statutoryNavWrapper,
    btn: statutoryNavBtn,
    barId: "statutory-floating-bar"
  });

  // Footer Statutory link opens the floating bar
  const footerStatutoryBtn = document.getElementById("footer-statutory-btn");
  if (footerStatutoryBtn) {
    footerStatutoryBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTopFloatingBar("statutory");
    });
  }


  // ================= 3b. SUPABASE ACCOUNT DOSSIER & CLOUD SYNC SYSTEM =================
  const accountPanel = document.getElementById("account-panel");
  let accountActiveTab = "signin"; // "signin" | "signup" | "magic"
  let isConfigBoxVisible = false;
  let cloudAnnotationDebounceTimer = null;

  function triggerCloudAnnotationSync() {
    if (!window.IndexIndiaSupabase || !window.IndexIndiaSupabase.isAuthenticated()) return;
    clearTimeout(cloudAnnotationDebounceTimer);
    cloudAnnotationDebounceTimer = setTimeout(async () => {
      try {
        if (typeof annotationsData !== "undefined") {
          await window.IndexIndiaSupabase.uploadAnnotations(window.location.pathname, annotationsData);
        }
      } catch (e) {
        console.warn("[CloudSync] Annotation upload error:", e);
      }
    }, 700);
  }

  async function triggerCloudAnnotationFetch() {
    if (!window.IndexIndiaSupabase || !window.IndexIndiaSupabase.isAuthenticated()) return;
    try {
      if (typeof annotationsData === "undefined") return;
      const merged = await window.IndexIndiaSupabase.syncAnnotationsDown(window.location.pathname, annotationsData);
      if (merged && merged.updatedAt && merged.updatedAt > (annotationsData.updatedAt || 0)) {
        annotationsData = merged;
        try {
          if (typeof ANNOTATION_STORAGE_KEY !== "undefined") {
            localStorage.setItem(ANNOTATION_STORAGE_KEY, JSON.stringify(annotationsData));
          }
        } catch (e) {}
        if (typeof renderAllSavedAnnotations === "function") {
          renderAllSavedAnnotations();
        }
        if (typeof updateAnnotationCounter === "function") {
          updateAnnotationCounter();
        }
      }
    } catch (e) {
      console.warn("[CloudSync] Annotation fetch error:", e);
    }
  }

  async function triggerCloudDoubtsFetch() {
    if (!window.IndexIndiaSupabase || !window.IndexIndiaSupabase.isAuthenticated()) return;
    try {
      const local = typeof getLocalDoubtsHistory === "function" ? getLocalDoubtsHistory() : [];
      const merged = await window.IndexIndiaSupabase.syncDoubtsDown(local);
      if (merged && merged.length) {
        if (typeof saveLocalDoubtsHistory === "function") {
          saveLocalDoubtsHistory(merged);
        }
        if (typeof renderDoubtsView === "function") {
          renderDoubtsView();
        }
      }
    } catch (e) {
      console.warn("[CloudSync] Doubts fetch error:", e);
    }
  }

  async function triggerCloudSyncAll() {
    await Promise.allSettled([
      triggerCloudAnnotationFetch(),
      triggerCloudDoubtsFetch()
    ]);
  }

  function updateNavUpgradePanel(membership) {
    const badge = document.getElementById("nav-upgrade-badge");
    const status = document.getElementById("nav-upgrade-status");
    const planName = document.getElementById("nav-current-plan-name");
    const planStatus = document.getElementById("nav-current-plan-status");
    const ctaBtn = document.getElementById("nav-upgrade-cta-btn");
    const desc = document.getElementById("nav-upgrade-desc");

    const hasPaid = membership && membership.status === "active";
    if (hasPaid) {
      let displayName = "Premium Pass";
      if (membership.plan_type === "lifetime") displayName = "Lifetime Sovereign";
      else if (membership.plan_type === "annual") displayName = "Annual Partner";
      else if (membership.plan_type === "monthly") displayName = "Monthly Pass";
      else if (membership.plan_type === "daily_autopay") displayName = "₹1 Daily AutoPay (7 Days)";
      else if (membership.plan_type === "3min_test") displayName = "₹1 Test Pass (3-Min)";

      if (badge) {
        badge.style.display = "inline-flex";
        badge.textContent = `${(membership.plan_type === "daily_autopay" ? "AUTOPAY" : (membership.plan_type === "3min_test" ? "3MIN TEST" : (membership.plan_type || "PRO"))).toUpperCase()} PASS`;
        badge.style.background = "var(--status-optimal)";
        badge.style.color = "#FFFFFF";
      }
      if (status) status.textContent = "VERIFIED";
      if (planName) planName.textContent = displayName;
      if (planStatus) {
        let validText = "● Lifetime Active";
        if (membership.valid_until) {
          const d = new Date(membership.valid_until);
          const isToday = d.toDateString() === new Date().toDateString();
          validText = isToday ? `● Active (${d.toLocaleTimeString()})` : `● Active (${d.toLocaleDateString()})`;
        }
        planStatus.textContent = validText;
        planStatus.className = "status-verified font-mono";
      }
      if (ctaBtn) {
        ctaBtn.textContent = "Manage Clearance Profile →";
        ctaBtn.style.backgroundColor = "var(--bg-card)";
        ctaBtn.style.color = "var(--text-primary)";
        ctaBtn.style.border = "1px solid var(--border-primary)";
      }
      if (desc) desc.textContent = "Your institutional sovereign research clearance is verified with unlimited statutory telemetry.";
    } else {
      if (badge) {
        badge.textContent = "";
        badge.style.display = "none";
      }
      if (status) status.textContent = "MEMBERSHIP";
      if (planName) planName.textContent = "Standard Access";
      if (planStatus) {
        planStatus.textContent = "";
        planStatus.className = "font-mono";
        planStatus.style.color = "var(--text-secondary)";
      }
      if (ctaBtn) {
        ctaBtn.textContent = "Upgrade to Premium Plan";
        ctaBtn.style.backgroundColor = "var(--accent)";
        ctaBtn.style.color = "#FFFFFF";
        ctaBtn.style.border = "none";
      }
      if (desc) desc.textContent = "";
    }
  }

  // ================= DYNAMIC PAID MEMBER CONTENT ENGINE (OPTION B SUPABASE) =================
  async function syncMemberExclusiveContent(membership) {
    const isMember = Boolean(
      membership &&
      membership.status === "active" &&
      ["lifetime", "annual", "monthly", "daily_autopay", "3min_test"].includes(membership.plan_type)
    );

    // 1. Section 1 (Unincorporated Entities): "sole proprietorship is best for start up"
    const unincorporatedSec = document.getElementById("sec-module-2") || document.getElementById("sec-module-11") || document.getElementById("sec-unincorporated");
    if (unincorporatedSec) {
      const entityItems = unincorporatedSec.querySelectorAll(".entity-item");
      let solePropCard = null;
      for (const item of entityItems) {
        const titleEl = item.querySelector(".entity-name");
        if (titleEl && titleEl.textContent.includes("Sole Proprietorship")) {
          solePropCard = item;
          break;
        }
      }

      let existingNote = document.getElementById("paid-sole-prop-note");
      if (isMember) {
        if (!existingNote && solePropCard) {
          const noteDiv = document.createElement("div");
          noteDiv.className = "paid-member-intel font-mono";
          noteDiv.id = "paid-sole-prop-note";
          noteDiv.innerHTML = `
            <span class="paid-intel-pill">[PRO INSIGHT]</span>
            <span class="paid-intel-text">sole proprietorship is best for start up</span>
          `;
          solePropCard.appendChild(noteDiv);
        }
      } else {
        if (existingNote) {
          existingNote.remove();
        }
      }
    }

    // 2. Chapter 3: "Chapter 3: Paid Membership Confirmed"
    const contentArea = document.querySelector(".content-area");
    const forumSec = document.getElementById("forum-section");
    const treeScroll = document.getElementById("tree-content-scroll");

    let memberCh3Container = document.getElementById("member-chapter-3-container");
    let treeNodeCh3 = document.getElementById("tree-node-chapter-3");

    if (isMember) {
      // Inject Chapter 3 into main viewport if not present
      if (!memberCh3Container && contentArea && forumSec) {
        memberCh3Container = document.createElement("div");
        memberCh3Container.id = "member-chapter-3-container";
        memberCh3Container.innerHTML = `
          <div class="chapter-divider" style="margin: 54px 0 28px; border-top: 1.5px dashed var(--border-primary);"></div>
          <div class="chapter-anchor" id="sec-chapter-3"></div>
          <div class="section-tag-row font-mono main-chapter-header">
            <span class="tag-bracket">[</span><span class="tag-text">CHAPTER 03 • PRO CLEARANCE EXCLUSIVE</span><span class="tag-bracket">]</span>
          </div>
          <h2 class="institutional-title" style="font-size: 2.1rem; margin-top: 10px;">Chapter 3: Paid Membership Confirmed</h2>
          <section id="sec-chapter-3-content" class="page-directory-section member-exclusive-section" data-node-idx="13">
            <p class="story-narrative-lead" style="font-size: 1.05rem; line-height: 1.7; margin-bottom: 16px;">
              Your paid institutional membership is verified and active. All statutory telemetry, deep forensic filings, and sovereign models are unlocked across your account.
            </p>
            <div class="entity-cards-grid" style="margin-top: 16px;">
              <div class="entity-item" style="border-left: 3.5px solid var(--status-optimal);">
                <h4 class="entity-name" style="color: var(--status-optimal);">Clearance Protocol Active</h4>
                <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 6px;">
                  Continuous statutory surveillance enabled. MCA V3 statutory intelligence, auditor red flags, and sovereign models are active.
                </p>
              </div>
            </div>
          </section>
        `;
        contentArea.insertBefore(memberCh3Container, forumSec);

        // Attach action cluster to the new chapter section
        if (typeof initSectionActionsCluster === "function") {
          initSectionActionsCluster();
        }
      }

      // Update Chapter 2 branch styling when Chapter 3 is present
      const ch2Guide = document.getElementById("tree-guide-ch2");
      if (ch2Guide) ch2Guide.innerHTML = "";
      const ch2Children = document.querySelectorAll(".tree-ch2-child .tree-guide");
      ch2Children.forEach((g, i) => {
        g.innerHTML = (i === ch2Children.length - 1) ? "&#9492;&#9472;&#9472;" : "&#9500;&#9472;&#9472;";
      });

      // Inject Chapter 3 node into Directory Tree if not present
      if (!treeNodeCh3 && treeScroll) {
        const forumTreeNode = treeScroll.querySelector('a[href="#forum-section"]');
        if (forumTreeNode) {
          treeNodeCh3 = document.createElement("a");
          treeNodeCh3.href = "#sec-chapter-3";
          treeNodeCh3.className = "tree-node tree-chapter-node";
          treeNodeCh3.id = "tree-node-chapter-3";
          treeNodeCh3.dataset.level = "1";
          treeNodeCh3.innerHTML = `
            <span class="tree-name font-mono">3 Paid Membership Confirmed</span>
            <span class="tree-badge font-mono">CH 03</span>
          `;
          treeScroll.insertBefore(treeNodeCh3, forumTreeNode);
        }
      }

      document.body.classList.add("is-pro-member");
    } else {
      // Revert Chapter 2 branch styling when Chapter 3 is absent
      const ch2Guide = document.getElementById("tree-guide-ch2");
      if (ch2Guide) ch2Guide.innerHTML = "";
      const ch2Children = document.querySelectorAll(".tree-ch2-child .tree-guide");
      ch2Children.forEach((g, i) => {
        g.innerHTML = (i === ch2Children.length - 1) ? "&#9492;&#9472;&#9472;" : "&#9500;&#9472;&#9472;";
      });

      // Remove Chapter 3 and Directory Tree node
      if (memberCh3Container) {
        memberCh3Container.remove();
      }
      if (treeNodeCh3) {
        treeNodeCh3.remove();
      }
      document.body.classList.remove("is-pro-member");
    }

    // Rebind tree & ticks so scroll spy, arrow keys, and status dots update
    if (typeof rebindTreeAndTicksEvents === "function") {
      rebindTreeAndTicksEvents();
    }
  }

  window.syncMemberExclusiveContent = syncMemberExclusiveContent;

  function updateAccountBarStatusPill(mode, labelText) {
    const pill = document.getElementById("account-bar-status-pill");
    if (!pill) return;
    if (mode === "verified" || mode === "online") {
      pill.style.color = "var(--status-optimal)";
      pill.innerHTML = `<span class="pulse-dot" style="background: var(--status-optimal);"></span> ${escFloatHtml(labelText)}`;
    } else {
      pill.style.color = "var(--text-tertiary)";
      pill.innerHTML = `<span class="pulse-dot" style="background: var(--text-tertiary);"></span> ${escFloatHtml(labelText)}`;
    }
  }

  
  // ================= RAZORPAY SOVEREIGN CLEARANCE CHECKOUT ENGINE =================
  const DEFAULT_RAZORPAY_KEY_ID = "rzp_live_TwBGCSnpYdT9r5";

  async function ensureRazorpayLoaded() {
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const existing = document.querySelector("script[src*='checkout.razorpay.com']");
      if (existing) {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        setTimeout(() => resolve(!!window.Razorpay), 2500);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
      setTimeout(() => resolve(!!window.Razorpay), 4000);
    });
  }

  async function triggerDirectRazorpayCheckout(plan = "lifetime", amount = 99) {
    const sb = window.IndexIndiaSupabase;
    if (!sb || !sb.isAuthenticated()) {
      if (typeof window.openTopFloatingBar === "function") {
        window.openTopFloatingBar("account");
      }
      alert("Please sign in or create an account in the Account panel first so your Sovereign Clearance is linked to your email identity.");
      return;
    }

    const user = sb.getUser();
    const btn = document.getElementById("btn-account-razorpay-upgrade") || document.getElementById("btn-guest-razorpay-upgrade");
    const originalText = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>Connecting to Razorpay...</span>`;
    }

    try {
      const loaded = await ensureRazorpayLoaded();
      if (!loaded || !window.Razorpay) {
        alert("Could not load Razorpay checkout script. Please check your internet connection.");
        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
        return;
      }

      const CLOUDFLARE_WORKER_URL = (localStorage.getItem("indexindia_cf_worker_url") || "https://indexindia.dhaumyakumar27-235.workers.dev").trim();
      let orderData = null;

      if (CLOUDFLARE_WORKER_URL) {
        try {
          const orderRes = await fetch(`${CLOUDFLARE_WORKER_URL}/api/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan: plan,
              userId: user.id,
              email: user.email
            })
          });
          if (orderRes.ok) {
            orderData = await orderRes.json();
          }
        } catch (cfErr) {
          console.warn("[Razorpay] Worker order creation fallback:", cfErr);
        }
      }

      let rzpKeyId = (orderData && orderData.keyId) || localStorage.getItem("indexindia_razorpay_key") || DEFAULT_RAZORPAY_KEY_ID;

      if (!rzpKeyId) {
        const enteredKey = prompt("Enter your Razorpay Key ID (e.g. rzp_live_...):", "");
        if (enteredKey && enteredKey.trim()) {
          rzpKeyId = enteredKey.trim();
          localStorage.setItem("indexindia_razorpay_key", rzpKeyId);
        } else {
          if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
          return;
        }
      }

      const options = {
        key: rzpKeyId,
        amount: (orderData && orderData.amount) || (amount * 100),
        currency: "INR",
        name: "IndexIndia Sovereign Research",
        description: "Lifetime Sovereign Research Clearance (\u20B999 One-Time)",
        order_id: orderData ? orderData.orderId : undefined,
        prefill: {
          email: user.email || "",
          name: user.email ? user.email.split("@")[0] : "Institutional Reader"
        },
        theme: {
          color: "#FF3B00"
        },
        notes: {
          user_id: user.id,
          plan: plan
        },
        handler: async function (response) {
          if (btn) btn.innerHTML = `<span>Verifying Clearance...</span>`;
          if (CLOUDFLARE_WORKER_URL && orderData) {
            try {
              await fetch(`${CLOUDFLARE_WORKER_URL}/api/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: user.id,
                  plan: plan
                })
              });
            } catch (vErr) {
              console.warn("[Razorpay] Worker verification warning:", vErr);
            }
          }

          if (sb && typeof sb.recordMembership === "function") {
            await sb.recordMembership({
              planType: plan,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amountPaid: amount,
              validUntil: null
            });
          }

          alert(`\u2713 Payment of \u20B9${amount} Succeeded!\nPayment Ref: ${response.razorpay_payment_id}\n\nYour Lifetime Sovereign Clearance is permanently unlocked.`);
          if (typeof renderAccountPanel === "function") renderAccountPanel();
          if (typeof syncMemberExclusiveContent === "function") {
            syncMemberExclusiveContent({ status: "active", plan_type: plan, valid_until: null });
          }
        },
        modal: {
          ondismiss: function () {
            if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        alert("Payment failed: " + (resp.error?.description || "Gateway transaction declined."));
        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
      });
      rzp.open();
    } catch (err) {
      console.error("[Razorpay] Portal checkout exception:", err);
      alert("Could not initialize Razorpay checkout portal: " + (err.message || "Please check connection."));
      if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
    }
  }
  window.triggerDirectRazorpayCheckout = triggerDirectRazorpayCheckout;

  async function renderAccountPanel() {
    if (!accountPanel) return;
    try {
      const sb = window.IndexIndiaSupabase;
      const isConfigured = sb && sb.isConfigured();
      const user = sb && sb.getUser();

    // 1. If User is Authenticated (Logged In)
    if (user) {
      const email = user.email || "Authenticated Reader";
      if (typeof loadAnnotations === "function") {
        try { loadAnnotations(); } catch (e) {}
      }
      const totalDoubts = typeof getLocalDoubtsHistory === "function" ? (getLocalDoubtsHistory() || []).length : 0;
      const totalAnnotations = (typeof annotationsData !== "undefined") ? (
        (annotationsData.strokes?.length || 0) +
        (annotationsData.highlights?.length || 0) +
        (annotationsData.stickynotes?.length || 0) +
        (annotationsData.textboxes?.length || 0) +
        (annotationsData.stickers?.length || 0)
      ) : 0;

      // Query active membership
      let membership = null;
      try {
        if (sb && typeof sb.getUserMembership === "function") {
          membership = await sb.getUserMembership();
        }
      } catch (mErr) {
        console.warn("[AccountPanel] membership check:", mErr);
      }
      updateNavUpgradePanel(membership);

      const hasPaidPlan = membership && membership.status === "active";
      let planStatusText = "Standard Access";
      if (hasPaidPlan) {
        if (membership.valid_until) {
          const d = new Date(membership.valid_until);
          const isToday = d.toDateString() === new Date().toDateString();
          planStatusText = isToday ? `Active (Until ${d.toLocaleTimeString()})` : `Active (${d.toLocaleDateString()})`;
        } else {
          planStatusText = "Active (Lifetime)";
        }
      }

      updateAccountBarStatusPill("verified", hasPaidPlan ? `${(membership.plan_type || "PRO").toUpperCase()} PASS` : "Cloud Synced");

      accountPanel.innerHTML = `
        <div class="account-horizontal-grid">
          <div class="account-col-card">
            <div class="account-user-card" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:8px;">
              <div style="min-width:0;">
                <div class="account-field-label">Authenticated Identity</div>
                <div class="account-user-email" title="${escFloatHtml(email)}">${escFloatHtml(email)}</div>
              </div>
              ${hasPaidPlan ? `<span class="user-role-badge" style="background: #FF3B00; color: #fff; flex-shrink:0;">${escFloatHtml((membership.plan_type || "PRO").toUpperCase())} PASS</span>` : `<span class="user-id" style="flex-shrink:0;">VERIFIED</span>`}
            </div>

            <div class="panel-section" style="padding-top: 8px;">
              <div class="panel-metric-row">
                <span class="metric-label">Access Clearance</span>
                <span class="metric-value font-mono ${hasPaidPlan ? 'status-verified' : ''}">${escFloatHtml(planStatusText)}</span>
              </div>
              <div class="panel-metric-row">
                <span class="metric-label">Annotations on Page</span>
                <span class="metric-value font-mono" id="account-metric-annotations">${totalAnnotations} items</span>
              </div>
              <div class="panel-metric-row">
                <span class="metric-label">AI Doubts History</span>
                <span class="metric-value font-mono" id="account-metric-doubts">${totalDoubts} questions</span>
              </div>
              <div class="panel-metric-row">
                <span class="metric-label">Cloud Backend</span>
                <span class="metric-value status-verified font-mono">Supabase PG</span>
              </div>
            </div>
          </div>

          <div class="account-col-card" style="gap: 8px;">
            ${!hasPaidPlan ? `
              <button type="button" class="account-btn-action" id="btn-account-razorpay-upgrade" style="background-color: var(--accent); color: #FFFFFF !important; text-align: center; justify-content: center; font-weight: 700; margin-top: 0;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Upgrade to Sovereign Pass (&#8377;99 Lifetime) &rarr;
              </button>
            ` : `
              <div class="account-badge-verified-notice font-mono" style="font-size: 0.78rem; color: #00E599; padding: 6px 10px; background: rgba(0, 229, 153, 0.08); border: 1px solid rgba(0, 229, 153, 0.25); border-radius: 4px; text-align: center;">
                &#10003; Lifetime Sovereign Pass Active
              </div>
            `}
            <button type="button" class="account-btn-action" id="btn-account-sync-now" style="margin-top: 0;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
              Sync Telemetry Now
            </button>
            <button type="button" class="account-btn-secondary" id="btn-account-signout" style="margin-top: 0;">
              Sign Out
            </button>
            <div class="panel-footer" style="margin-top: 4px;">
              <div class="panel-sub-note">IndexIndia Cross-Device Cloud Sync</div>
            </div>
          </div>
        </div>
      `;

      const razorpayUpgradeBtn = document.getElementById("btn-account-razorpay-upgrade");
      if (razorpayUpgradeBtn) {
        razorpayUpgradeBtn.addEventListener("click", () => triggerDirectRazorpayCheckout("lifetime", 99));
      }

      const syncNowBtn = document.getElementById("btn-account-sync-now");
      if (syncNowBtn) {
        syncNowBtn.addEventListener("click", async () => {
          syncNowBtn.disabled = true;
          syncNowBtn.innerHTML = `<span>Syncing...</span>`;
          await triggerCloudSyncAll();
          syncNowBtn.innerHTML = `<span>✓ Telemetry Synced</span>`;
          setTimeout(() => renderAccountPanel(), 1200);
        });
      }

      const signoutBtn = document.getElementById("btn-account-signout");
      if (signoutBtn) {
        signoutBtn.addEventListener("click", async () => {
          signoutBtn.disabled = true;
          signoutBtn.textContent = "Signing out...";
          if (sb) await sb.logout();
          renderAccountPanel();
        });
      }
      return;
    }

    updateNavUpgradePanel(null);

    // 2. If Supabase is NOT configured yet
    if (!isConfigured) {
      updateAccountBarStatusPill("local", "Guest / Local");
      accountPanel.innerHTML = `
        <div class="account-horizontal-grid">
          <div class="account-col-card" style="gap: 8px;">
            <div class="panel-user-meta">
              <span class="user-id">GUEST / LOCAL STORAGE</span>
            </div>
            <div style="font-size: 0.76rem; color: var(--text-secondary); line-height: 1.5;">
              Connect your <strong>Supabase</strong> project to automatically sync annotations, notes &amp; AI doubts across devices.
            </div>
            <div class="account-status-msg" id="account-status-msg"></div>
            <div class="panel-footer" style="margin-top: auto;">
              <div class="panel-sub-note">Free at supabase.com &bull; Keys stored in browser</div>
            </div>
          </div>

          <div class="account-col-card">
            <div class="account-config-box" style="margin-top: 0;">
              <label class="account-field-label">Supabase Project URL</label>
              <input type="text" class="account-input" id="cfg-supabase-url" placeholder="https://xyzcompany.supabase.co" autocomplete="off" spellcheck="false" />

              <label class="account-field-label">Supabase Anon Public Key</label>
              <input type="password" class="account-input" id="cfg-supabase-key" placeholder="eyJhbGciOiJIUzI1NiIsIn..." autocomplete="off" spellcheck="false" />

              <button type="button" class="account-btn-action" id="btn-save-supabase-cfg">
                Connect Cloud Sync
              </button>
            </div>
          </div>
        </div>
      `;

      const saveCfgBtn = document.getElementById("btn-save-supabase-cfg");
      if (saveCfgBtn) {
        saveCfgBtn.addEventListener("click", async () => {
          const urlInput = document.getElementById("cfg-supabase-url");
          const keyInput = document.getElementById("cfg-supabase-key");
          const msg = document.getElementById("account-status-msg");
          const url = (urlInput ? urlInput.value : "").trim();
          const key = (keyInput ? keyInput.value : "").trim();

          if (!url || !key) {
            if (msg) {
              msg.className = "account-status-msg error";
              msg.textContent = "Please provide both Supabase URL and Anon Key.";
            }
            return;
          }

          saveCfgBtn.disabled = true;
          saveCfgBtn.textContent = "Connecting...";
          if (sb) {
            await sb.setCredentials(url, key);
          }
          renderAccountPanel();
        });
      }
      return;
    }

    // 3. Supabase IS configured, but User is LOGGED OUT
    updateAccountBarStatusPill("online", "Cloud Ready");
    const config = sb.getConfig();
    accountPanel.innerHTML = `
      <div class="account-horizontal-grid">
        <div class="account-col-card">
          <div class="account-auth-tabs" style="margin-bottom: 10px;">
            <button type="button" class="account-auth-tab ${accountActiveTab === "signin" ? "active" : ""}" id="tab-auth-signin">Sign In</button>
            <button type="button" class="account-auth-tab ${accountActiveTab === "signup" ? "active" : ""}" id="tab-auth-signup">Sign Up</button>
            <button type="button" class="account-auth-tab ${accountActiveTab === "magic" ? "active" : ""}" id="tab-auth-magic">Magic Link</button>
          </div>

          <button type="button" class="account-btn-action account-google-btn" id="btn-auth-google" style="margin-top: 0; margin-bottom: 8px;">
            <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Sign in with Google
          </button>

          <button type="button" class="account-btn-action" id="btn-guest-razorpay-upgrade" style="margin-top: 0; background-color: var(--accent); color: #FFFFFF !important; font-weight: 700;">
            Lifetime Sovereign Clearance &bull; &#8377;99 &rarr;
          </button>

          ${isConfigBoxVisible ? `
            <div class="account-config-box" style="margin-top: 8px;">
              <label class="account-field-label">Supabase URL</label>
              <input type="text" class="account-input" id="cfg-supabase-url" value="${escFloatHtml(config.url || '')}" />
              <label class="account-field-label">Anon Key</label>
              <input type="password" class="account-input" id="cfg-supabase-key" value="${escFloatHtml(config.anonKey || '')}" />
              <button type="button" class="account-btn-action" id="btn-save-supabase-cfg">Update Keys</button>
            </div>
          ` : ''}

          <button type="button" class="account-config-toggle" id="btn-toggle-cfg" style="margin-top: 8px;">
            ${isConfigBoxVisible ? "Hide Supabase Settings" : "⚙ Supabase Settings"}
          </button>
        </div>

        <div class="account-col-card">
          <div class="account-status-msg" id="account-status-msg"></div>

          <form id="account-auth-form" autocomplete="on">
            <label class="account-field-label">Email Address</label>
            <input type="email" class="account-input" id="auth-email" placeholder="reader@institutional.com" required autocomplete="email" />

            ${accountActiveTab !== "magic" ? `
              <label class="account-field-label">Password</label>
              <div class="account-password-wrapper">
                <input type="password" class="account-input" id="auth-password" placeholder="••••••••••••" required autocomplete="current-password" />
                <button type="button" class="account-pwd-toggle-btn" id="btn-toggle-pwd" title="Show / Hide Password" aria-label="Toggle password visibility">
                  <svg class="pwd-eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="7" r="3"></circle>
                  </svg>
                </button>
              </div>
            ` : ''}

            <button type="submit" class="account-btn-action" id="btn-auth-submit">
              ${accountActiveTab === "signin" ? "Sign In" : (accountActiveTab === "signup" ? "Create Account" : "Send Magic Link")}
            </button>
          </form>

          <div class="panel-footer" style="margin-top: 10px;">
            <div class="panel-sub-note">Local-First Storage &bull; End-to-End Encrypted</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("tab-auth-signin")?.addEventListener("click", () => { accountActiveTab = "signin"; renderAccountPanel(); });
    document.getElementById("tab-auth-signup")?.addEventListener("click", () => { accountActiveTab = "signup"; renderAccountPanel(); });
    document.getElementById("tab-auth-magic")?.addEventListener("click", () => { accountActiveTab = "magic"; renderAccountPanel(); });

    // Show / Hide password toggle button listener
    const pwdToggleBtn = document.getElementById("btn-toggle-pwd");
    if (pwdToggleBtn) {
      pwdToggleBtn.addEventListener("click", () => {
        const pwdInput = document.getElementById("auth-password");
        if (!pwdInput) return;
        const isHidden = pwdInput.type === "password";
        pwdInput.type = isHidden ? "text" : "password";
        pwdToggleBtn.innerHTML = isHidden ? `
          <svg class="pwd-eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        ` : `
          <svg class="pwd-eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="7" r="3"></circle>
          </svg>
        `;
      });
    }

    document.getElementById("btn-toggle-cfg")?.addEventListener("click", () => {
      isConfigBoxVisible = !isConfigBoxVisible;
      renderAccountPanel();
    });

    document.getElementById("btn-auth-google")?.addEventListener("click", async () => {
      const msg = document.getElementById("account-status-msg");
      const googleBtn = document.getElementById("btn-auth-google");
      if (googleBtn) {
        googleBtn.disabled = true;
        googleBtn.innerHTML = `<span>Connecting Google (New Tab)...</span>`;
      }
      try {
        await sb.loginWithGoogle();
      } catch (err) {
        if (msg) {
          msg.className = "account-status-msg error";
          msg.innerHTML = `<strong>Google Sign-in:</strong><br>${escFloatHtml(err.message || "Google sign-in could not be completed.")}`;
        }
      } finally {
        if (googleBtn) {
          googleBtn.disabled = false;
          googleBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Sign in with Google
          `;
        }
      }
    });

    const guestUpgradeBtn = document.getElementById("btn-guest-razorpay-upgrade");
    if (guestUpgradeBtn) {
      guestUpgradeBtn.addEventListener("click", () => triggerDirectRazorpayCheckout("lifetime", 99));
    }

    const authForm = document.getElementById("account-auth-form");
    if (authForm) {
      authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("auth-email")?.value.trim();
        const password = document.getElementById("auth-password")?.value;
        const msg = document.getElementById("account-status-msg");
        const submitBtn = document.getElementById("btn-auth-submit");

        if (!email) return;

        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";

        try {
          if (accountActiveTab === "signin") {
            await sb.loginWithEmailPassword(email, password);
            renderAccountPanel();
          } else if (accountActiveTab === "signup") {
            const signupRes = await sb.registerWithEmailPassword(email, password);
            if (signupRes && signupRes.session) {
              renderAccountPanel();
            } else {
              if (msg) {
                msg.className = "account-status-msg success";
                msg.innerHTML = "<strong>✓ Account Created!</strong><br>Check your email inbox and click the verification link before signing in.<br><span style='font-size:0.67rem;opacity:0.9;'>Note: If you don't receive an email or want instant access, uncheck 'Confirm email' in Supabase Dashboard -> Authentication -> Providers -> Email.</span>";
              }
            }
          } else if (accountActiveTab === "magic") {
            await sb.loginWithMagicLink(email);
            if (msg) {
              msg.className = "account-status-msg success";
              msg.innerHTML = "<strong>✓ Magic Link Dispatched!</strong><br>Check your email inbox and click the sign-in link.";
            }
          }
        } catch (err) {
          if (msg) {
            msg.className = "account-status-msg error";
            const errStr = (err.message || "").toLowerCase();
            if (errStr.includes("invalid login credentials")) {
              msg.innerHTML = "<strong>Invalid login credentials.</strong><br><span style='font-size:0.68rem;line-height:1.35;display:inline-block;margin-top:2px;'>1. If you just registered, check your email inbox to click the verification link first.<br>2. If you don't have an account yet, switch to <strong>Sign Up</strong>.<br>3. Check your password for typos using the eye icon.</span>";
            } else if (errStr.includes("user already registered")) {
              msg.innerHTML = "<strong>User already exists.</strong><br>Please switch to <strong>Sign In</strong> to log in with your password, or use Magic Link.";
            } else {
              msg.textContent = err.message || "Authentication error.";
            }
          }
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = accountActiveTab === "signin" ? "Sign In" : (accountActiveTab === "signup" ? "Create Account" : "Send Magic Link");
        }
      });
    }

    const saveCfgBtn = document.getElementById("btn-save-supabase-cfg");
    if (saveCfgBtn) {
      saveCfgBtn.addEventListener("click", async () => {
        const urlInput = document.getElementById("cfg-supabase-url");
        const keyInput = document.getElementById("cfg-supabase-key");
        const url = (urlInput ? urlInput.value : "").trim();
        const key = (keyInput ? keyInput.value : "").trim();
        if (sb) await sb.setCredentials(url, key);
        isConfigBoxVisible = false;
        renderAccountPanel();
      });
    }
    } catch (err) {
      console.error("[AccountPanel] render error:", err);
    }
  }

  // Bind auth state change to re-render account panel, update badges, and sync exclusive content
  async function handleAuthChange(event, user) {
    renderAccountPanel();
    if (typeof refreshContactAuthUI === "function") {
      refreshContactAuthUI();
    }
    if (user) {
      triggerCloudSyncAll();
      if (window.IndexIndiaSupabase && typeof window.IndexIndiaSupabase.getUserMembership === "function") {
        try {
          const m = await window.IndexIndiaSupabase.getUserMembership();
          updateNavUpgradePanel(m);
          syncMemberExclusiveContent(m);
        } catch (e) {}
      }
    } else {
      updateNavUpgradePanel(null);
      syncMemberExclusiveContent(null);
    }
  }

  if (window.IndexIndiaSupabase) {
    window.IndexIndiaSupabase.onAuthStateChange(handleAuthChange);
  } else {
    window.addEventListener("load", () => {
      if (window.IndexIndiaSupabase) {
        window.IndexIndiaSupabase.onAuthStateChange(handleAuthChange);
      }
    });
  }

  // Pre-render account panel and check membership on initial boot
  if (typeof renderAccountPanel === "function") {
    renderAccountPanel();
  }
  if (window.IndexIndiaSupabase && typeof window.IndexIndiaSupabase.getUserMembership === "function") {
    window.IndexIndiaSupabase.getUserMembership().then((m) => {
      updateNavUpgradePanel(m);
      syncMemberExclusiveContent(m);
    }).catch(() => {});
  }

  // Background 5-second telemetry heartbeat for auto-renewal and live access control
  setInterval(async () => {
    if (window.IndexIndiaSupabase && window.IndexIndiaSupabase.isAuthenticated()) {
      try {
        const m = await window.IndexIndiaSupabase.getUserMembership();
        updateNavUpgradePanel(m);
        syncMemberExclusiveContent(m);
      } catch (e) {}
    }
  }, 5000);

  // ================= 4. GLOBAL KEYBOARD SHORTCUTS =================
  // Simple Tab press toggles directly between Guide <=> Index

  // ================= SMOOTH DELAYLESS KEYBOARD SCROLLING ENGINE =================
  // Continuous 60fps/120fps motion with ZERO repeat delay when holding arrow keys.
  // Supports vertical (Up/Down) and horizontal (Left/Right) smooth scrolling.
  // Uses integer pixel rounding (Math.trunc) to eliminate subpixel font rasterization jumping.
  let smoothScrollRaf = null;
  let activeArrowDirection = 0; // +1 = down, -1 = up, 0 = idle
  let smoothVelocity = 0;
  let isArrowHeld = false;
  let isFastScroll = false;
  let lastFrameTime = 0;
  let subPixelAccumulator = 0;

  let activeHorizontalDirection = 0; // +1 = right, -1 = left, 0 = idle
  let smoothHorizontalVelocity = 0;
  let isHorizontalHeld = false;
  let isFastHorizontalScroll = false;
  let subPixelHorizontalAccumulator = 0;

  const NORMAL_CRUISE_SPEED = 9.5; // pixels per frame at 60fps (~570px/sec cruising speed)
  const NORMAL_TAP_VELOCITY = 3.8; // gentle initial impulse on tap (~26-30px total displacement)
  const NORMAL_ACCEL = 0.42; // smooth ramp-up to cruising speed while held (~250ms)

  const FAST_CRUISE_SPEED = 28.0; // accelerated cruising speed (~1680px/sec, ~2.9x faster)
  const FAST_TAP_VELOCITY = 10.0; // crisp initial impulse for fast scroll
  const FAST_ACCEL = 1.35; // smooth ramp-up to fast cruise speed (~250ms)

  const FRICTION = 0.84; // silky ~120ms ease-out on key release

  let isShiftHeld = false;

  function cancelSmoothScrollImmediately() {
    isArrowHeld = false;
    isHorizontalHeld = false;
    isFastScroll = false;
    isFastHorizontalScroll = false;
    isShiftHeld = false;
    smoothVelocity = 0;
    smoothHorizontalVelocity = 0;
    activeArrowDirection = 0;
    activeHorizontalDirection = 0;
    subPixelAccumulator = 0;
    subPixelHorizontalAccumulator = 0;
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

    // Vertical physics
    const isAcceleratedV = Boolean(isFastScroll || isShiftHeld);
    const targetMaxV = isAcceleratedV ? FAST_CRUISE_SPEED : NORMAL_CRUISE_SPEED;
    const targetAccelV = isAcceleratedV ? FAST_ACCEL : NORMAL_ACCEL;

    if (isArrowHeld) {
      if (smoothVelocity < targetMaxV) {
        smoothVelocity = Math.min(targetMaxV, smoothVelocity + targetAccelV * timeScale);
      } else if (smoothVelocity > targetMaxV) {
        smoothVelocity = Math.max(targetMaxV, smoothVelocity * Math.pow(FRICTION, timeScale));
      }
    } else {
      smoothVelocity *= Math.pow(FRICTION, timeScale);
    }

    // Horizontal physics
    const isAcceleratedH = Boolean(isFastHorizontalScroll || isShiftHeld);
    const targetMaxH = isAcceleratedH ? FAST_CRUISE_SPEED : NORMAL_CRUISE_SPEED;
    const targetAccelH = isAcceleratedH ? FAST_ACCEL : NORMAL_ACCEL;

    if (isHorizontalHeld) {
      if (smoothHorizontalVelocity < targetMaxH) {
        smoothHorizontalVelocity = Math.min(targetMaxH, smoothHorizontalVelocity + targetAccelH * timeScale);
      } else if (smoothHorizontalVelocity > targetMaxH) {
        smoothHorizontalVelocity = Math.max(targetMaxH, smoothHorizontalVelocity * Math.pow(FRICTION, timeScale));
      }
    } else {
      smoothHorizontalVelocity *= Math.pow(FRICTION, timeScale);
    }

    let hasMotion = false;

    // Apply Vertical displacement
    if (smoothVelocity > 0.4 && activeArrowDirection !== 0) {
      hasMotion = true;
      subPixelAccumulator += activeArrowDirection * smoothVelocity * timeScale;
      const intStepY = Math.trunc(subPixelAccumulator);

      if (intStepY !== 0) {
        subPixelAccumulator -= intStepY;
        const prevScrollY = window.scrollY;
        window.scrollBy(0, intStepY);

        // Stop velocity if boundary reached
        if (window.scrollY === prevScrollY) {
          smoothVelocity = 0;
          if (!isArrowHeld) {
            activeArrowDirection = 0;
          }
        }
      }
    } else if (!isArrowHeld) {
      smoothVelocity = 0;
      activeArrowDirection = 0;
      subPixelAccumulator = 0;
    }

    // Apply Horizontal displacement
    if (smoothHorizontalVelocity > 0.4 && activeHorizontalDirection !== 0) {
      hasMotion = true;
      subPixelHorizontalAccumulator += activeHorizontalDirection * smoothHorizontalVelocity * timeScale;
      const intStepX = Math.trunc(subPixelHorizontalAccumulator);

      if (intStepX !== 0) {
        subPixelHorizontalAccumulator -= intStepX;
        const prevScrollX = window.scrollX;
        window.scrollBy(intStepX, 0);

        // Stop velocity if boundary reached
        if (window.scrollX === prevScrollX) {
          smoothHorizontalVelocity = 0;
          if (!isHorizontalHeld) {
            activeHorizontalDirection = 0;
          }
        }
      }
    } else if (!isHorizontalHeld) {
      smoothHorizontalVelocity = 0;
      activeHorizontalDirection = 0;
      subPixelHorizontalAccumulator = 0;
    }

    if (hasMotion || isArrowHeld || isHorizontalHeld) {
      smoothScrollRaf = requestAnimationFrame(stepSmoothScroll);
    } else {
      cancelSmoothScrollImmediately();
    }
  }

  function startSmoothScroll(direction, fast = false) {
    activeArrowDirection = direction;
    isArrowHeld = true;
    isFastScroll = Boolean(fast || isShiftHeld);
    const initialVelocity = isFastScroll ? FAST_TAP_VELOCITY : NORMAL_TAP_VELOCITY;
    if (smoothVelocity < initialVelocity) {
      smoothVelocity = initialVelocity;
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

  function startHorizontalSmoothScroll(direction, fast = false) {
    activeHorizontalDirection = direction;
    isHorizontalHeld = true;
    isFastHorizontalScroll = Boolean(fast || isShiftHeld);
    const initialVelocity = isFastHorizontalScroll ? FAST_TAP_VELOCITY : NORMAL_TAP_VELOCITY;
    if (smoothHorizontalVelocity < initialVelocity) {
      smoothHorizontalVelocity = initialVelocity;
    }
    if (!smoothScrollRaf) {
      lastFrameTime = 0;
      subPixelHorizontalAccumulator = 0;
      smoothScrollRaf = requestAnimationFrame(stepSmoothScroll);
    }
  }

  function stopHorizontalSmoothScroll() {
    isHorizontalHeld = false;
  }

  function snapToMainContentSection() {
    cancelSmoothScrollImmediately();
    const mainEl = document.querySelector(".main-viewport-wrapper") ||
                   document.querySelector(".content-area") ||
                   document.querySelector("main") ||
                   document.body;
    if (!mainEl) {
      window.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    const rect = mainEl.getBoundingClientRect();
    const docLeft = rect.left + window.scrollX;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    let leftOffset = 0;
    if (typeof isTreeCurrentlyOpen === "function" && isTreeCurrentlyOpen() && railNavigator) {
      leftOffset = railNavigator.offsetWidth || 455;
    }

    const availableWidth = Math.max(300, viewportWidth - leftOffset);
    let targetX = 0;

    if (rect.width < availableWidth) {
      targetX = Math.round(docLeft - leftOffset - (availableWidth - rect.width) / 2);
    } else {
      targetX = Math.round(docLeft - leftOffset);
    }

    targetX = Math.max(0, targetX);
    window.scrollTo({
      left: targetX,
      behavior: "smooth"
    });
  }

  // ================= MOUSE CANVAS PANNING (DRAG TO MOVE PAGE LEFT & RIGHT) =================
  let isPanningCanvas = false;
  let panStartX = 0;
  let panStartY = 0;
  let panScrollStartX = 0;
  let panScrollStartY = 0;
  let isSpaceKeyDown = false;

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      if (!isSpaceKeyDown) {
        isSpaceKeyDown = true;
        if (typeof annotationState !== "undefined" && (annotationState.isOpen || document.body.classList.contains("is-annotating") || document.body.classList.contains("has-annotations"))) {
          document.body.classList.add("is-panning-canvas");
        }
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      isSpaceKeyDown = false;
      if (!isPanningCanvas && (typeof annotationState === "undefined" || annotationState.activeTool !== "pan")) {
        document.body.classList.remove("is-panning-canvas");
      }
    }
  });

  document.addEventListener("pointerdown", (e) => {
    const isMiddleClick = e.button === 1;
    const isPanMode = isSpaceKeyDown || (typeof annotationState !== "undefined" && annotationState.activeTool === "pan");
    if (!isMiddleClick && !isPanMode) return;
    if (typeof isInsideNavigationPanels === "function" && isInsideNavigationPanels(e)) return;

    isPanningCanvas = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panScrollStartX = window.scrollX;
    panScrollStartY = window.scrollY;
    document.body.classList.add("is-panning-canvas", "is-mouse-down");
    e.preventDefault();
  });

  document.addEventListener("pointermove", (e) => {
    if (!isPanningCanvas) return;
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;
    window.scrollTo({
      left: Math.max(0, panScrollStartX - dx),
      top: Math.max(0, panScrollStartY - dy),
      behavior: "auto"
    });
  });

  const stopCanvasPan = () => {
    if (isPanningCanvas) {
      isPanningCanvas = false;
      document.body.classList.remove("is-mouse-down");
      if (!isSpaceKeyDown && (typeof annotationState === "undefined" || annotationState.activeTool !== "pan")) {
        document.body.classList.remove("is-panning-canvas");
      }
    }
  };

  document.addEventListener("pointerup", stopCanvasPan);
  document.addEventListener("pointercancel", stopCanvasPan);

  // ==========================================================================
  // CUSTOMIZABLE & CLOUD-SYNCED KEYBOARD SHORTCUTS SYSTEM
  // ==========================================================================
  const ALLOWED_SOLO_KEYS = new Set([
    "Tab",
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "CapsLock",
    "Backspace",
    "Enter",
    "Space", " ",
    "Escape",
    "PageUp", "PageDown", "Home", "End"
  ]);

  const DEFAULT_SHORTCUTS = {
    moveChapterDown: {
      id: "moveChapterDown",
      group: "NAVIGATION & SUITE",
      desc: "Move Main Chapter Next",
      key: "ArrowDown",
      code: "ArrowDown",
      ctrlKey: false,
      altKey: true,
      shiftKey: false,
      metaKey: false,
      display: "Alt + ↓"
    },
    moveChapterUp: {
      id: "moveChapterUp",
      group: "NAVIGATION & SUITE",
      desc: "Move Main Chapter Prev",
      key: "ArrowUp",
      code: "ArrowUp",
      ctrlKey: false,
      altKey: true,
      shiftKey: false,
      metaKey: false,
      display: "Alt + ↑"
    },
    moveSectionDown: {
      id: "moveSectionDown",
      group: "NAVIGATION & SUITE",
      desc: "Move Section & Subsection Next",
      key: "ArrowDown",
      code: "ArrowDown",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + ↓"
    },
    moveSectionUp: {
      id: "moveSectionUp",
      group: "NAVIGATION & SUITE",
      desc: "Move Section & Subsection Prev",
      key: "ArrowUp",
      code: "ArrowUp",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + ↑"
    },
    fastScrollDown: {
      id: "fastScrollDown",
      group: "NAVIGATION & SUITE",
      desc: "Fast Scroll Page Down",
      key: "ArrowDown",
      code: "ArrowDown",
      ctrlKey: false,
      altKey: false,
      shiftKey: true,
      metaKey: false,
      display: "Shift + ↓"
    },
    fastScrollUp: {
      id: "fastScrollUp",
      group: "NAVIGATION & SUITE",
      desc: "Fast Scroll Page Up",
      key: "ArrowUp",
      code: "ArrowUp",
      ctrlKey: false,
      altKey: false,
      shiftKey: true,
      metaKey: false,
      display: "Shift + ↑"
    },
    fastScrollRight: {
      id: "fastScrollRight",
      group: "NAVIGATION & SUITE",
      desc: "Fast Scroll Page Right",
      key: "ArrowRight",
      code: "ArrowRight",
      ctrlKey: false,
      altKey: false,
      shiftKey: true,
      metaKey: false,
      display: "Shift + →"
    },
    fastScrollLeft: {
      id: "fastScrollLeft",
      group: "NAVIGATION & SUITE",
      desc: "Fast Scroll Page Left",
      key: "ArrowLeft",
      code: "ArrowLeft",
      ctrlKey: false,
      altKey: false,
      shiftKey: true,
      metaKey: false,
      display: "Shift + ←"
    },
    scrollDown: {
      id: "scrollDown",
      group: "NAVIGATION & SUITE",
      desc: "Scroll Page Smoothly Down",
      key: "ArrowDown",
      code: "ArrowDown",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "↓"
    },
    scrollUp: {
      id: "scrollUp",
      group: "NAVIGATION & SUITE",
      desc: "Scroll Page Smoothly Up",
      key: "ArrowUp",
      code: "ArrowUp",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "↑"
    },
    scrollRight: {
      id: "scrollRight",
      group: "NAVIGATION & SUITE",
      desc: "Scroll Page Smoothly Right",
      key: "ArrowRight",
      code: "ArrowRight",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "→"
    },
    scrollLeft: {
      id: "scrollLeft",
      group: "NAVIGATION & SUITE",
      desc: "Scroll Page Smoothly Left",
      key: "ArrowLeft",
      code: "ArrowLeft",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "←"
    },
    snapToMainContent: {
      id: "snapToMainContent",
      group: "NAVIGATION & SUITE",
      desc: "Center Viewport to Main Content",
      key: " ",
      code: "Space",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + Space"
    },
    directoryTree: {
      id: "directoryTree",
      group: "NAVIGATION & SUITE",
      desc: "Directory Tree Drawer",
      key: ",",
      code: "Comma",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + ,"
    },
    contactUs: {
      id: "contactUs",
      group: "NAVIGATION & SUITE",
      desc: "Contact Us (Report Issue)",
      key: "c",
      code: "KeyC",
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + Alt + C"
    },
    feedbackRadar: {
      id: "feedbackRadar",
      group: "NAVIGATION & SUITE",
      desc: "Feedback (Suggest Feature)",
      key: "f",
      code: "KeyF",
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + Alt + F"
    },
    shortcutsPanel: {
      id: "shortcutsPanel",
      group: "COMMANDS & PREFERENCES",
      desc: "Shortcuts Panel",
      key: "\\",
      code: "Backslash",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + \\"
    },
    universalSearch: {
      id: "universalSearch",
      group: "COMMANDS & PREFERENCES",
      desc: "Universal Search & Commands",
      key: "/",
      code: "Slash",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + /"
    },
    doubtSolver: {
      id: "doubtSolver",
      group: "COMMANDS & PREFERENCES",
      desc: "AI Doubt Solver",
      key: ".",
      code: "Period",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + ."
    },
    editAnnotations: {
      id: "editAnnotations",
      group: "COMMANDS & PREFERENCES",
      desc: "Edit & Markup Tools",
      key: ";",
      code: "Semicolon",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + ;"
    },
    fullScreen: {
      id: "fullScreen",
      group: "COMMANDS & PREFERENCES",
      desc: "Full Screen (Toggle Top Bar)",
      key: "'",
      code: "Quote",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + '"
    },
    toggleGrid: {
      id: "toggleGrid",
      group: "COMMANDS & PREFERENCES",
      desc: "Toggle Background Grid",
      key: "[",
      code: "BracketLeft",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + ["
    },
    toggleTheme: {
      id: "toggleTheme",
      group: "COMMANDS & PREFERENCES",
      desc: "Toggle Dark / Light Theme",
      key: "]",
      code: "BracketRight",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Ctrl + ]"
    },
    closeOverlays: {
      id: "closeOverlays",
      group: "COMMANDS & PREFERENCES",
      desc: "Close Open Overlays",
      key: "Escape",
      code: "Escape",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      display: "Esc"
    }
  };

  let activeShortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
  let recordingShortcutAction = null;
  let recordingHandlerRef = null;

  function loadLocalShortcuts() {
    try {
      const raw = localStorage.getItem("indexindia_custom_shortcuts");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.snapToMainContent && (parsed.snapToMainContent.display === "Ctrl + ← / →" || parsed.snapToMainContent.key === "ArrowLeft")) {
          delete parsed.snapToMainContent;
          localStorage.setItem("indexindia_custom_shortcuts", JSON.stringify(parsed));
        }
        for (const k in parsed) {
          if (activeShortcuts[k]) {
            activeShortcuts[k] = Object.assign({}, activeShortcuts[k], parsed[k]);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse local shortcuts:", e);
    }
  }

  loadLocalShortcuts();

  function formatKeyDisplay(key, code) {
    if (key === " ") return "Space";
    if (key === "ArrowUp") return "↑";
    if (key === "ArrowDown") return "↓";
    if (key === "ArrowLeft") return "←";
    if (key === "ArrowRight") return "→";
    if (key === "Escape") return "Esc";
    if (key && key.length === 1 && !["↑", "↓", "←", "→"].includes(key)) {
      return key.toUpperCase();
    }
    return key || code || "";
  }

  function buildShortcutDisplay(ctrl, alt, shift, meta, key, code) {
    const parts = [];
    if (ctrl || meta) parts.push("Ctrl");
    if (alt) parts.push("Alt");
    if (shift) parts.push("Shift");
    parts.push(formatKeyDisplay(key, code));
    return parts.join(" + ");
  }

  function matchesShortcut(e, sc) {
    if (!sc) return false;
    const hasCtrl = !!(e.ctrlKey || e.metaKey);
    const reqCtrl = !!(sc.ctrlKey || sc.metaKey);
    if (hasCtrl !== reqCtrl) return false;

    const hasAlt = !!e.altKey;
    const reqAlt = !!sc.altKey;
    if (hasAlt !== reqAlt) return false;

    const hasShift = !!e.shiftKey;
    const reqShift = !!sc.shiftKey;
    if (hasShift !== reqShift) return false;

    if (sc.key && e.key && sc.key.toLowerCase() === e.key.toLowerCase()) return true;
    if (sc.code && e.code && sc.code === e.code) return true;

    // Special symbol aliases
    if (sc.key === "/" && (e.key === "/" || e.code === "Slash")) return true;
    if (sc.key === "\\" && (e.key === "\\" || e.code === "Backslash")) return true;
    if (sc.key === "[" && (e.key === "[" || e.code === "BracketLeft")) return true;
    if (sc.key === "]" && (e.key === "]" || e.code === "BracketRight")) return true;
    if (sc.key === "'" && (e.key === "'" || e.code === "Quote")) return true;
    if (sc.key === ";" && (e.key === ";" || e.code === "Semicolon")) return true;
    if (sc.key === "," && (e.key === "," || e.code === "Comma")) return true;
    if (sc.key === "." && (e.key === "." || e.code === "Period")) return true;
    if ((sc.key === " " || sc.code === "Space") && (e.key === " " || e.code === "Space" || e.key === "Spacebar")) return true;

    return false;
  }

  // Validate according to user specifications:
  // - User CANNOT enter a simple key (letter, number, symbol)
  // - All of them must be Ctrl or Alt combination (Shift alone is not allowed)
  // - Buttons such as Tab, Arrow keys, CapsLock, Backspace, Enter, Space allowed in ANY combination or ALONE
  function validateShortcutInput(e) {
    if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
      return { valid: false, isModifierOnly: true };
    }

    const key = e.key;
    const code = e.code;
    const hasCtrl = !!(e.ctrlKey || e.metaKey);
    const hasAlt = !!e.altKey;
    const hasShift = !!e.shiftKey;

    const isSpecialSolo = ALLOWED_SOLO_KEYS.has(key) || ALLOWED_SOLO_KEYS.has(code);

    if (isSpecialSolo) {
      return {
        valid: true,
        data: {
          key: key,
          code: code,
          ctrlKey: hasCtrl,
          altKey: hasAlt,
          shiftKey: hasShift,
          metaKey: e.metaKey,
          display: buildShortcutDisplay(hasCtrl, hasAlt, hasShift, e.metaKey, key, code)
        }
      };
    }

    if (!hasCtrl && !hasAlt) {
      if (hasShift) {
        return {
          valid: false,
          isModifierOnly: false,
          error: `Shift-only shortcut ("Shift + ${formatKeyDisplay(key, code)}") is disallowed to prevent conflicts while typing capital letters. Please use a Ctrl or Alt combination.`
        };
      } else {
        return {
          valid: false,
          isModifierOnly: false,
          error: `Single key ("${formatKeyDisplay(key, code)}") is disallowed to prevent conflicts while typing text. Please use a Ctrl or Alt combination (e.g. Ctrl + ${formatKeyDisplay(key, code)}).`
        };
      }
    }

    return {
      valid: true,
      data: {
        key: key,
        code: code,
        ctrlKey: hasCtrl,
        altKey: hasAlt,
        shiftKey: hasShift,
        metaKey: e.metaKey,
        display: buildShortcutDisplay(hasCtrl, hasAlt, hasShift, e.metaKey, key, code)
      }
    };
  }

  function renderShortcutsPanelUI() {
    const panel = document.getElementById("shortcuts-panel");
    if (!panel) return;

    const allItems = Object.values(activeShortcuts);

    panel.innerHTML = `
      <div class="shortcut-recorder-box font-mono" id="shortcut-recorder-box" style="display:none;margin-bottom:8px;"></div>
      <div class="shortcuts-grid-3col">
        ${allItems.map(s => `
          <div class="shortcut-grid-cell" data-action-id="${escFloatHtml(s.id)}">
            <span class="shortcut-desc" title="${escFloatHtml(s.desc)}">${escFloatHtml(s.desc)}</span>
            <button type="button" class="shortcut-edit-btn ${recordingShortcutAction === s.id ? 'is-recording' : ''}" data-action-id="${escFloatHtml(s.id)}" title="Click to customize shortcut for ${escFloatHtml(s.desc)}">
              <span class="shortcut-keys"><kbd>${recordingShortcutAction === s.id ? 'Press...' : escFloatHtml(s.display)}</kbd></span>
              <span class="shortcut-pencil font-mono">✎</span>
            </button>
          </div>
        `).join("")}
      </div>
    `;

    attachShortcutPanelEvents();
  }

  function startRecordingShortcut(actionId) {
    const item = activeShortcuts[actionId];
    if (!item) return;

    recordingShortcutAction = actionId;
    renderShortcutsPanelUI();

    const recorderBox = document.getElementById("shortcut-recorder-box");
    if (recorderBox) {
      recorderBox.style.display = "block";
      recorderBox.className = "shortcut-recorder-box font-mono";
      recorderBox.innerHTML = `<strong>[RECORDING]</strong> Press new shortcut for <em>${escFloatHtml(item.desc)}</em>. <span style="opacity:0.8;">Use Ctrl/Alt or special keys (Tab, Arrows, Space, Enter). Press Esc to cancel.</span>`;
    }

    if (recordingHandlerRef) {
      window.removeEventListener("keydown", recordingHandlerRef, true);
    }

    recordingHandlerRef = function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Escape alone cancels recording
      if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
        stopRecordingShortcut(false);
        return;
      }

      const res = validateShortcutInput(e);

      if (res.isModifierOnly) {
        const liveMods = [];
        if (e.ctrlKey || e.metaKey) liveMods.push("Ctrl");
        if (e.altKey) liveMods.push("Alt");
        if (e.shiftKey) liveMods.push("Shift");
        if (recorderBox) {
          recorderBox.innerHTML = `<strong>[RECORDING]</strong> ${liveMods.join(" + ")} + <span style="animation:pulse 0.8s infinite;">[press key]</span>`;
        }
        return;
      }

      const targetBtn = document.querySelector(`.shortcut-edit-btn[data-action-id="${actionId}"]`);

      if (!res.valid) {
        if (targetBtn) {
          targetBtn.classList.remove("shortcut-shake");
          void targetBtn.offsetWidth;
          targetBtn.classList.add("shortcut-shake");
        }
        if (recorderBox) {
          recorderBox.className = "shortcut-recorder-box is-error font-mono";
          recorderBox.innerHTML = `⚠️ <strong>DISALLOWED:</strong> ${escFloatHtml(res.error)}`;
        }
        return;
      }

      // Valid shortcut! Save it
      activeShortcuts[actionId] = Object.assign({}, activeShortcuts[actionId], res.data);

      try {
        localStorage.setItem("indexindia_custom_shortcuts", JSON.stringify(activeShortcuts));
      } catch (err) {}

      // Cloud sync via Supabase if connected
      if (window.IndexIndiaSupabase && typeof window.IndexIndiaSupabase.saveUserShortcuts === "function") {
        window.IndexIndiaSupabase.saveUserShortcuts(activeShortcuts);
      }

      stopRecordingShortcut(true, `✓ Updated "${item.desc}" to ${res.data.display}! Synced.`);
    };

    window.addEventListener("keydown", recordingHandlerRef, true);
  }

  function stopRecordingShortcut(success = false, successMsg = "") {
    if (recordingHandlerRef) {
      window.removeEventListener("keydown", recordingHandlerRef, true);
      recordingHandlerRef = null;
    }
    recordingShortcutAction = null;
    renderShortcutsPanelUI();

    const recorderBox = document.getElementById("shortcut-recorder-box");
    if (recorderBox) {
      if (success && successMsg) {
        recorderBox.style.display = "block";
        recorderBox.className = "shortcut-recorder-box is-success font-mono";
        recorderBox.textContent = successMsg;
        setTimeout(() => {
          recorderBox.style.display = "none";
        }, 2400);
      } else {
        recorderBox.style.display = "none";
      }
    }
  }

  function attachShortcutPanelEvents() {
    const panel = document.getElementById("shortcuts-panel");
    if (!panel) return;

    // Attach click listeners to edit buttons
    panel.querySelectorAll(".shortcut-edit-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const actionId = btn.getAttribute("data-action-id");
        if (recordingShortcutAction === actionId) {
          stopRecordingShortcut(false);
        } else {
          startRecordingShortcut(actionId);
        }
      });
    });

    // Reset button (lives in floating bar header, bind once)
    const resetBtn = document.getElementById("btn-reset-shortcuts");
    if (resetBtn && resetBtn.dataset.bound !== "1") {
      resetBtn.dataset.bound = "1";
      resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        activeShortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
        try {
          localStorage.removeItem("indexindia_custom_shortcuts");
        } catch (err) {}

        if (window.IndexIndiaSupabase && typeof window.IndexIndiaSupabase.resetUserShortcuts === "function") {
          window.IndexIndiaSupabase.resetUserShortcuts();
        }

        stopRecordingShortcut(true, "✓ All shortcuts reset to defaults.");
      });
    }
  }

  // Hydrate shortcut panel on initialization
  renderShortcutsPanelUI();

  // Connect to Supabase account sync for cross-device shortcuts
  if (window.IndexIndiaSupabase) {
    if (typeof window.IndexIndiaSupabase.getUserShortcuts === "function") {
      window.IndexIndiaSupabase.getUserShortcuts().then(cloudShortcuts => {
        if (cloudShortcuts && typeof cloudShortcuts === "object") {
          for (const k in cloudShortcuts) {
            if (activeShortcuts[k]) {
              activeShortcuts[k] = Object.assign({}, activeShortcuts[k], cloudShortcuts[k]);
            }
          }
          renderShortcutsPanelUI();
        }
      }).catch(() => {});
    }

    if (typeof window.IndexIndiaSupabase.onAuthStateChange === "function") {
      window.IndexIndiaSupabase.onAuthStateChange((event, user) => {
        if (user && user.user_metadata && user.user_metadata.custom_shortcuts) {
          const cloud = user.user_metadata.custom_shortcuts;
          for (const k in cloud) {
            if (activeShortcuts[k]) {
              activeShortcuts[k] = Object.assign({}, activeShortcuts[k], cloud[k]);
            }
          }
          renderShortcutsPanelUI();
        } else if (user) {
          // Push local shortcuts up to user account if account has none yet
          if (typeof window.IndexIndiaSupabase.saveUserShortcuts === "function") {
            window.IndexIndiaSupabase.saveUserShortcuts(activeShortcuts);
          }
          renderShortcutsPanelUI();
        }
      });
    }
  }

  function navigateMainChapter(direction) {
    if (hasInPageTree && treeNodes.length > 0) {
      const chapterIndices = [];
      treeNodes.forEach((node, idx) => {
        const href = node.getAttribute("href") || "";
        if (
          node.classList.contains("tree-chapter-node") ||
          node.dataset.level === "1" ||
          href === "#sec-chapter-1" ||
          href === "#sec-chapter-2" ||
          href === "#forum-section" ||
          href === "#sec-footer" ||
          href.includes("chapter") ||
          href.includes("forum")
        ) {
          if (!chapterIndices.includes(idx)) chapterIndices.push(idx);
        }
      });

      if (chapterIndices.length === 0) {
        chapterIndices.push(0);
        if (treeNodes.length > 1) chapterIndices.push(treeNodes.length - 1);
      }

      if (direction === 1) {
        const nextIdx = chapterIndices.find((idx) => idx > currentSubIndex);
        const target = nextIdx !== undefined ? nextIdx : chapterIndices[chapterIndices.length - 1];
        navigateToNode(target);
      } else {
        const prevIdx = chapterIndices.slice().reverse().find((idx) => idx < currentSubIndex);
        const target = prevIdx !== undefined ? prevIdx : chapterIndices[0];
        navigateToNode(target);
      }
      return;
    }

    const mainSections = Array.from(document.querySelectorAll('.chapter-anchor, [id^="sec-stage-"], [id^="sec-track-"], #sec-curriculum-overview, #forum-section, #sec-footer, .institutional-forum-section'));
    if (mainSections.length > 0) {
      const scrollPos = window.scrollY + 120;
      let currentIdx = 0;
      for (let i = 0; i < mainSections.length; i++) {
        if (mainSections[i].offsetTop <= scrollPos) {
          currentIdx = i;
        }
      }
      const targetIdx = Math.max(0, Math.min(mainSections.length - 1, currentIdx + direction));
      mainSections[targetIdx].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function navigateSection(direction) {
    if (hasInPageTree && treeNodes.length > 0) {
      let targetIdx = currentSubIndex;
      if (direction === 1) {
        targetIdx = Math.min(treeNodes.length - 1, currentSubIndex + 1);
      } else {
        targetIdx = Math.max(0, currentSubIndex - 1);
      }
      navigateToNode(targetIdx);
      return;
    }

    const allSections = Array.from(document.querySelectorAll(".page-directory-section, .doc-section, .story-node-section, .institutional-forum-section, #sec-footer"));
    if (allSections.length > 0) {
      const scrollPos = window.scrollY + 120;
      let currentIdx = 0;
      for (let i = 0; i < allSections.length; i++) {
        if (allSections[i].offsetTop <= scrollPos) {
          currentIdx = i;
        }
      }
      const targetIdx = Math.max(0, Math.min(allSections.length - 1, currentIdx + direction));
      allSections[targetIdx].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Master Global Keydown Listener using dynamic activeShortcuts
  document.addEventListener("keydown", (e) => {
    if (recordingShortcutAction) return;

    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

    const noModifiers = !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;

    // 2. Shortcut Panel
    if (matchesShortcut(e, activeShortcuts.shortcutsPanel) || (e.key === "?" && noModifiers)) {
      e.preventDefault();
      toggleTopFloatingBar("shortcuts");
      return;
    }

    // 3. Directory Tree Drawer
    if (matchesShortcut(e, activeShortcuts.directoryTree)) {
      e.preventDefault();
      toggleTree();
      return;
    }

    // 4. Contact Us
    if (matchesShortcut(e, activeShortcuts.contactUs)) {
      e.preventDefault();
      toggleTopFloatingBar("contact");
      return;
    }

    // 5. Feedback Radar / Contact Floating Bar
    if (matchesShortcut(e, activeShortcuts.feedbackRadar)) {
      e.preventDefault();
      toggleTopFloatingBar("contact");
      return;
    }

    // 6. Universal Search & Commands
    if (matchesShortcut(e, activeShortcuts.universalSearch) || (e.key === "/" && noModifiers)) {
      e.preventDefault();
      focusNavSearchBar();
      return;
    }

    // 7. Gemini AI Doubt Solver
    if (matchesShortcut(e, activeShortcuts.doubtSolver)) {
      e.preventDefault();
      toggleDoubtSolver();
      return;
    }

    // 8. In-Page Edit & Annotation Panel
    if (matchesShortcut(e, activeShortcuts.editAnnotations)) {
      e.preventDefault();
      toggleAnnotationPanel();
      return;
    }

    // 9. Full Screen (Toggle Top Bar)
    if (matchesShortcut(e, activeShortcuts.fullScreen)) {
      e.preventDefault();
      toggleTopBar();
      return;
    }

    // 10. Toggle Background Grid
    if (matchesShortcut(e, activeShortcuts.toggleGrid)) {
      e.preventDefault();
      const gridTog = document.getElementById("grid-toggle");
      const isNoGrid = document.body.classList.toggle("no-grid");
      if (gridTog) gridTog.checked = !isNoGrid;
      try {
        localStorage.setItem("indexindia_grid", isNoGrid ? "off" : "on");
      } catch (err) {}
      return;
    }

    // 11. Toggle Dark/Light Mode Theme
    if (matchesShortcut(e, activeShortcuts.toggleTheme)) {
      e.preventDefault();
      const contrastTog = document.getElementById("contrast-toggle");
      const isDark = document.body.classList.contains("theme-dark");
      if (isDark) {
        document.body.classList.remove("theme-dark");
        document.body.classList.add("theme-light");
        if (contrastTog) contrastTog.checked = false;
        try { localStorage.setItem("indexindia_theme", "light"); } catch (err) {}
      } else {
        document.body.classList.add("theme-dark");
        document.body.classList.remove("theme-light");
        if (contrastTog) contrastTog.checked = true;
        try { localStorage.setItem("indexindia_theme", "dark"); } catch (err) {}
      }
      return;
    }

    // 12. Move Main Chapter Next / Prev
    if (matchesShortcut(e, activeShortcuts.moveChapterDown) || matchesShortcut(e, activeShortcuts.moveChapterUp)) {
      e.preventDefault();
      closeTreeExplicitly();
      const isDown = matchesShortcut(e, activeShortcuts.moveChapterDown);
      navigateMainChapter(isDown ? 1 : -1);
      return;
    }

    // 13. Move Section & Subsection Next / Prev
    if (matchesShortcut(e, activeShortcuts.moveSectionDown) || matchesShortcut(e, activeShortcuts.moveSectionUp)) {
      e.preventDefault();
      closeTreeExplicitly();
      const isDown = matchesShortcut(e, activeShortcuts.moveSectionDown);
      navigateSection(isDown ? 1 : -1);
      return;
    }

    // Dynamic Shift modifier detection (allows pressing Shift while normal arrow is ALREADY held down)
    if (e.key === "Shift") {
      isShiftHeld = true;
      if (isArrowHeld) {
        isFastScroll = true;
        if (smoothVelocity < FAST_TAP_VELOCITY) {
          smoothVelocity = FAST_TAP_VELOCITY;
        }
      }
      if (isHorizontalHeld) {
        isFastHorizontalScroll = true;
        if (smoothHorizontalVelocity < FAST_TAP_VELOCITY) {
          smoothHorizontalVelocity = FAST_TAP_VELOCITY;
        }
      }
    } else if (e.shiftKey) {
      isShiftHeld = true;
      if (isArrowHeld) isFastScroll = true;
      if (isHorizontalHeld) isFastHorizontalScroll = true;
    }

    // 14. Snap Back / Center Viewport to Main Content Section (Ctrl + Space)
    const isCtrlOnly = (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey;
    if (
      matchesShortcut(e, activeShortcuts.snapToMainContent) ||
      (isCtrlOnly && (e.code === "Space" || e.key === " " || e.key === "Spacebar"))
    ) {
      e.preventDefault();
      snapToMainContentSection();
      return;
    }

    // 15. Smooth Scroll Down / Up / Right / Left (Normal)
    if (matchesShortcut(e, activeShortcuts.scrollDown)) {
      e.preventDefault();
      startSmoothScroll(1, false);
      return;
    }
    if (matchesShortcut(e, activeShortcuts.scrollUp)) {
      e.preventDefault();
      startSmoothScroll(-1, false);
      return;
    }
    if (matchesShortcut(e, activeShortcuts.scrollRight)) {
      e.preventDefault();
      startHorizontalSmoothScroll(1, false);
      return;
    }
    if (matchesShortcut(e, activeShortcuts.scrollLeft)) {
      e.preventDefault();
      startHorizontalSmoothScroll(-1, false);
      return;
    }

    // 16. Fast Scroll Down / Up / Right / Left (Accelerated)
    if (matchesShortcut(e, activeShortcuts.fastScrollDown)) {
      e.preventDefault();
      startSmoothScroll(1, true);
      return;
    }
    if (matchesShortcut(e, activeShortcuts.fastScrollUp)) {
      e.preventDefault();
      startSmoothScroll(-1, true);
      return;
    }
    if (matchesShortcut(e, activeShortcuts.fastScrollRight)) {
      e.preventDefault();
      startHorizontalSmoothScroll(1, true);
      return;
    }
    if (matchesShortcut(e, activeShortcuts.fastScrollLeft)) {
      e.preventDefault();
      startHorizontalSmoothScroll(-1, true);
      return;
    }

    // 16. Enter inside open tree navigates to current node (strictly alone)
    if (e.key === "Enter" && noModifiers && isTreeCurrentlyOpen()) {
      e.preventDefault();
      navigateToNode(currentSubIndex);
      return;
    }

    // 17. In-Page Finder Active Navigation (Enter -> next match, Shift+Enter -> prev match)
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

    // 18. Close Overlays
    if (matchesShortcut(e, activeShortcuts.closeOverlays)) {
      closeAllTopFloatingBars();
      closeTreeExplicitly();
      closeDoubtSolver();
      closeNavSearchResults();
      clearFinderHighlights();
      closeAnnotationPanel();
      if (isTopBarHidden()) {
        showTopBar();
      }
      return;
    }
  });

  document.addEventListener("keyup", (e) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

    if (e.key === "ArrowDown" && activeArrowDirection === 1) {
      stopSmoothScroll();
    } else if (e.key === "ArrowUp" && activeArrowDirection === -1) {
      stopSmoothScroll();
    } else if (e.key === "ArrowRight" && activeHorizontalDirection === 1) {
      stopHorizontalSmoothScroll();
    } else if (e.key === "ArrowLeft" && activeHorizontalDirection === -1) {
      stopHorizontalSmoothScroll();
    } else if (e.key === "Shift") {
      isShiftHeld = false;
      isFastScroll = false;
      isFastHorizontalScroll = false;
    }
  });

  window.addEventListener("blur", () => {
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
      if (btnFontStyleTrigger) btnFontStyleTrigger.setAttribute("aria-expanded", "false");
      dropdownFontSize.classList.toggle("is-open", !isOpen);
      btnFontSizeTrigger.setAttribute("aria-expanded", String(!isOpen));
    });
  }

  if (btnFontStyleTrigger && dropdownFontStyle) {
    btnFontStyleTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdownFontStyle.classList.contains("is-open");
      if (dropdownFontSize) dropdownFontSize.classList.remove("is-open");
      if (btnFontSizeTrigger) btnFontSizeTrigger.setAttribute("aria-expanded", "false");
      dropdownFontStyle.classList.toggle("is-open", !isOpen);
      btnFontStyleTrigger.setAttribute("aria-expanded", String(!isOpen));
    });
  }

  // Close settings & tool floating bar dropdown lists when clicking anywhere outside them (without closing the floating bar)
  document.addEventListener("pointerdown", (e) => {
    const t = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (dropdownFontSize && dropdownFontSize.classList.contains("is-open")) {
      if (!t || !dropdownFontSize.contains(t)) {
        dropdownFontSize.classList.remove("is-open");
        if (btnFontSizeTrigger) btnFontSizeTrigger.setAttribute("aria-expanded", "false");
      }
    }
    if (dropdownFontStyle && dropdownFontStyle.classList.contains("is-open")) {
      if (!t || !dropdownFontStyle.contains(t)) {
        dropdownFontStyle.classList.remove("is-open");
        if (btnFontStyleTrigger) btnFontStyleTrigger.setAttribute("aria-expanded", "false");
      }
    }
    document.querySelectorAll(".shortcut-tool-floating-bar .custom-dropdown.is-open").forEach((dd) => {
      if (!t || !dd.contains(t)) {
        dd.classList.remove("is-open");
        const trig = dd.querySelector(".dropdown-trigger");
        if (trig) trig.setAttribute("aria-expanded", "false");
      }
    });
  });

  const dropdownItems = document.querySelectorAll("#settings-floating-bar .dropdown-item");
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
        localStorage.setItem("indexindia_font_size", val);
        if (dropdownFontSize) dropdownFontSize.classList.remove("is-open");
        if (btnFontSizeTrigger) btnFontSizeTrigger.setAttribute("aria-expanded", "false");
      } else if (type === "font-style") {
        document.querySelectorAll("#list-font-style .dropdown-item").forEach((el) => el.classList.remove("active"));
        item.classList.add("active");
        if (fontStyleLabel) fontStyleLabel.textContent = val === "reading" ? "Reading" : "Typewriter";
        document.body.classList.remove("font-style-reading", "font-style-typewriter");
        document.body.classList.add(`font-style-${val}`);
        localStorage.setItem("indexindia_font_style", val);
        if (dropdownFontStyle) dropdownFontStyle.classList.remove("is-open");
        if (btnFontStyleTrigger) btnFontStyleTrigger.setAttribute("aria-expanded", "false");
        syncAllShortcutToolBarsUI();
      }
    });
  });

  const contrastToggle = document.getElementById("contrast-toggle");
  const gridToggle = document.getElementById("grid-toggle");

  const savedTheme = localStorage.getItem("indexindia_theme");
  if (savedTheme === "dark") {
    document.body.classList.add("theme-dark");
    document.body.classList.remove("theme-light");
    if (contrastToggle) contrastToggle.checked = true;
  }

  const savedGrid = localStorage.getItem("indexindia_grid");
  if (savedGrid === "off") {
    document.body.classList.add("no-grid");
    if (gridToggle) gridToggle.checked = false;
  }

  const savedFontSize = localStorage.getItem("indexindia_font_size");
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

  const savedFontStyle = localStorage.getItem("indexindia_font_style");
  if (savedFontStyle) {
    document.body.classList.remove("font-style-reading", "font-style-typewriter");
    document.body.classList.add(`font-style-${savedFontStyle}`);
    const activeItem = document.querySelector(`#list-font-style .dropdown-item[data-val="${savedFontStyle}"]`);
    if (activeItem) {
      document.querySelectorAll("#list-font-style .dropdown-item").forEach((el) => el.classList.remove("active"));
      activeItem.classList.add("active");
      if (fontStyleLabel) fontStyleLabel.textContent = savedFontStyle === "reading" ? "Reading" : "Typewriter";
    }
  }

  if (contrastToggle) {
    contrastToggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        document.body.classList.add("theme-dark");
        document.body.classList.remove("theme-light");
        localStorage.setItem("indexindia_theme", "dark");
      } else {
        document.body.classList.remove("theme-dark");
        document.body.classList.add("theme-light");
        localStorage.setItem("indexindia_theme", "light");
      }
      syncAllShortcutToolBarsUI();
    });
  }

  if (gridToggle) {
    gridToggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        document.body.classList.remove("no-grid");
        try { localStorage.setItem("indexindia_grid", "on"); } catch (_) {}
      } else {
        document.body.classList.add("no-grid");
        try { localStorage.setItem("indexindia_grid", "off"); } catch (_) {}
      }
      syncAllShortcutToolBarsUI();
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
    if (p.includes("statutory")) return "statutory";
    if (p.includes("membership")) return "membership";
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
      const raw = localStorage.getItem(`indexindia_forum_${pageId}`);
      if (!raw) return [];
      const list = JSON.parse(raw);
      const valid = list.filter((m) => {
        const t = new Date(m.created_at).getTime();
        return !isNaN(t) && t >= cutoffMs;
      });
      if (valid.length !== list.length) {
        localStorage.setItem(`indexindia_forum_${pageId}`, JSON.stringify(valid));
      }
      return valid;
    } catch (e) {
      console.warn("[IndexIndia Forum] Error reading local forum storage:", e);
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
      localStorage.setItem(`indexindia_forum_${pageId}`, JSON.stringify(trimmed));
      return newEntry;
    } catch (e) {
      console.warn("[IndexIndia Forum] Error saving local forum message:", e);
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
          console.warn("[IndexIndia Forum] Supabase fetch status:", res.status, "using local fallback");
          messages = getLocalForumMessages(pageId, cutoffMs);
        }
      } catch (err) {
        console.warn("[IndexIndia Forum] Supabase network error, using local fallback:", err);
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
          console.warn("[IndexIndia Forum] Supabase post failed, caching locally");
          saveLocalForumMessage(pageId, username, finalMessage, nowISO, parentId);
        }
      } catch (err) {
        console.warn("[IndexIndia Forum] Network error during post, caching locally:", err);
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

    // 2. Wikipedia Summary API (Exact Article Title Match Only)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1600);
      const wikiCap = cleanTerm.charAt(0).toUpperCase() + cleanTerm.slice(1);
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiCap.replace(/\s+/g, "_"))}`;
      const res = await fetch(wikiUrl, { headers: { "Accept": "application/json" }, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.extract && data.extract.length > 25 && data.type === "standard") {
          return {
            source: "Wikipedia via DuckDuckGo",
            title: data.title || cleanTerm,
            text: data.extract
          };
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

  async function fetchGeminiAnswer(query, context, apiKey) {
    if (!apiKey) return null;
    const cleanKey = apiKey.trim();
    if (!cleanKey) return null;

    const title = context?.title || "Visible Document Section";
    const sectionText = (context?.text || "").slice(0, 3500);

    const promptText = `You are an expert factual AI and reading assistant for the IndexIndia platform.
The reader may be asking about the active document section below, or asking a general knowledge question:

--- ACTIVE SECTION (IF RELEVANT) ---
Title: ${title}
Content:
${sectionText}
--- ACTIVE SECTION END ---

READER'S QUESTION / DOUBT:
"${query}"

INSTRUCTIONS:
1. Answer the question directly, accurately, and concisely in 2 to 3 clear sentences.
2. If the user asks about the story section, characters (Leo, Pip), or financial forensics, ground your answer in the provided text.
3. If the user asks general knowledge, geography, science, or factual questions (e.g. "is Sydney a country?", "what is the capital of Australia?", "why is the sky blue?"), answer with 100% factual correctness and logical clarity. Never hallucinate or give circular definitions.
4. If the question is about language, grammar, wordplay, definitions, or antonyms (e.g. "opposite of whisper"), answer with standard linguistic precision.
5. Provide only the direct factual explanation without conversational pleasantries (do not say "Sure!", "Here is your answer:", etc.).`;

    // Try current supported Google Gemini Flash models (gemini-3.5-flash-lite is sub-second fast)
    async function callModel(modelName) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const payload = {
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 350
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return res;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    }

    try {
      let res = await callModel("gemini-3.5-flash-lite");
      let usedModel = "Gemini 3.5 Flash Lite";

      if (!res.ok && res.status === 404) {
        res = await callModel("gemini-3.5-flash");
        usedModel = "Gemini 3.5 Flash";
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `HTTP ${res.status}`;
        console.warn("[Gemini API] Request failed:", errMsg);
        throw new Error(errMsg);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const answer = candidate?.content?.parts?.[0]?.text?.trim();

      if (answer) {
        return {
          source: `Google ${usedModel}`,
          text: answer,
          sectionTitle: title
        };
      }
      return null;
    } catch (err) {
      throw err;
    }
  }

  // Configurable Cloudflare Worker Proxy URL (if deployed, visitors need zero keys or setup)
  const CLOUDFLARE_WORKER_URL = "https://indexindia.dhaumyakumar27-235.workers.dev/api/doubt";

  function getActiveWorkerUrl() {
    return (
      (typeof window !== "undefined" && window.INDEXINDIA_CF_WORKER_URL) ||
      CLOUDFLARE_WORKER_URL ||
      localStorage.getItem("indexindia_cf_worker_url") ||
      ""
    ).trim();
  }

  async function fetchCloudflareWorkerAnswer(query, context, workerUrl) {
    const title = context ? (context.title || "Visible Content") : "Visible Content";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, context }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error || `HTTP ${res.status}`;
        console.warn("[Cloudflare Worker] Request failed:", errMsg);
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data && data.text) {
        return {
          source: data.source || "Google Gemini (via Cloudflare Edge)",
          text: data.text,
          sectionTitle: title,
          model: data.model || "gemini-3.5-flash-lite"
        };
      }
      return null;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async function resolveDoubtAnswer(query, context) {
    const rawText = context ? (context.text || "") : "";
    const title = context ? (context.title || "Visible Content") : "Visible Content";
    const workerUrl = getActiveWorkerUrl();
    const apiKey = localStorage.getItem("indexindia_gemini_api_key");

    // 1. Try Cloudflare Worker Proxy first (Zero keys needed for visitors!)
    if (workerUrl) {
      try {
        const cfRes = await fetchCloudflareWorkerAnswer(query, context, workerUrl);
        if (cfRes && cfRes.text) {
          return `
            <div class="doubt-plain-answer">
              <div class="doubt-ai-badge font-mono">
                <span class="ai-badge-dot">●</span> EXPLANATION · CONTEXT: "${escapeHtml(title)}"
              </div>
              <div class="doubt-plain-text font-serif">
                ${escapeHtml(cfRes.text)}
              </div>
            </div>
          `;
        }
      } catch (cfErr) {
        console.warn("[DoubtSolver] Cloudflare Worker call failed, checking direct key fallback:", cfErr);
      }
    }

    // 2. Try direct Google Gemini API if user has stored an API key
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const geminiRes = await fetchGeminiAnswer(query, context, apiKey);
        if (geminiRes && geminiRes.text) {
          return `
            <div class="doubt-plain-answer">
              <div class="doubt-ai-badge font-mono">
                <span class="ai-badge-dot">●</span> EXPLANATION · CONTEXT: "${escapeHtml(title)}"
              </div>
              <div class="doubt-plain-text font-serif">
                ${escapeHtml(geminiRes.text)}
              </div>
            </div>
          `;
        }
      } catch (geminiErr) {
        console.warn("[DoubtSolver] Gemini call failed, falling back to local synthesis:", geminiErr);
        if (geminiErr.message && (geminiErr.message.includes("API key not valid") || geminiErr.message.includes("400") || geminiErr.message.includes("403"))) {
          return `
            <div class="doubt-plain-answer">
              <div class="doubt-ai-badge font-mono" style="color: #ef4444;">
                <span class="ai-badge-dot" style="color: #ef4444;">●</span> ⚠️ GEMINI API KEY INVALID
              </div>
              <div class="doubt-plain-text font-serif">
                The stored Gemini API key returned an authentication error (${escapeHtml(geminiErr.message)}). Please click <strong>Change Key</strong> in the banner above to re-enter your key.
              </div>
            </div>
          `;
        }
      }
    }

    // 2. Fast check built-in knowledge first (0ms latency)
    const subjectInfo = extractCoreSubject(query, title, rawText);
    const term = subjectInfo.term;

    for (const [key, val] of Object.entries(BUILTIN_CONCEPT_EXPLANATIONS)) {
      if (term.includes(key) || key.includes(term) || query.toLowerCase().includes(key)) {
        return synthesizeConceptAnswer(query, context, {
          source: "DuckDuckGo Built-in Knowledge",
          title: val.title,
          text: val.explanation
        });
      }
    }

    // 3. Attempt online fetch from DuckDuckGo Instant Answer / Wikipedia
    try {
      const remote = await fetchDuckDuckGoInstantAnswer(term);
      if (remote) {
        return synthesizeConceptAnswer(query, context, remote);
      }
    } catch (_) {}

    // 4. Fallback synthesis from visible page context
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
          item.answerHtml.includes(".300 Whisper") ||
          item.answerHtml.includes("cartridge in the Whisper family") ||
          item.answerHtml.includes("7.82x34mm") ||
          item.answerHtml.includes("J.D. Jones") ||
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
          item.answerHtml = synthesizeConceptAnswer(item.question, getPageSummaryContext(), null);
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

  // Create UI elements (Cursor drag-and-select to ask Gemini removed; full sections sent only)
  const doubtPill = null;

  const doubtTile = document.createElement("aside");
  doubtTile.className = "doubt-solver-tile";
  doubtTile.id = "doubt-solver-tile";
  doubtTile.setAttribute("role", "dialog");
  doubtTile.setAttribute("aria-label", "Google Gemini AI Doubt Solver");
  doubtTile.innerHTML = `
    <div class="doubt-tile-header">
      <div class="doubt-tile-brand">
        <span>DOUBT SOLVER</span>
      </div>
      <div class="doubt-tile-controls">
        <button type="button" class="doubt-tile-close" id="doubt-tile-close" data-hover-tag="[CLOSE]" aria-label="Close">&times;</button>
      </div>
    </div>
    <div class="doubt-tile-body">
      <div class="doubt-context-strip" id="doubt-context-strip">
        <div class="doubt-context-meta">
          <span class="doubt-context-pill font-mono" id="doubt-context-badge">PAGE CONTEXT</span>
          <span class="doubt-context-title font-mono" id="doubt-context-title">Page Overview</span>
        </div>
        <button type="button" class="doubt-context-reset-btn font-mono" id="doubt-context-reset-btn" title="Reset to Page Summary" style="display: none;">Page ↺</button>
      </div>
      <div class="doubt-input-row">
        <input type="text" id="doubt-text-input" class="doubt-text-input" placeholder="Ask any doubt or question..." autocomplete="off">
        <button type="button" id="doubt-ask-btn" class="doubt-ask-btn">Ask ↵</button>
      </div>

      <div class="doubt-output-container" id="doubt-output-container"></div>
    </div>
  `;
  document.body.appendChild(doubtTile);

  const doubtCloseBtn = doubtTile.querySelector("#doubt-tile-close");
  const doubtKeyBtn = doubtTile.querySelector("#doubt-tile-key-btn");
  const doubtTextInput = doubtTile.querySelector("#doubt-text-input");
  const doubtAskBtn = doubtTile.querySelector("#doubt-ask-btn");
  const doubtChips = doubtTile.querySelectorAll(".doubt-chip-btn");
  const doubtOutput = doubtTile.querySelector("#doubt-output-container");
  const doubtContextStrip = doubtTile.querySelector("#doubt-context-strip");
  const doubtContextBadge = doubtTile.querySelector("#doubt-context-badge");
  const doubtContextTitle = doubtTile.querySelector("#doubt-context-title");
  const doubtContextResetBtn = doubtTile.querySelector("#doubt-context-reset-btn");

  if (doubtContextResetBtn) {
    doubtContextResetBtn.addEventListener("click", () => {
      setDoubtContext(getPageSummaryContext());
    });
  }

  function updateGeminiKeyButtonState() {
    if (!doubtKeyBtn) return;
    const workerUrl = getActiveWorkerUrl();
    const key = localStorage.getItem("indexindia_gemini_api_key");
    if (workerUrl) {
      doubtKeyBtn.classList.add("is-configured");
      doubtKeyBtn.innerHTML = `<span class="key-active-dot">●</span> ⚡ Cloudflare Edge`;
      doubtKeyBtn.title = "Cloudflare Edge + Gemini Active · 100% Free · Click to configure";
    } else if (key && key.trim().length > 10) {
      doubtKeyBtn.classList.add("is-configured");
      doubtKeyBtn.innerHTML = `<span class="key-active-dot">●</span> ⚡ Gemini Active`;
      doubtKeyBtn.title = "Gemini Flash Active · Click to update or remove API key";
    } else {
      doubtKeyBtn.classList.remove("is-configured");
      doubtKeyBtn.innerHTML = `🔑 AI Key`;
      doubtKeyBtn.title = "Connect Google Gemini Flash API Key or Cloudflare Worker";
    }
  }

  function promptForGeminiKey() {
    const currentWorker = localStorage.getItem("indexindia_cf_worker_url") || "";
    const currentKey = localStorage.getItem("indexindia_gemini_api_key") || "";

    const choice = window.prompt(
      "AI Configuration:\n" +
      "1. Cloudflare Worker URL (e.g. https://...workers.dev) for zero-setup visitor access\n" +
      "2. Direct Google Gemini API Key (e.g. AQ... or AIzaSy...)\n" +
      "3. Leave blank to clear settings\n\nCurrent: " + (currentWorker || currentKey || "None"),
      currentWorker || currentKey || ""
    );

    if (choice !== null) {
      const val = choice.trim();
      if (val.startsWith("http://") || val.startsWith("https://")) {
        localStorage.setItem("indexindia_cf_worker_url", val);
        localStorage.removeItem("indexindia_gemini_api_key");
        alert("Cloudflare Worker URL saved! Visitors will now query Gemini through your serverless edge proxy.");
      } else if (val.length > 5) {
        localStorage.setItem("indexindia_gemini_api_key", val);
        localStorage.removeItem("indexindia_cf_worker_url");
        alert("Gemini API Key saved locally!");
      } else {
        localStorage.removeItem("indexindia_gemini_api_key");
        localStorage.removeItem("indexindia_cf_worker_url");
        alert("AI configuration cleared. Reverted to local context solver.");
      }
      updateGeminiKeyButtonState();
      if (activeDoubtMode === "doubts") {
        renderDoubtsView();
      }
    }
  }

  if (doubtKeyBtn) {
    doubtKeyBtn.addEventListener("click", promptForGeminiKey);
  }
  updateGeminiKeyButtonState();

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  let lastHoveredSection = null;

  // 1. Pre-given Page Summary Context (used when user hits 'M' or opens Doubt Solver without selecting a section)
  function getPageSummaryContext() {
    const pageTitle = (document.querySelector(".institutional-title")?.textContent.trim()) || document.title.split("—")[0].trim();
    const abstract = document.querySelector(".dossier-lead")?.textContent.trim() || "";
    const metaStrip = document.querySelector(".report-meta-strip")?.textContent.trim().replace(/\s+/g, " ") || "";

    // Collect all core section titles from directory tree or document
    let topics = [];
    if (typeof treeNodes !== "undefined" && treeNodes && treeNodes.length > 0) {
      topics = treeNodes.map(n => {
        const name = n.querySelector(".tree-name")?.textContent.trim() || n.textContent.trim();
        return name;
      }).filter(t => t.length > 0);
    } else {
      topics = Array.from(document.querySelectorAll(".story-section-title, .forum-title, h2, h3"))
        .map(h => h.textContent.trim().replace(/\s+/g, " "))
        .filter(t => t.length > 3 && !t.includes("DOUBT SOLVER"));
    }

    const topicSummary = topics.slice(0, 20).join(" • ");

    const summaryText = `[PAGE / GUIDE OVERVIEW CONTEXT]\nDOCUMENT: ${pageTitle}\n${metaStrip ? `METADATA: ${metaStrip}\n` : ""}${abstract ? `ABSTRACT: ${abstract}\n` : ""}\nCORE SECTIONS & ARCHITECTURE COVERED ON THIS PAGE:\n${topicSummary}`;

    return {
      type: "page",
      title: pageTitle,
      text: summaryText,
      excerpt: abstract ? (abstract.slice(0, 160) + "...") : `General platform summary covering ${topics.length} sections.`
    };
  }

  // 2. Specific Section Context (used when user hovers on a section and clicks "Ask Doubt" or presses 'M' while hovering)
  function getSectionContext(sectionEl) {
    if (!sectionEl) return getPageSummaryContext();

    const titleEl = sectionEl.querySelector(".section-title, .subsection-title, .subsubsection-title, .doc-title, .story-section-title, .forum-title, h1, h2, h3, h4");
    const numEl = sectionEl.querySelector(".section-number, .subsection-number, .subsubsection-number, .sec-num, .doc-num");
    const numPrefix = numEl ? numEl.textContent.trim() + " " : "";

    const rawTitle = sectionEl.getAttribute("data-section-title") ||
                     (titleEl ? (numPrefix + titleEl.textContent.trim().replace(/\s+/g, " ")) : (sectionEl.id || "Document Section"));
    const cleanTitle = rawTitle.replace(/^[^\w\s\u00C0-\u017F]+/, "").trim() || rawTitle;

    // Prefer dedicated .section-content or .subsection-content if present
    const contentContainer = sectionEl.querySelector(".section-content, .subsection-content, .subsubsection-content") || sectionEl;

    // Collect all narrative, checklists, notes, statutory filings, and data inside this section
    // Exclude nested subsections so that each subsection retains its own focused context
    const textNodes = Array.from(contentContainer.querySelectorAll(
      ".section-lead, .story-narrative-lead, p, li, td, th, .story-tag, .section-meta, .subsection-meta, .story-section-meta, .story-meta-tags, .story-meta-col, blockquote, .forum-title"
    )).filter(el => {
      if (el.closest(".section-doubt-btn") || el.closest(".forum-reply-box")) return false;
      const nestedSub = el.closest(".doc-subsection, .doc-subsubsection");
      if (nestedSub && nestedSub !== sectionEl) return false;
      return true;
    });

    let fullText = "";
    if (textNodes.length > 0) {
      fullText = textNodes.map(n => n.textContent.trim().replace(/\s+/g, " ")).filter(t => t.length > 0).join("\n");
    } else {
      const clone = contentContainer.cloneNode(true);
      clone.querySelectorAll(".section-doubt-btn, .doc-subsection, .doc-subsubsection").forEach(b => b.remove());
      fullText = clone.textContent.replace(/\s+/g, " ").trim();
    }

    const excerpt = textNodes[0]?.textContent.trim() || fullText.slice(0, 160);

    return {
      type: "section",
      title: cleanTitle,
      text: `[SECTION CONTEXT: ${cleanTitle}]\n${fullText}`,
      excerpt: excerpt.length > 180 ? excerpt.slice(0, 180) + "..." : excerpt,
      sectionId: sectionEl.id || ""
    };
  }

  // 3. Get Active Doubt Context (No auto screen tracker: Section hover has priority, fallback to Page Summary)
  function getActiveDoubtContext() {
    if (currentDoubtContext) return currentDoubtContext;

    const hoveredSec = lastHoveredSection || document.querySelector(
      ".doc-section:hover, .doc-subsection:hover, .doc-subsubsection:hover, .story-node-section:hover, .page-directory-section:hover, .forum-directory-section:hover, .institutional-forum-section:hover, .content-area > section:hover"
    );
    if (hoveredSec) {
      return getSectionContext(hoveredSec);
    }
    return getPageSummaryContext();
  }

  // 4. Update Doubt Solver UI with the active context pill and title
  function updateDoubtContextUI() {
    if (!doubtContextBadge || !doubtContextTitle) return;
    const ctx = currentDoubtContext || getPageSummaryContext();

    if (ctx.type === "section") {
      doubtContextBadge.textContent = "SECTION";
      doubtContextTitle.textContent = ctx.title || "Section Context";
      if (doubtContextResetBtn) doubtContextResetBtn.style.display = "inline-block";
      if (doubtTextInput) doubtTextInput.placeholder = `Ask doubt about "${(ctx.title || "this section").slice(0, 24)}"...`;
    } else if (ctx.type === "selection") {
      doubtContextBadge.textContent = "SELECTION";
      doubtContextTitle.textContent = ctx.title || "Selected Text";
      if (doubtContextResetBtn) doubtContextResetBtn.style.display = "inline-block";
      if (doubtTextInput) doubtTextInput.placeholder = "Ask doubt about selected text...";
    } else {
      doubtContextBadge.textContent = "PAGE CONTEXT";
      doubtContextTitle.textContent = ctx.title || "Page Summary";
      if (doubtContextResetBtn) doubtContextResetBtn.style.display = "none";
      if (doubtTextInput) doubtTextInput.placeholder = "Ask any doubt about this guide or platform...";
    }
  }

  function setDoubtContext(ctx) {
    currentDoubtContext = ctx;
    updateDoubtContextUI();
  }

  // 5. Open Doubt Solver specifically for a section
  function openDoubtSolverForSection(sectionEl) {
    const secCtx = getSectionContext(sectionEl);
    setDoubtContext(secCtx);
    openDoubtSolver(secCtx);
  }

  // 6. Section Hover & Floating "Ask Doubt" Button Injection
  // 6. Section Hover & Actions Tracking
  function injectSectionDoubtButtons() {
    const sections = Array.from(document.querySelectorAll(
      ".doc-section, .doc-subsection, .doc-subsubsection, .story-node-section, .page-directory-section, .content-area > section"
    )).filter((sec) => {
      if (sec.id === "forum-section" || sec.closest("#forum-section, .institutional-forum-section, .forum-directory-section, .compact-forum-composer, .forum-messages-container")) {
        return false;
      }
      return true;
    });

    sections.forEach((sec) => {
      // Track hover state for selection confirmation
      sec.addEventListener("mouseenter", () => {
        lastHoveredSection = sec;
      });
      sec.addEventListener("mouseleave", () => {
        if (lastHoveredSection === sec) {
          lastHoveredSection = null;
        }
      });
    });
  }

  // Initial injection
  injectSectionDoubtButtons();

  // (Cursor drag-and-select to ask Gemini removed; queries sent via full sections only)

  function renderDoubtsView() {
    const history = getLocalDoubtsHistory();
    const workerUrl = getActiveWorkerUrl();
    const hasKey = Boolean(localStorage.getItem("indexindia_gemini_api_key")?.trim());

    let bannerHtml = "";
    if (!workerUrl && !hasKey) {
      bannerHtml = `
        <div class="doubt-gemini-banner" id="doubt-gemini-banner">
          <div class="doubt-banner-header">
            <span>CONNECT AI BACKEND</span>
          </div>
          <p class="doubt-banner-desc">Ask doubts grounded in the book or any question. Enter API key or Worker URL:</p>
          <div class="doubt-key-input-row">
            <input type="password" id="doubt-key-inline-input" class="doubt-key-inline-input" placeholder="Paste Gemini key or Cloudflare Worker URL" autocomplete="off">
            <button type="button" id="doubt-key-save-btn" class="doubt-key-save-btn">Save</button>
          </div>
          <div class="doubt-banner-actions">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="doubt-banner-link font-mono">Get Free Key at Google AI Studio ↗</a>
          </div>
        </div>
      `;
    }

    if (!history || history.length === 0) {
      doubtOutput.innerHTML = `
        ${bannerHtml}
        <div class="doubt-blank-page">
          <div class="doubt-blank-icon">💬</div>
          <div class="doubt-blank-title">Doubt Solver</div>
          <p class="doubt-blank-sub">Ask any doubt about the reading or any question in the box above.</p>
        </div>
      `;
      attachBannerListeners();
      return;
    }

    let html = `
      ${bannerHtml}
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
    attachBannerListeners();

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
        if (window.IndexIndiaSupabase) {
          window.IndexIndiaSupabase.deleteDoubt(id);
        }
        renderDoubtsView();
      });
    });
  }

  function attachBannerListeners() {
    const saveBtn = doubtOutput.querySelector("#doubt-key-save-btn");
    const keyInput = doubtOutput.querySelector("#doubt-key-inline-input");
    if (saveBtn && keyInput) {
      saveBtn.addEventListener("click", () => {
        const val = keyInput.value.trim();
        if (val.startsWith("http://") || val.startsWith("https://")) {
          localStorage.setItem("indexindia_cf_worker_url", val);
          localStorage.removeItem("indexindia_gemini_api_key");
          updateGeminiKeyButtonState();
          renderDoubtsView();
        } else if (val.length > 5) {
          localStorage.setItem("indexindia_gemini_api_key", val);
          localStorage.removeItem("indexindia_cf_worker_url");
          updateGeminiKeyButtonState();
          renderDoubtsView();
        } else {
          alert("Please paste your Gemini API key or Cloudflare Worker URL.");
        }
      });
      keyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveBtn.click();
        }
      });
    }

    const changeBtn = doubtOutput.querySelector("#doubt-key-change-btn");
    if (changeBtn) {
      changeBtn.addEventListener("click", promptForGeminiKey);
    }
  }

  function renderKeyTakeawayView() {
    if (!currentDoubtContext) {
      currentDoubtContext = getActiveDoubtContext();
    }
    const rawText = currentDoubtContext.text || "";
    const title = currentDoubtContext.title || "Document Context";
    const excerpt = currentDoubtContext.excerpt || (rawText.slice(0, 160) + "...");

    const sentences = rawText.split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 15 && !s.toLowerCase().includes("institutional research hub") && !s.toLowerCase().includes("all rights reserved"));

    const keySentences = sentences.slice(0, 3);
    if (keySentences.length === 0) {
      keySentences.push(excerpt || "Document context analyzed.");
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
          <a href="${ddgAiUrl}" target="_blank" rel="noopener noreferrer" class="doubt-ddg-btn doubt-ddg-btn-ai" title="Ask DuckDuckGo AI about this context">
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
          <span class="doubt-takeaway-badge font-mono">CONTEXT: ${escapeHtml(title).toUpperCase()}</span>
        </div>
        <div class="doubt-takeaway-source">
          <span class="doubt-source-label font-mono">TARGET SCOPE:</span>
          <span class="doubt-source-title font-mono">"${escapeHtml(title)}"</span>
        </div>
        <div class="doubt-takeaway-snippet">
          <div class="doubt-snippet-label font-mono">REFERENCED TEXT:</div>
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
          <strong>Synthesis:</strong> ${matchedTopic ? escapeHtml(matchedTopic.screenContext) : `Key takeaways extracted directly from active context under ${escapeHtml(title)}.`}
        </div>
        ${ddgActionBarHtml}
      </div>
    `;
  }


  openDoubtSolver = function(contextOverride, permanent = false) {
    try {
      if (permanent) {
        geminiIsPermanent = true;
        doubtOpenedByHover = false;
        if (window.innerWidth <= 1280 && typeof closeTreeExplicitly === "function" && isPinned) {
          closeTreeExplicitly();
        }
        document.body.classList.add("gemini-permanent");
      }
      document.body.classList.add("doubt-solver-open");
      const openFlyouts = document.querySelectorAll(".panel-trigger-wrapper.is-open");
      openFlyouts.forEach(f => f.classList.remove("is-open"));

      if (doubtPill) doubtPill.classList.remove("is-visible");
      if (contextOverride) {
        setDoubtContext(contextOverride);
      } else if (!currentDoubtContext) {
        setDoubtContext(getActiveDoubtContext());
      } else {
        updateDoubtContextUI();
      }

      if (doubtTile) {
        doubtTile.classList.add("is-open");
        updateGeminiKeyButtonState();
      }

      const doubtNavBtn = document.getElementById("doubt-nav-btn");
      if (doubtNavBtn && permanent) doubtNavBtn.classList.add("is-active");

      if (typeof triggerCloudDoubtsFetch === "function") {
        triggerCloudDoubtsFetch();
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
      geminiIsPermanent = false;
      doubtOpenedByHover = false;
      document.body.classList.remove("doubt-solver-open");
      document.body.classList.remove("gemini-permanent");
      if (doubtTile) doubtTile.classList.remove("is-open");
      if (doubtPill) doubtPill.classList.remove("is-visible");
      if (doubtTextInput) doubtTextInput.blur();

      const doubtNavBtn = document.getElementById("doubt-nav-btn");
      if (doubtNavBtn) doubtNavBtn.classList.remove("is-active");

    } catch (err) {
      console.error("[DoubtSolver] closeDoubtSolver error:", err);
    }
  };

  toggleDoubtSolver = function(forceState) {
    let shouldOpen = typeof forceState === "boolean" ? forceState : !geminiIsPermanent;
    doubtOpenedByHover = false;
    if (shouldOpen) {
      const hoveredSec = lastHoveredSection || document.querySelector(".doc-section:hover, .doc-subsection:hover, .doc-subsubsection:hover, .story-node-section:hover, .page-directory-section:hover, .forum-directory-section:hover, .institutional-forum-section:hover, .content-area > section:hover");
      if (hoveredSec) {
        setDoubtContext(getSectionContext(hoveredSec));
      } else {
        // User pressed 'M' without hover selecting a section: send pre-given page summary context!
        setDoubtContext(getPageSummaryContext());
      }
      openDoubtSolver(currentDoubtContext, true);
    } else {
      closeDoubtSolver();
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
        doubtTextInput.placeholder = "Ask any doubt or question...";
      }
    }

    const currentId = ++activeQueryId;
    const hasKey = Boolean(localStorage.getItem("indexindia_gemini_api_key")?.trim());
    if (doubtAskBtn) {
      doubtAskBtn.textContent = ".....";
      doubtAskBtn.disabled = true;
    }

    // Ensure active context is present (Section Context or Page Summary)
    if (!currentDoubtContext) {
      currentDoubtContext = getActiveDoubtContext();
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
        if (window.IndexIndiaSupabase) {
          window.IndexIndiaSupabase.uploadDoubt(newRecord);
        }

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
      if (window.IndexIndiaSupabase) {
        window.IndexIndiaSupabase.uploadDoubt(newRecord);
      }
      renderDoubtsView();
    } finally {
      if (doubtAskBtn) {
        doubtAskBtn.textContent = "Ask ↵";
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
      if (!currentDoubtContext) {
        currentDoubtContext = getActiveDoubtContext();
      }
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
    if (!doubtTile || !doubtTile.classList.contains("is-open")) return;
    if (geminiIsPermanent) return;
    if (!doubtTile.contains(e.target) && !e.target.closest(".section-doubt-btn, #doubt-nav-btn, .section-gemini-btn")) {
      closeDoubtSolver();
    }
  });


  // ================= 10. EDGE HOVER TRIGGER SYSTEM (Left: Directory Tree, Right: Doubt AI) =================
  // Edge hovering pops out temporary floating preview panel; clicking top buttons makes them permanent and snaps page content
  let treeOpenedByHover = false;
  let doubtOpenedByHover = false;
  let geminiIsPermanent = false;
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
    if (!isPinned && !isTreeCurrentlyOpen()) {
      treeOpenedByHover = true;
      if (railNavigator) railNavigator.classList.remove("is-closed");
      openRailPanel();
    }
  }

  function triggerRightEdgeDoubt() {
    if (!geminiIsPermanent && (!doubtTile || !doubtTile.classList.contains("is-open"))) {
      doubtOpenedByHover = true;
      openDoubtSolver(null, false);
    }
  }

  function closeDoubtOnCursorLeave(delay = 180) {
    if (geminiIsPermanent) return;
    if (doubtLeaveTimer) clearTimeout(doubtLeaveTimer);
    doubtLeaveTimer = setTimeout(() => {
      const isTileHovered = doubtTile && doubtTile.matches(":hover");
      if (!isTileHovered && !geminiIsPermanent && doubtTile && doubtTile.classList.contains("is-open")) {
        closeDoubtSolver();
      }
    }, delay);
  }

  // Edge Sensor DOM Listeners
  edgeSensorLeft.addEventListener("mouseenter", () => {
    triggerLeftEdgeTree();
  });

  edgeSensorRight.addEventListener("mouseenter", () => {
    triggerRightEdgeDoubt();
  });

  // Global mousemove for rapid cursor flicks to the absolute edge and cursor-leave detection
  window.addEventListener("mousemove", (e) => {
    if (e.buttons !== 0) return; // Don't trigger if user is dragging/selecting text or dragging scrollbar

    const clientX = e.clientX;
    const clientY = e.clientY;
    const winWidth = window.innerWidth;

    // Left Edge Trigger (<= 14px): open Directory Tree in hover preview mode
    if (clientX <= 14 && clientY >= 50) {
      triggerLeftEdgeTree();
    }

    // Right Edge Trigger (>= winWidth - 14px): open Doubt AI in hover preview mode
    if (clientX >= winWidth - 14 && clientY >= 50) {
      triggerRightEdgeDoubt();
    }

    // If Tree was opened by edge hover and is not pinned: close when mouse leaves panel to the right (455px width)
    if (treeOpenedByHover && !isPinned && isTreeCurrentlyOpen()) {
      if (clientX > 465) {
        closeRailPanel(180);
        treeOpenedByHover = false;
      }
    }

    // If Doubt Solver was opened by edge hover and is not permanent: close when cursor leaves panel to the left (455px width)
    if (doubtOpenedByHover && !geminiIsPermanent && doubtTile && doubtTile.classList.contains("is-open")) {
      if (clientX < winWidth - 465) {
        closeDoubtOnCursorLeave(180);
        doubtOpenedByHover = false;
      }
    }
  }, { passive: true });

  // When user enters doubtTile, cancel leave timer; when user cursor leaves doubtTile, close it if opened by hover!
  if (doubtTile) {
    doubtTile.addEventListener("mouseenter", () => {
      if (doubtLeaveTimer) clearTimeout(doubtLeaveTimer);
    });
    doubtTile.addEventListener("mouseleave", () => {
      if (doubtOpenedByHover && !geminiIsPermanent) {
        closeDoubtOnCursorLeave(180);
      }
    });
  }

  if (railTreePanel) {
    railTreePanel.addEventListener("mouseleave", () => {
      if (treeOpenedByHover && !isPinned) {
        closeRailPanel(180);
      }
    });
  }

  // Ensure shortcut toggles reset the hover flags
  const origToggleTree = toggleTree;
  toggleTree = function(forceState) {
    treeOpenedByHover = false;
    origToggleTree(forceState);
  };

  const origToggleDoubt = toggleDoubtSolver;
  toggleDoubtSolver = function(forceState) {
    doubtOpenedByHover = false;
    origToggleDoubt(forceState);
  };

  // Top Navbar Action Buttons (Beside x|y|z and shortcuts menu)
  const navTreeBtn = document.getElementById("nav-tree-toggle-btn");
  if (navTreeBtn) {
    navTreeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTree();
    });
  }

  const doubtNavBtn = document.getElementById("doubt-nav-btn");
  if (doubtNavBtn) {
    doubtNavBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleDoubtSolver();
    });
  }

  // ================= 11. TOP-NAV SEARCH FLOATING BAR & COMMAND PALETTE =================
  let searchNavWrapper = document.getElementById("search-nav-wrapper");
  let searchNavBtn = document.getElementById("search-nav-btn");
  let searchFloatingBar = document.getElementById("search-floating-bar");
  let navSearchInput = document.getElementById("nav-search-input");
  let navSearchResultsDropdown = document.getElementById("nav-search-results-dropdown");
  let searchClearBtn = document.getElementById("search-panel-clear-btn");
  let searchBarCloseBtn = document.getElementById("search-bar-close-btn");
  let finderMatchCount = document.getElementById("finder-match-count");
  let finderBtnPrev = document.getElementById("finder-btn-prev");
  let finderBtnNext = document.getElementById("finder-btn-next");
  let paletteCurrentItems = [];
  let paletteSelectedIndex = -1;

  // In-Page Finder state
  let finderMatches = [];
  let currentFinderMatchIdx = 0;
  let currentFinderQuery = "";

  // Dynamic fallback injection if searchFloatingBar is not in static DOM
  if (!searchFloatingBar) {
    searchFloatingBar = document.createElement("div");
    searchFloatingBar.id = "search-floating-bar";
    searchFloatingBar.className = "search-floating-bar";
    searchFloatingBar.setAttribute("role", "search");
    searchFloatingBar.setAttribute("aria-label", "Search & In-Page Finder");
    searchFloatingBar.innerHTML = `
      <span class="palette-drag-handle" title="Search Sovereign Terminal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>
        </svg>
      </span>
      <div class="search-floating-input-wrap">
        <input type="text" class="search-floating-input font-mono" id="nav-search-input" placeholder="Search terminal or page... ( / )" autocomplete="off" spellcheck="false" />
        <button type="button" class="search-panel-clear-btn" id="search-panel-clear-btn" data-hover-tag="[CLEAR]" aria-label="Clear" style="display: none;">&times;</button>
      </div>
      <span class="palette-sep">|</span>
      <div class="palette-nav-group">
        <span class="palette-counter font-mono" id="finder-match-count">0 matches</span>
        <div class="finder-nav-btns">
          <button type="button" class="finder-btn" id="finder-btn-prev" data-hover-tag="[PREVIOUS]" aria-label="Previous Match">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </button>
          <button type="button" class="finder-btn" id="finder-btn-next" data-hover-tag="[NEXT]" aria-label="Next Match">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>
      </div>
      <button type="button" class="palette-close-btn" id="search-bar-close-btn" data-hover-tag="[CLOSE]" aria-label="Close">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="nav-search-results-dropdown" id="nav-search-results-dropdown" role="listbox"></div>
    `;
    document.body.appendChild(searchFloatingBar);
    navSearchInput = searchFloatingBar.querySelector("#nav-search-input");
    navSearchResultsDropdown = searchFloatingBar.querySelector("#nav-search-results-dropdown");
    searchClearBtn = searchFloatingBar.querySelector("#search-panel-clear-btn");
    searchBarCloseBtn = searchFloatingBar.querySelector("#search-bar-close-btn");
    finderMatchCount = searchFloatingBar.querySelector("#finder-match-count");
    finderBtnPrev = searchFloatingBar.querySelector("#finder-btn-prev");
    finderBtnNext = searchFloatingBar.querySelector("#finder-btn-next");
  }

  isFinderActive = function() {
    return Boolean(finderMatches && finderMatches.length > 0);
  };

  // Helper Functions for Settings Actions
  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("theme-dark");
      document.body.classList.remove("theme-light");
      localStorage.setItem("indexindia_theme", "dark");
      if (contrastToggle) contrastToggle.checked = true;
    } else {
      document.body.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
      localStorage.setItem("indexindia_theme", "light");
      if (contrastToggle) contrastToggle.checked = false;
    }
    syncAllShortcutToolBarsUI();
  }

  function toggleThemeMode() {
    const isDark = document.body.classList.contains("theme-dark");
    applyTheme(isDark ? "light" : "dark");
  }

  function applyFontSize(size) {
    document.documentElement.classList.remove("font-size-small", "font-size-medium", "font-size-large");
    document.documentElement.classList.add(`font-size-${size}`);
    localStorage.setItem("indexindia_font_size", size);
    if (fontSizeLabel) fontSizeLabel.textContent = size.charAt(0).toUpperCase() + size.slice(1);
    const activeItem = document.querySelector(`#list-font-size .dropdown-item[data-val="${size}"]`);
    if (activeItem) {
      document.querySelectorAll("#list-font-size .dropdown-item").forEach((el) => el.classList.remove("active"));
      activeItem.classList.add("active");
    }
    syncAllShortcutToolBarsUI();
  }

  function applyFontStyle(style) {
    document.body.classList.remove("font-style-reading", "font-style-typewriter");
    document.body.classList.add(`font-style-${style}`);
    localStorage.setItem("indexindia_font_style", style);
    if (fontStyleLabel) fontStyleLabel.textContent = style === "reading" ? "Reading" : "Typewriter";
    const activeItem = document.querySelector(`#list-font-style .dropdown-item[data-val="${style}"]`);
    if (activeItem) {
      document.querySelectorAll("#list-font-style .dropdown-item").forEach((el) => el.classList.remove("active"));
      activeItem.classList.add("active");
    }
    syncAllShortcutToolBarsUI();
  }

  function toggleBackgroundGrid() {
    document.body.classList.toggle("no-grid");
    const isNoGrid = document.body.classList.contains("no-grid");
    if (gridToggle) gridToggle.checked = !isNoGrid;
    try { localStorage.setItem("indexindia_grid", isNoGrid ? "off" : "on"); } catch (_) {}
    syncAllShortcutToolBarsUI();
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
    updateFinderUI();
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
    } else {
      updateFinderUI();
    }

    return finderMatches.length;
  }

  function updateFinderUI() {
    const countEl = document.getElementById("finder-match-count") || finderMatchCount;
    if (countEl) {
      if (finderMatches.length > 0) {
        countEl.textContent = `${currentFinderMatchIdx + 1} of ${finderMatches.length}`;
      } else {
        countEl.textContent = "0 matches";
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

  const finderBtnNextEl = document.getElementById("finder-btn-next") || finderBtnNext;
  const finderBtnPrevEl = document.getElementById("finder-btn-prev") || finderBtnPrev;
  if (finderBtnNextEl) finderBtnNextEl.addEventListener("click", nextFinderMatch);
  if (finderBtnPrevEl) finderBtnPrevEl.addEventListener("click", prevFinderMatch);

  // Universal Registries
  function getAllShortcutBindings() {
    return [
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Move Main Chapter & Comments",
        subtitle: "Jump strictly between major chapters, comments forum, and statutory footer",
        badge: "Alt + ↓ / ↑",
        keywords: "move chapter alt down up jump chapter sections narrative shortcut binding"
      },
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Move Section & Subsection",
        subtitle: "Step through all directory tree nodes, subsections, topics, and comments",
        badge: "Ctrl + ↓ / ↑",
        keywords: "move subsection step section directly jump ctrl down up arrow shortcut binding"
      },
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Fast Scroll Page",
        subtitle: "Accelerated silky-smooth page scrolling with zero speed flicker",
        badge: "Shift + ↓ / ↑",
        keywords: "fast scroll page smoothly shift arrow down up keyboard scroll navigation shortcut binding"
      },
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Scroll Page Smoothly",
        subtitle: "Continuous delayless page scrolling with zero subpixel font jump",
        badge: "↓ / ↑",
        keywords: "scroll page smoothly arrow down up keyboard scroll navigation shortcut binding"
      },
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Directory Tree Drawer",
        subtitle: "Toggle section tree drawer sticked to the left side of page",
        badge: "Ctrl + ,",
        keywords: "directory tree drawer sections table of contents navigation sticked left side shortcut binding",
        action: () => openTreeExplicitly(true)
      },
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Universal Search & Commands",
        subtitle: "Focus top search bar to search website, shortcuts, settings, and sections",
        badge: "Ctrl + /",
        keywords: "universal search command palette search bar slash find everything shortcut binding",
        action: () => focusNavSearchBar()
      },
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Gemini AI Doubt Solver",
        subtitle: "Toggle AI doubt solver drawer sticked to the right side of page",
        badge: "Ctrl + .",
        keywords: "doubt solver doubt ai google gemini questions answers right drawer shortcut binding",
        action: () => openDoubtSolver()
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "✏️",
        title: "Edit & Markup Palette",
        subtitle: "Toggle floating annotation toolbar for sketching, highlights, text boxes, and sticky notes",
        badge: "Ctrl + ;",
        keywords: "edit markup palette annotations pencil sketch highlight text box sticky note draw tools shortcut binding",
        action: () => toggleAnnotationPanel()
      },
      {
        category: "KEYBOARD SHORTCUTS",
        icon: "⤢",
        title: "Expand Full View (Toggle Top Bar)",
        subtitle: "Hide top bar (Guide, Index, Search) for distraction-free reading",
        badge: "Ctrl + '",
        keywords: "expand full view toggle top bar hide top bar header guide index search shortcut binding",
        action: () => toggleTopBar()
      },
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Toggle Background Grid",
        subtitle: "Toggle subtle background alignment grid",
        badge: "Ctrl + [",
        keywords: "toggle grid background lines alignment shortcut binding",
        action: () => {
          const gridTog = document.getElementById("grid-toggle");
          const isNoGrid = document.body.classList.toggle("no-grid");
          if (gridTog) gridTog.checked = !isNoGrid;
          try { localStorage.setItem("indexindia_grid", isNoGrid ? "off" : "on"); } catch (e) {}
        }
      },
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Toggle Dark / Light Theme",
        subtitle: "Switch between dark OLED theme and clean light theme",
        badge: "Ctrl + ]",
        keywords: "toggle dark light mode contrast theme appearance shortcut binding",
        action: () => toggleThemeMode()
      },
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Contact Us (Issue / Improvement)",
        subtitle: "Open the top-center floating Contact Us bar",
        badge: "Ctrl + Alt + C",
        keywords: "contact us report issue bug improvement screenshot dispatch email shortcut binding",
        action: () => toggleTopFloatingBar("contact")
      },
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Shortcuts Cheatsheet",
        subtitle: "Open the complete institutional keyboard shortcuts reference",
        badge: "Ctrl + \\",
        keywords: "shortcuts panel cheatsheet keyboard reference help backslash shortcut binding",
        action: () => toggleTopFloatingBar("shortcuts")
      },
      {
        category: "KEYBOARD SHORTCUTS",
        title: "Close Open Overlays",
        subtitle: "Dismiss all open drawers, flyouts, and in-page highlight finders",
        badge: "Esc",
        keywords: "close escape dismiss overlays drawers panels highlights cancel shortcut binding",
        action: () => {
          closeAllTopFloatingBars();
          closeTreeExplicitly();
          closeDoubtSolver();
          closeNavSearchResults();
          clearFinderHighlights();
          closeAnnotationPanel();
        }
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
        title: "Font Style: Reading (Sans)",
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
        badge: "Ctrl + ,",
        keywords: "directory tree rail sections table of contents drawer navigation",
        action: () => openTreeExplicitly(true)
      },
      {
        category: "NAVIGATION & PANELS",
        icon: "✨",
        title: "Gemini AI Doubt Solver",
        subtitle: "Ask questions, resolve doubts, and scan screen with Google Gemini",
        badge: "Ctrl + .",
        keywords: "doubt solver gemini ai google duckduckgo ddg explainer question ask search",
        action: () => openDoubtSolver()
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
      { title: "Guide Landing — Chapter 1: Entities & Chapter 2: Payment Gateways", file: "guide.html", sub: "Definitive statutory index of all business structures & payment gateway directory", kw: "guide entities registration matrix payment gateways razorpay cosmofeed stripe aggregator neobanking" },
      { title: "Statutory & Privacy Dossier — Legal Disclosures & AI Telemetry", file: "guide.html#sec-ai-telemetry", sub: "SEBI non-advisory mandate, Gemini AI telemetry, privacy policy", kw: "statutory privacy legal sebi disclaimer gemini terms compliance refund cosmofeed razorpay" },
      { title: "Sovereign Clearance & Memberships", file: "guide.html#account-floating-bar", sub: "Direct Razorpay checkout & lifetime pass", kw: "membership pricing upgrade clearance access plan razorpay" }
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
          ${item.icon ? `<span class="palette-item-icon">${item.icon}</span>` : ""}
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

  function openSearchPanel() {
    openTopFloatingBar("search");
  }

  function closeSearchPanel() {
    closeTopFloatingBar("search");
  }

  function toggleSearchPanel() {
    toggleTopFloatingBar("search");
  }

  focusNavSearchBar = openSearchPanel;

  closeNavSearchResults = function() {
    const dropdown = document.getElementById("nav-search-results-dropdown") || navSearchResultsDropdown;
    if (dropdown) {
      dropdown.classList.remove("is-open");
      dropdown.innerHTML = "";
    }
    paletteCurrentItems = [];
    paletteSelectedIndex = -1;
  };

  window.focusNavSearchBar = focusNavSearchBar;
  window.closeNavSearchResults = closeNavSearchResults;
  window.openSearchPanel = openSearchPanel;
  window.closeSearchPanel = closeSearchPanel;
  window.toggleSearchPanel = toggleSearchPanel;

  const sBarEl = document.getElementById("search-floating-bar") || searchFloatingBar;
  if (sBarEl) {
    makeFloatingBarDraggable(sBarEl);
  }

  registerTopFloatingBar({
    id: "search",
    wrapper: document.getElementById("search-nav-wrapper"),
    btn: document.getElementById("search-nav-btn") || searchNavBtn,
    barId: "search-floating-bar",
    extraHoverSelectors: ["#nav-search-results-dropdown"],
    onPreview: () => {
      // Preview shows bar cleanly on hover without stealing focus from page
    },
    onPin: ({ fromInteraction }) => {
      if (!fromInteraction) {
        const inp = document.getElementById("nav-search-input") || navSearchInput;
        if (inp) {
          setTimeout(() => {
            inp.focus();
            if (inp.value) {
              inp.select();
              renderSearchResults(inp.value);
            }
          }, 30);
        }
      }
    },
    onClose: () => {
      closeNavSearchResults();
      const inp = document.getElementById("nav-search-input") || navSearchInput;
      if (inp) inp.blur();
    }
  });

  const sClearBtn = document.getElementById("search-panel-clear-btn") || searchClearBtn;
  if (sClearBtn) {
    sClearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const inp = document.getElementById("nav-search-input") || navSearchInput;
      if (inp) {
        inp.value = "";
        inp.focus();
      }
      sClearBtn.style.display = "none";
      clearFinderHighlights();
      renderSearchResults("");
    });
  }

  const searchInputEl = document.getElementById("nav-search-input") || navSearchInput;
  if (searchInputEl) {
    searchInputEl.addEventListener("focus", () => {
      if (searchInputEl.value.length > 0) {
        renderSearchResults(searchInputEl.value);
      }
    });

    searchInputEl.addEventListener("click", () => {
      if (searchInputEl.value.length > 0) {
        renderSearchResults(searchInputEl.value);
      }
    });

    searchInputEl.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      const clr = document.getElementById("search-panel-clear-btn") || searchClearBtn;
      if (clr) {
        clr.style.display = e.target.value.length > 0 ? "block" : "none";
      }
      if (val.length >= 2) {
        highlightInPageText(val);
      } else {
        clearFinderHighlights();
      }
      renderSearchResults(e.target.value);
    });

    searchInputEl.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        if (paletteCurrentItems.length > 0) {
          e.preventDefault();
          setPaletteSelectedIndex(paletteSelectedIndex + 1);
        } else if (finderMatches.length > 0) {
          e.preventDefault();
          nextFinderMatch();
        }
      } else if (e.key === "ArrowUp") {
        if (paletteCurrentItems.length > 0) {
          e.preventDefault();
          setPaletteSelectedIndex(paletteSelectedIndex - 1);
        } else if (finderMatches.length > 0) {
          e.preventDefault();
          prevFinderMatch();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (paletteSelectedIndex >= 0 && paletteSelectedIndex < paletteCurrentItems.length) {
          executePaletteItem(paletteSelectedIndex);
        } else if (finderMatches.length > 0) {
          if (e.shiftKey) {
            prevFinderMatch();
          } else {
            nextFinderMatch();
          }
        } else if (searchInputEl.value.trim().length >= 2) {
          highlightInPageText(searchInputEl.value.trim());
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeSearchPanel();
      }
    });
  }

  // Outside click only collapses the autocomplete suggestions dropdown, NOT the pinned search bar
  document.addEventListener("mousedown", (e) => {
    const bar = document.getElementById("search-floating-bar") || searchFloatingBar;
    const btn = document.getElementById("search-nav-btn") || searchNavBtn;
    if (bar && bar.classList.contains("is-visible")) {
      if (!bar.contains(e.target) && (!btn || !btn.contains(e.target))) {
        closeNavSearchResults();
      }
    }
  });

  // ==========================================================================
  // 12. IN-PAGE EDIT & MARKUP ANNOTATION SYSTEM (PENCIL, HIGHLIGHT, TEXTBOX, NOTES)
  // ==========================================================================
  const editNavBtn = document.getElementById("edit-nav-btn");
  let editAnnotationBar = document.getElementById("edit-annotation-bar");
  let annotationLayerContainer = document.getElementById("annotation-layer-container");
  let annotationSvgCanvas = document.getElementById("annotation-svg-canvas");
  let annotationHtmlElements = document.getElementById("annotation-html-elements");
  let annotationDragPreview = document.getElementById("annotation-drag-preview");
  let selectionTooltip = document.getElementById("selection-highlight-tooltip");
  let stickerPopover = document.getElementById("sticker-popover");

  const savedGridSizePref = parseInt(localStorage.getItem("indexindia_grid_size") || "24", 10);
  const initialGridSize = (!isNaN(savedGridSizePref) && savedGridSizePref >= 12 && savedGridSizePref <= 64) ? savedGridSizePref : 24;
  document.documentElement.style.setProperty("--grid-size", `${initialGridSize}px`);

  const savedTextboxFontPref = parseInt(localStorage.getItem("indexindia_textbox_font_size") || "14", 10);
  const initialTextboxFontSize = (!isNaN(savedTextboxFontPref) && savedTextboxFontPref >= 10 && savedTextboxFontPref <= 32) ? savedTextboxFontPref : 14;

  let annotationState = {
    isOpen: false,
    activeTool: "sketch", // select | sketch | highlight | textbox | stickynote | sticker | eraser
    activeColor: "#FFE066",
    activeSize: 4,
    strokeStyle: "solid", // solid | dashed | marker
    highlightStyle: "soft", // soft | vivid | underline
    textBoxFontSize: initialTextboxFontSize,
    eraserFilter: "all", // all | stroke | highlight | note | sticker
    gridSize: initialGridSize,
    currentFocusIdx: -1,
    activeSticker: { type: "tag", variant: "danger", label: "⚠️ HIGH RISK" },
    selectedElementIds: new Set(),
    snapToGrid: localStorage.getItem("indexindia_snap_to_grid") === "true"
  };

  function getGridSize() {
    const rootStyles = getComputedStyle(document.documentElement);
    const sizeStr = rootStyles.getPropertyValue("--grid-size").trim();
    const parsed = parseInt(sizeStr, 10);
    return isNaN(parsed) || parsed <= 0 ? 24 : parsed;
  }

  setGridSizePx = function(px) {
    const val = Math.max(12, Math.min(64, parseInt(px, 10) || 24));
    annotationState.gridSize = val;
    document.documentElement.style.setProperty("--grid-size", `${val}px`);
    try {
      localStorage.setItem("indexindia_grid_size", String(val));
    } catch (_) {}
    syncAllShortcutToolBarsUI();
  };

  function snapVal(val, size) {
    if (!annotationState.snapToGrid) return val;
    const g = size || getGridSize();
    return Math.round(val / g) * g;
  }

  function setSnapToGrid(enabled) {
    annotationState.snapToGrid = Boolean(enabled);
    try {
      localStorage.setItem("indexindia_snap_to_grid", annotationState.snapToGrid ? "true" : "false");
    } catch (e) {}

    const snapBtn = document.getElementById("annotation-btn-snap");
    if (snapBtn) {
      snapBtn.classList.toggle("active", annotationState.snapToGrid);
      snapBtn.setAttribute("aria-pressed", annotationState.snapToGrid ? "true" : "false");
    }

    document.querySelectorAll(".edit-flyout-snap-toggle, #edit-flyout-snap-toggle").forEach((toggle) => {
      toggle.checked = annotationState.snapToGrid;
    });

    if (annotationState.snapToGrid && document.body.classList.contains("no-grid")) {
      document.body.classList.remove("no-grid");
      const gridToggle = document.getElementById("grid-toggle");
      if (gridToggle) gridToggle.checked = true;
      try { localStorage.setItem("indexindia_grid", "on"); } catch (_) {}
    }
    syncAllShortcutToolBarsUI();
  }

  function toggleSnapToGrid() {
    setSnapToGrid(!annotationState.snapToGrid);
  }

  function hexToRgba(hex, alpha) {
    let c = (hex || "#FFE066").replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function canEraseType(type) {
    const f = annotationState.eraserFilter || "all";
    if (f === "all") return true;
    if (f === "stroke") return type === "stroke";
    if (f === "highlight") return type === "highlight";
    if (f === "note") return type === "textbox" || type === "stickynote";
    if (f === "sticker") return type === "sticker";
    return true;
  }

  function applyHighlightVisualStyle(markEl, color, style) {
    if (!markEl) return;
    const col = color || "#FFE066";
    const st = style || "soft";
    if (st === "vivid") {
      markEl.style.backgroundColor = hexToRgba(col, 0.62);
      markEl.style.borderBottom = `2px solid ${col}`;
    } else if (st === "underline") {
      markEl.style.backgroundColor = "transparent";
      markEl.style.borderBottom = `2.5px solid ${col}`;
    } else {
      markEl.style.backgroundColor = hexToRgba(col, 0.35);
      markEl.style.borderBottom = `2px solid ${col}`;
    }
  }

  // Check if click/pointer event is within top-nav or side navigation drawers
  function isInsideNavigationPanels(e) {
    const topNav = document.getElementById("top-nav");
    const topNavH = (topNav && !document.body.classList.contains("top-bar-hidden")) ? topNav.offsetHeight : 0;
    if (e.clientY < topNavH) return true;
    const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (!targetEl || typeof targetEl.closest !== "function") return false;
    if (
      targetEl.closest(".top-nav") ||
      targetEl.closest(".rail-navigator") ||
      targetEl.closest("#doubt-solver-tile") ||
      targetEl.closest(".edit-annotation-bar") ||
      targetEl.closest(".utility-floating-bar") ||
      targetEl.closest(".search-floating-bar") ||
      targetEl.closest(".shortcut-customizer-bar") ||
      targetEl.closest(".sticker-popover") ||
      targetEl.closest(".nav-restore-float-btn")
    ) {
      return true;
    }
    return false;
  }

  // Inject Overlay Container DOM if not already present
  if (!annotationLayerContainer) {
    annotationLayerContainer = document.createElement("div");
    annotationLayerContainer.id = "annotation-layer-container";
    annotationLayerContainer.innerHTML = `
      <svg id="annotation-svg-canvas"></svg>
      <div id="annotation-html-elements"></div>
      <div id="annotation-drag-preview" class="annotation-drag-preview" style="display:none;"></div>
      <div id="annotation-selection-rect" class="annotation-selection-rect" style="display:none;"></div>
      <div id="selection-highlight-tooltip" class="selection-highlight-tooltip" style="display:none;">
        <button type="button" class="selection-highlight-btn" id="btn-quick-highlight">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 7-4.5-4.5-8.5 8.5 4.5 4.5L22 7z"/></svg> <span>Highlight</span>
        </button>
      </div>
    `;
    document.body.appendChild(annotationLayerContainer);
  }

  annotationSvgCanvas = annotationLayerContainer.querySelector("#annotation-svg-canvas");
  annotationHtmlElements = annotationLayerContainer.querySelector("#annotation-html-elements");
  annotationDragPreview = annotationLayerContainer.querySelector("#annotation-drag-preview");
  let annotationSelectionRect = annotationLayerContainer.querySelector("#annotation-selection-rect");
  selectionTooltip = annotationLayerContainer.querySelector("#selection-highlight-tooltip");

  // Inject Floating Toolbar Palette DOM (styled identically to In-Page Finder bar)
  if (!editAnnotationBar) {
    editAnnotationBar = document.createElement("div");
    editAnnotationBar.id = "edit-annotation-bar";
    editAnnotationBar.className = "edit-annotation-bar";
    editAnnotationBar.setAttribute("role", "toolbar");
    editAnnotationBar.setAttribute("aria-label", "Edit & Annotation Palette");
    editAnnotationBar.innerHTML = `
      <span class="palette-drag-handle" title="Drag Palette">
        <svg width="10" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2.5"/><circle cx="8" cy="12" r="2.5"/><circle cx="8" cy="20" r="2.5"/><circle cx="16" cy="4" r="2.5"/><circle cx="16" cy="12" r="2.5"/><circle cx="16" cy="20" r="2.5"/></svg>
      </span>
      <div class="palette-tool-group">
        <button type="button" class="palette-tool-btn" data-tool="select" data-hover-tag="[SELECT]" aria-label="Select">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
          </span>
        </button>
        <button type="button" class="palette-tool-btn active" data-tool="sketch" data-hover-tag="[SKETCH]" aria-label="Sketch">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </span>
        </button>
        <button type="button" class="palette-tool-btn" data-tool="highlight" data-hover-tag="[HIGHLIGHT]" aria-label="Highlight">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 7-4.5-4.5-8.5 8.5 4.5 4.5L22 7z"/></svg>
          </span>
        </button>
        <button type="button" class="palette-tool-btn" data-tool="textbox" data-hover-tag="[TEXT]" aria-label="Box">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          </span>
        </button>
        <button type="button" class="palette-tool-btn" data-tool="stickynote" data-hover-tag="[NOTE]" aria-label="Note">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><polyline points="15 3 21 9 15 9 15 3"/></svg>
          </span>
        </button>
        <button type="button" class="palette-tool-btn" data-tool="sticker" id="palette-btn-sticker" data-hover-tag="[STICKER]" aria-label="Stickers">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </span>
        </button>
        <button type="button" class="palette-tool-btn" data-tool="eraser" data-hover-tag="[ERASER]" aria-label="Eraser">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/></svg>
          </span>
        </button>
      </div>
      <span class="palette-sep">|</span>
      <div class="palette-color-group">
        <button type="button" class="palette-color-btn active" data-color="#FFE066" style="--swatch-color: #FFE066;"></button>
        <button type="button" class="palette-color-btn" data-color="#FF6B35" style="--swatch-color: #FF6B35;"></button>
        <button type="button" class="palette-color-btn" data-color="#38BDF8" style="--swatch-color: #38BDF8;"></button>
        <button type="button" class="palette-color-btn" data-color="#34D399" style="--swatch-color: #34D399;"></button>
      </div>
      <span class="palette-sep">|</span>
      <div class="palette-size-group">
        <button type="button" class="palette-size-btn" data-size="2">
          <span class="palette-size-dot" style="width: 3px; height: 3px;"></span>
        </button>
        <button type="button" class="palette-size-btn active" data-size="4">
          <span class="palette-size-dot" style="width: 6px; height: 6px;"></span>
        </button>
        <button type="button" class="palette-size-btn" data-size="8">
          <span class="palette-size-dot" style="width: 10px; height: 10px;"></span>
        </button>
        <button type="button" class="palette-size-btn" data-size="14">
          <span class="palette-size-dot" style="width: 14px; height: 14px;"></span>
        </button>
      </div>
      <span class="palette-sep">|</span>
      <div class="palette-action-group">
        <button type="button" class="palette-btn ${annotationState.snapToGrid ? 'active' : ''}" id="annotation-btn-snap" data-hover-tag="[SNAP TO GRID]" aria-pressed="${annotationState.snapToGrid}">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
          </span>
        </button>
        <button type="button" class="palette-btn" id="annotation-btn-undo" data-hover-tag="[UNDO]">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </span>
        </button>
        <button type="button" class="palette-btn" id="annotation-btn-redo" data-hover-tag="[REDO]">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
          </span>
        </button>
        <button type="button" class="palette-btn" id="annotation-btn-clear" data-hover-tag="[CLEAR]">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </span>
        </button>
      </div>
      <button type="button" class="palette-close-btn" id="annotation-btn-close" data-hover-tag="[CLOSE]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    document.body.appendChild(editAnnotationBar);
  }

  // Inject Sticker Palette Popover DOM
  if (!stickerPopover) {
    stickerPopover = document.createElement("div");
    stickerPopover.id = "sticker-popover";
    stickerPopover.className = "sticker-popover";
    stickerPopover.innerHTML = `
      <div class="sticker-popover-header">
        <span>FORENSIC STICKER PALETTE</span>
        <button type="button" class="sticker-popover-close" id="btn-close-stickers">&times;</button>
      </div>
      <div class="sticker-section-label">AUDIT &amp; DUE DILIGENCE BADGES</div>
      <div class="sticker-badges-grid">
        <button type="button" class="sticker-badge-btn variant-danger" data-type="tag" data-variant="danger" data-label="⚠️ HIGH RISK">⚠️ HIGH RISK</button>
        <button type="button" class="sticker-badge-btn variant-success" data-type="tag" data-variant="success" data-label="✅ VERIFIED">✅ VERIFIED</button>
        <button type="button" class="sticker-badge-btn variant-danger" data-type="tag" data-variant="danger" data-label="🚨 RED FLAG">🚨 RED FLAG</button>
        <button type="button" class="sticker-badge-btn variant-info" data-type="tag" data-variant="info" data-label="🔍 AUDIT REQ">🔍 AUDIT REQ</button>
        <button type="button" class="sticker-badge-btn variant-warning" data-type="tag" data-variant="warning" data-label="📌 KEY FINDING">📌 KEY FINDING</button>
        <button type="button" class="sticker-badge-btn variant-purple" data-type="tag" data-variant="purple" data-label="⚖️ COMPLIANT">⚖️ COMPLIANT</button>
        <button type="button" class="sticker-badge-btn variant-teal" data-type="tag" data-variant="teal" data-label="💡 INSIGHT">💡 INSIGHT</button>
        <button type="button" class="sticker-badge-btn variant-warning" data-type="tag" data-variant="warning" data-label="🛡️ MOAT">🛡️ MOAT</button>
      </div>
      <div class="sticker-section-label">RESEARCH ICONS &amp; STAMPS</div>
      <div class="sticker-emojis-grid">
        <button type="button" class="sticker-emoji-btn" data-type="emoji" data-icon="🎯" title="Target">🎯</button>
        <button type="button" class="sticker-emoji-btn" data-type="emoji" data-icon="📈" title="Growth">📈</button>
        <button type="button" class="sticker-emoji-btn" data-type="emoji" data-icon="📉" title="Decline">📉</button>
        <button type="button" class="sticker-emoji-btn" data-type="emoji" data-icon="🚩" title="Red Flag">🚩</button>
        <button type="button" class="sticker-emoji-btn" data-type="emoji" data-icon="⭐" title="Star">⭐</button>
        <button type="button" class="sticker-emoji-btn" data-type="emoji" data-icon="🔥" title="Priority">🔥</button>
        <button type="button" class="sticker-emoji-btn" data-type="emoji" data-icon="🏛️" title="Statutory">🏛️</button>
        <button type="button" class="sticker-emoji-btn" data-type="emoji" data-icon="💰" title="Capital">💰</button>
      </div>
    `;
    document.body.appendChild(stickerPopover);
  }

  const annotationCounter = editAnnotationBar.querySelector("#annotation-counter");
  const annotationBtnPrev = editAnnotationBar.querySelector("#annotation-btn-prev");
  const annotationBtnNext = editAnnotationBar.querySelector("#annotation-btn-next");
  const annotationBtnSnap = editAnnotationBar.querySelector("#annotation-btn-snap");
  const annotationBtnUndo = editAnnotationBar.querySelector("#annotation-btn-undo");
  const annotationBtnRedo = editAnnotationBar.querySelector("#annotation-btn-redo");
  const annotationBtnClear = editAnnotationBar.querySelector("#annotation-btn-clear");
  const annotationBtnClose = editAnnotationBar.querySelector("#annotation-btn-close");
  const paletteDragHandle = editAnnotationBar.querySelector(".palette-drag-handle");
  const btnQuickHighlight = selectionTooltip?.querySelector("#btn-quick-highlight");
  const btnCloseStickers = stickerPopover.querySelector("#btn-close-stickers");

  const annotationRedoStack = [];

  if (annotationBtnSnap) {
    annotationBtnSnap.addEventListener("click", (e) => {
      e.preventDefault();
      toggleSnapToGrid();
    });
  }



  let annotationCanvasSpacer = null;
  function getAnnotationCanvasSpacer() {
    if (!annotationCanvasSpacer) {
      annotationCanvasSpacer = document.getElementById("annotation-canvas-spacer");
    }
    if (!annotationCanvasSpacer) {
      annotationCanvasSpacer = document.createElement("div");
      annotationCanvasSpacer.id = "annotation-canvas-spacer";
      annotationCanvasSpacer.className = "annotation-canvas-spacer";
      document.body.appendChild(annotationCanvasSpacer);
    }
    return annotationCanvasSpacer;
  }

  function getRightmostAnnotationX() {
    let maxX = 0;
    if (Array.isArray(annotationsData.textboxes)) {
      for (let i = 0; i < annotationsData.textboxes.length; i++) {
        const b = annotationsData.textboxes[i];
        const right = (Number(b.x) || 0) + (Number(b.width) || 160);
        if (right > maxX) maxX = right;
      }
    }
    if (Array.isArray(annotationsData.stickynotes)) {
      for (let i = 0; i < annotationsData.stickynotes.length; i++) {
        const n = annotationsData.stickynotes[i];
        const right = (Number(n.x) || 0) + (Number(n.width) || 200);
        if (right > maxX) maxX = right;
      }
    }
    if (Array.isArray(annotationsData.stickers)) {
      for (let i = 0; i < annotationsData.stickers.length; i++) {
        const s = annotationsData.stickers[i];
        const right = (Number(s.x) || 0) + 120;
        if (right > maxX) maxX = right;
      }
    }
    if (Array.isArray(annotationsData.strokes)) {
      for (let i = 0; i < annotationsData.strokes.length; i++) {
        const pts = annotationsData.strokes[i].points;
        if (Array.isArray(pts)) {
          for (let j = 0; j < pts.length; j++) {
            const pt = pts[j];
            const px = (pt && typeof pt.x === "number") ? pt.x : (Array.isArray(pt) ? pt[0] : 0);
            if (px > maxX) maxX = px;
          }
        }
      }
    }
    return maxX;
  }

  function computeDynamicCanvasWidth(extraX = 0) {
    const isAnnotating = document.body.classList.contains("is-annotating");
    const hasAnnotations = document.body.classList.contains("has-annotations");

    if (!isAnnotating && !hasAnnotations && extraX <= 0) {
      return window.innerWidth || document.documentElement.clientWidth;
    }

    const mainEl = document.querySelector(".main-viewport-wrapper") ||
                   document.querySelector(".content-area") ||
                   document.querySelector("main") ||
                   document.body;
    const mainRect = mainEl ? mainEl.getBoundingClientRect() : null;
    const contentRight = mainRect ? Math.round(mainRect.left + window.scrollX + mainRect.width) : (window.innerWidth || 1200);
    const baseRight = Math.max(contentRight, window.innerWidth || 1200);

    const rightmostAnnotation = Math.max(getRightmostAnnotationX(), Number(extraX) || 0);
    const lastAnnotatedPoint = Math.max(baseRight, rightmostAnnotation);

    // Dynamic 1000px clean area page from the last annotated sketch, box, sticker etc
    return Math.round(lastAnnotatedPoint + 1000);
  }

  function syncAnnotationCanvasDimensions(activePointX = 0) {
    if (!annotationSvgCanvas) return;

    const isAnnotating = document.body.classList.contains("is-annotating");
    const hasAnnotations = document.body.classList.contains("has-annotations");
    const spacer = getAnnotationCanvasSpacer();

    let targetWidth = 0;
    if (isAnnotating || hasAnnotations || activePointX > 0) {
      targetWidth = computeDynamicCanvasWidth(activePointX);
      if (spacer) {
        spacer.style.width = targetWidth + "px";
        spacer.style.display = "block";
      }
    } else {
      if (spacer) {
        spacer.style.width = "0px";
        spacer.style.display = "none";
      }
    }

    const scrollH = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      window.innerHeight
    );
    const scrollW = Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      targetWidth,
      window.innerWidth
    );

    annotationSvgCanvas.style.width = scrollW + "px";
    annotationSvgCanvas.style.height = scrollH + "px";
    if (annotationLayerContainer) {
      annotationLayerContainer.style.width = scrollW + "px";
      annotationLayerContainer.style.height = scrollH + "px";
    }
  }

  function saveAnnotations() {
    try {
      annotationsData.updatedAt = Date.now();
      localStorage.setItem(ANNOTATION_STORAGE_KEY, JSON.stringify(annotationsData));
    } catch (err) {
      console.warn("IndexIndia: Unable to persist annotations to localStorage", err);
    }
    const hasAny = (
      (annotationsData.stickynotes && annotationsData.stickynotes.length > 0) ||
      (annotationsData.textboxes && annotationsData.textboxes.length > 0) ||
      (annotationsData.strokes && annotationsData.strokes.length > 0) ||
      (annotationsData.stickers && annotationsData.stickers.length > 0)
    );
    if (hasAny) {
      document.body.classList.add("has-annotations");
    }
    if (typeof syncAnnotationCanvasDimensions === "function") {
      syncAnnotationCanvasDimensions();
    }
    if (typeof triggerCloudAnnotationSync === "function") {
      triggerCloudAnnotationSync();
    }
  }

  function updateAnnotationCounter() {
    if (!annotationCounter) return;
    const total =
      (annotationsData.strokes?.length || 0) +
      (annotationsData.textboxes?.length || 0) +
      (annotationsData.stickynotes?.length || 0) +
      (annotationsData.highlights?.length || 0) +
      (annotationsData.stickers?.length || 0);

    if (total === 0) {
      annotationCounter.textContent = "0 notes";
    } else if (annotationState.currentFocusIdx >= 0 && annotationState.currentFocusIdx < total) {
      annotationCounter.textContent = `${annotationState.currentFocusIdx + 1} of ${total} notes`;
    } else {
      annotationCounter.textContent = `${total} item${total > 1 ? "s" : ""}`;
    }
  }

  function deleteAnnotationItem(id, type) {
    if (type === "stroke") {
      annotationsData.strokes = annotationsData.strokes.filter((s) => s.id !== id);
      const el = annotationSvgCanvas?.querySelector(`[data-id="${id}"]`);
      if (el) el.remove();
    } else if (type === "textbox") {
      annotationsData.textboxes = annotationsData.textboxes.filter((tb) => tb.id !== id);
      const el = annotationHtmlElements?.querySelector(`.user-annotation-textbox[data-id="${id}"]`);
      if (el) el.remove();
    } else if (type === "stickynote") {
      annotationsData.stickynotes = annotationsData.stickynotes.filter((sn) => sn.id !== id);
      const el = annotationHtmlElements?.querySelector(`.user-annotation-stickynote[data-id="${id}"]`);
      if (el) el.remove();
    } else if (type === "sticker") {
      annotationsData.stickers = (annotationsData.stickers || []).filter((stk) => stk.id !== id);
      const el = annotationHtmlElements?.querySelector(`.user-annotation-sticker[data-id="${id}"]`);
      if (el) el.remove();
    } else if (type === "highlight") {
      annotationsData.highlights = annotationsData.highlights.filter((hl) => hl.id !== id);
      const mark = document.querySelector(`mark.user-annotation-highlight[data-id="${id}"]`);
      if (mark && mark.parentNode) {
        const textNode = document.createTextNode(mark.textContent);
        mark.parentNode.replaceChild(textNode, mark);
      }
    }
    saveAnnotations();
    updateAnnotationCounter();
  }

  function handleItemClick(id, type) {
    if (annotationState.activeTool === "eraser" && canEraseType(type)) {
      deleteAnnotationItem(id, type);
    }
  }

  // --- 1. RENDER & DRAG TEXT BOX ---
  function renderTextBoxDOM(tb) {
    if (!annotationHtmlElements) return null;
    const el = document.createElement("div");
    el.className = "user-annotation-textbox";
    el.setAttribute("data-id", tb.id);
    el.style.left = `${tb.left}px`;
    el.style.top = `${tb.top}px`;
    el.style.width = `${tb.width}px`;
    el.style.height = `${tb.height}px`;
    el.style.setProperty("--box-border-color", tb.color || "#FFE066");

    el.innerHTML = `
      <div class="textbox-content" contenteditable="false" placeholder="Type text here...">${tb.text || ""}</div>
      <div class="textbox-resize-handle" title="Drag to resize"></div>
    `;

    const content = el.querySelector(".textbox-content");
    if (content) {
      content.style.fontSize = `${tb.fontSize || annotationState.textBoxFontSize || 14}px`;
    }
    const resizeHandle = el.querySelector(".textbox-resize-handle");

    let isMoving = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
    let hasMoved = false;

    function selectBox() {
      document.querySelectorAll(".user-annotation-textbox.is-selected, .user-annotation-stickynote.is-selected").forEach((item) => {
        if (item !== el) {
          item.classList.remove("is-selected");
          const c = item.querySelector(".textbox-content");
          if (c) c.contentEditable = "false";
        }
      });
      el.classList.add("is-selected");
      if (!annotationState.selectedElementIds) annotationState.selectedElementIds = new Set();
      annotationState.selectedElementIds.clear();
      annotationState.selectedElementIds.add(tb.id);
    }

    function unselectBox() {
      el.classList.remove("is-selected");
      content.contentEditable = "false";
      if (annotationState.selectedElementIds) {
        annotationState.selectedElementIds.delete(tb.id);
      }
    }

    el.addEventListener("pointerdown", (e) => {
      if (annotationState.activeTool === "eraser" && canEraseType("textbox")) {
        e.stopPropagation();
        deleteAnnotationItem(tb.id, "textbox");
        return;
      }
      if (e.target === resizeHandle) return;

      // If user is already editing text and clicked inside content, allow normal text cursor / editing
      if (content.contentEditable === "true" && e.target === content) {
        return;
      }

      isMoving = true;
      hasMoved = false;
      startX = e.pageX;
      startY = e.pageY;
      initialLeft = parseInt(el.style.left, 10) || tb.left;
      initialTop = parseInt(el.style.top, 10) || tb.top;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      e.stopPropagation();
    });

    el.addEventListener("pointermove", (e) => {
      if (!isMoving) return;
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      if (Math.hypot(dx, dy) > 3) {
        hasMoved = true;
        let newL = Math.max(0, initialLeft + dx);
        let newT = Math.max(0, initialTop + dy);
        if (annotationState.snapToGrid) {
          newL = Math.max(0, snapVal(newL));
          newT = Math.max(0, snapVal(newT));
        }
        el.style.left = `${newL}px`;
        el.style.top = `${newT}px`;
      }
    });

    const stopBoxMove = () => {
      if (!isMoving) return;
      isMoving = false;
      if (hasMoved) {
        let finalL = parseInt(el.style.left, 10);
        let finalT = parseInt(el.style.top, 10);
        if (annotationState.snapToGrid) {
          finalL = Math.max(0, snapVal(finalL));
          finalT = Math.max(0, snapVal(finalT));
          el.style.left = `${finalL}px`;
          el.style.top = `${finalT}px`;
        }
        tb.left = finalL;
        tb.top = finalT;
        saveAnnotations();
      } else {
        // Single click: select and enable editing
        selectBox();
        content.contentEditable = "true";
        content.focus();
      }
    };

    el.addEventListener("pointerup", stopBoxMove);
    el.addEventListener("pointercancel", stopBoxMove);

    content.addEventListener("input", () => {
      tb.text = content.innerText;
      saveAnnotations();
    });

    content.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        const text = (content.textContent || content.innerText || "").replace(/\n/g, "").trim();
        if (!text) {
          e.preventDefault();
          deleteAnnotationItem(tb.id, "textbox");
        }
      } else if (e.key === "Escape") {
        unselectBox();
        content.blur();
      }
    });

    // Resize handle
    if (resizeHandle) {
      let isResizing = false;
      let rStartX = 0, rStartY = 0, rStartW = 0, rStartH = 0;
      resizeHandle.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        isResizing = true;
        rStartX = e.pageX;
        rStartY = e.pageY;
        rStartW = el.offsetWidth;
        rStartH = el.offsetHeight;
        try { resizeHandle.setPointerCapture(e.pointerId); } catch (_) {}
      });
      resizeHandle.addEventListener("pointermove", (e) => {
        if (!isResizing) return;
        let newW = Math.max(120, rStartW + (e.pageX - rStartX));
        let newH = Math.max(50, rStartH + (e.pageY - rStartY));
        if (annotationState.snapToGrid) {
          const g = getGridSize();
          newW = Math.max(g * 4, snapVal(newW));
          newH = Math.max(g * 2, snapVal(newH));
        }
        el.style.width = `${newW}px`;
        el.style.height = `${newH}px`;
      });
      const stopResize = () => {
        if (!isResizing) return;
        isResizing = false;
        let finalW = el.offsetWidth;
        let finalH = el.offsetHeight;
        if (annotationState.snapToGrid) {
          const g = getGridSize();
          finalW = Math.max(g * 4, snapVal(finalW));
          finalH = Math.max(g * 2, snapVal(finalH));
          el.style.width = `${finalW}px`;
          el.style.height = `${finalH}px`;
        }
        tb.width = finalW;
        tb.height = finalH;
        saveAnnotations();
      };
      resizeHandle.addEventListener("pointerup", stopResize);
      resizeHandle.addEventListener("pointercancel", stopResize);
    }

    el.addEventListener("mouseup", () => {
      let curW = el.offsetWidth;
      let curH = el.offsetHeight;
      if (annotationState.snapToGrid) {
        const g = getGridSize();
        curW = Math.max(g * 4, snapVal(curW));
        curH = Math.max(g * 2, snapVal(curH));
        el.style.width = `${curW}px`;
        el.style.height = `${curH}px`;
      }
      if (curW !== tb.width || curH !== tb.height) {
        tb.width = curW;
        tb.height = curH;
        saveAnnotations();
      }
    });

    el.addEventListener("click", (e) => {
      if (annotationState.activeTool === "eraser" && canEraseType("textbox")) {
        e.stopPropagation();
        deleteAnnotationItem(tb.id, "textbox");
      }
    });

    annotationHtmlElements.appendChild(el);
    return el;
  }

  // --- 2. RENDER & DRAG / EDIT STICKY NOTE ---
  function renderStickyNoteDOM(sn) {
    if (!annotationHtmlElements) return null;
    const el = document.createElement("div");
    el.className = "user-annotation-stickynote";
    el.setAttribute("data-id", sn.id);
    el.style.left = `${sn.left}px`;
    el.style.top = `${sn.top}px`;
    el.style.setProperty("--note-color", sn.color || "#FFE066");

    el.innerHTML = `
      <div class="sticky-note-card">
        <textarea class="sticky-note-textarea" placeholder="Write sticky note here...">${sn.text || ""}</textarea>
        <div class="sticky-note-resize-handle" title="Drag to resize"></div>
      </div>
    `;

    const card = el.querySelector(".sticky-note-card");
    const textarea = el.querySelector(".sticky-note-textarea");
    const snResize = el.querySelector(".sticky-note-resize-handle");

    const rememberedW = sn.width || parseInt(localStorage.getItem("indexindia_stickynote_width"), 10) || 240;
    const rememberedH = sn.height || parseInt(localStorage.getItem("indexindia_stickynote_height"), 10) || 130;
    if (card) {
      card.style.width = `${rememberedW}px`;
      card.style.height = `${rememberedH}px`;
    }

    let isMovingSn = false;
    let startX = 0, startY = 0, initLeft = 0, initTop = 0;
    let hasMovedSn = false;

    function selectNote() {
      document.querySelectorAll(".user-annotation-textbox.is-selected, .user-annotation-stickynote.is-selected").forEach((item) => {
        if (item !== el) {
          item.classList.remove("is-selected");
          const c = item.querySelector(".textbox-content");
          if (c) c.contentEditable = "false";
        }
      });
      el.classList.add("is-selected");
      if (!annotationState.selectedElementIds) annotationState.selectedElementIds = new Set();
      annotationState.selectedElementIds.clear();
      annotationState.selectedElementIds.add(sn.id);
    }

    function unselectNote() {
      el.classList.remove("is-selected");
      if (annotationState.selectedElementIds) {
        annotationState.selectedElementIds.delete(sn.id);
      }
    }

    card.addEventListener("pointerdown", (e) => {
      if (annotationState.activeTool === "eraser" && canEraseType("stickynote")) {
        e.stopPropagation();
        deleteAnnotationItem(sn.id, "stickynote");
        return;
      }
      if (e.target === snResize) return;

      // If textarea is already active and user clicks inside textarea, let them type
      if (document.activeElement === textarea && e.target === textarea) {
        return;
      }

      isMovingSn = true;
      hasMovedSn = false;
      startX = e.pageX;
      startY = e.pageY;
      initLeft = parseInt(el.style.left, 10) || sn.left;
      initTop = parseInt(el.style.top, 10) || sn.top;
      try { card.setPointerCapture(e.pointerId); } catch (_) {}
      e.stopPropagation();
    });

    card.addEventListener("pointermove", (e) => {
      if (!isMovingSn) return;
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      if (Math.hypot(dx, dy) > 3) {
        hasMovedSn = true;
        let newL = Math.max(0, initLeft + dx);
        let newT = Math.max(0, initTop + dy);
        if (annotationState.snapToGrid) {
          newL = Math.max(0, snapVal(newL));
          newT = Math.max(0, snapVal(newT));
        }
        el.style.left = `${newL}px`;
        el.style.top = `${newT}px`;
      }
    });

    const stopSnMove = () => {
      if (!isMovingSn) return;
      isMovingSn = false;
      if (hasMovedSn) {
        let finalL = parseInt(el.style.left, 10);
        let finalT = parseInt(el.style.top, 10);
        if (annotationState.snapToGrid) {
          finalL = Math.max(0, snapVal(finalL));
          finalT = Math.max(0, snapVal(finalT));
          el.style.left = `${finalL}px`;
          el.style.top = `${finalT}px`;
        }
        sn.left = finalL;
        sn.top = finalT;
        saveAnnotations();
      } else {
        // Single click: select note and focus textarea
        selectNote();
        textarea.focus();
      }
    };

    card.addEventListener("pointerup", stopSnMove);
    card.addEventListener("pointercancel", stopSnMove);

    textarea.addEventListener("input", () => {
      sn.text = textarea.value;
      saveAnnotations();
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        if (!textarea.value.trim()) {
          e.preventDefault();
          deleteAnnotationItem(sn.id, "stickynote");
        }
      } else if (e.key === "Escape") {
        unselectNote();
        textarea.blur();
      }
    });

    // Resize handler
    if (snResize && card) {
      let isResizingSn = false;
      let snStartX = 0, snStartY = 0, snStartW = 0, snStartH = 0;
      snResize.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        isResizingSn = true;
        snStartX = e.pageX;
        snStartY = e.pageY;
        snStartW = card.offsetWidth;
        snStartH = card.offsetHeight;
        try { snResize.setPointerCapture(e.pointerId); } catch (_) {}
      });
      snResize.addEventListener("pointermove", (e) => {
        if (!isResizingSn) return;
        let newW = Math.max(160, snStartW + (e.pageX - snStartX));
        let newH = Math.max(80, snStartH + (e.pageY - snStartY));
        if (annotationState.snapToGrid) {
          const g = getGridSize();
          newW = Math.max(g * 4, snapVal(newW));
          newH = Math.max(g * 3, snapVal(newH));
        }
        card.style.width = `${newW}px`;
        card.style.height = `${newH}px`;
      });
      const stopSnResize = () => {
        if (!isResizingSn) return;
        isResizingSn = false;
        let finalW = card.offsetWidth;
        let finalH = card.offsetHeight;
        if (annotationState.snapToGrid) {
          const g = getGridSize();
          finalW = Math.max(g * 4, snapVal(finalW));
          finalH = Math.max(g * 3, snapVal(finalH));
          card.style.width = `${finalW}px`;
          card.style.height = `${finalH}px`;
        }
        sn.width = finalW;
        sn.height = finalH;
        try {
          localStorage.setItem("indexindia_stickynote_width", finalW);
          localStorage.setItem("indexindia_stickynote_height", finalH);
        } catch (e) {}
        saveAnnotations();
      };
      snResize.addEventListener("pointerup", stopSnResize);
      snResize.addEventListener("pointercancel", stopSnResize);

      card.addEventListener("mouseup", () => {
        let curW = card.offsetWidth;
        let curH = card.offsetHeight;
        if (annotationState.snapToGrid) {
          const g = getGridSize();
          curW = Math.max(g * 4, snapVal(curW));
          curH = Math.max(g * 3, snapVal(curH));
          card.style.width = `${curW}px`;
          card.style.height = `${curH}px`;
        }
        if (curW !== sn.width || curH !== sn.height) {
          sn.width = curW;
          sn.height = curH;
          try {
            localStorage.setItem("indexindia_stickynote_width", curW);
            localStorage.setItem("indexindia_stickynote_height", curH);
          } catch (e) {}
          saveAnnotations();
        }
      });
    }

    el.addEventListener("click", (e) => {
      if (annotationState.activeTool === "eraser" && canEraseType("stickynote")) {
        e.stopPropagation();
        deleteAnnotationItem(sn.id, "stickynote");
      }
    });

    annotationHtmlElements.appendChild(el);
    return el;
  }

  // Close open sticky notes and textboxes editing mode when clicking outside
  document.addEventListener("pointerdown", (e) => {
    const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (!targetEl || typeof targetEl.closest !== "function") return;
    if (
      targetEl.closest(".user-annotation-stickynote") ||
      targetEl.closest(".user-annotation-textbox") ||
      targetEl.closest(".utility-floating-bar") ||
      targetEl.closest(".edit-annotation-bar") ||
      targetEl.closest(".custom-dropdown") ||
      targetEl.closest(".sticker-popover")
    ) {
      return;
    }
    document.querySelectorAll(".user-annotation-stickynote.is-selected, .user-annotation-textbox.is-selected").forEach((n) => {
      n.classList.remove("is-selected");
      const c = n.querySelector(".textbox-content");
      if (c) c.contentEditable = "false";
    });
  });

  // --- 3. RENDER & DRAG STICKER ---
  function renderStickerDOM(stk) {
    if (!annotationHtmlElements) return null;
    const el = document.createElement("div");
    el.className = `user-annotation-sticker ${stk.type === "emoji" ? "is-emoji" : ""}`;
    el.setAttribute("data-id", stk.id);
    el.style.left = `${stk.left}px`;
    el.style.top = `${stk.top}px`;

    let innerContent = "";
    if (stk.type === "emoji") {
      innerContent = `<span class="sticker-inner">${stk.icon}</span>`;
    } else {
      innerContent = `<span class="sticker-inner sticker-badge-btn variant-${stk.variant || "warning"}">${stk.label}</span>`;
    }

    el.innerHTML = `
      ${innerContent}
      <button type="button" class="sticker-delete-btn" title="Delete Sticker">&times;</button>
    `;

    const delBtn = el.querySelector(".sticker-delete-btn");

    // Draggable
    let isDragging = false;
    let startX = 0, startY = 0, initLeft = 0, initTop = 0;
    let hasMoved = false;

    el.addEventListener("pointerdown", (e) => {
      if (e.target === delBtn) return;
      if (annotationState.activeTool === "eraser" && canEraseType("sticker")) {
        e.stopPropagation();
        deleteAnnotationItem(stk.id, "sticker");
        return;
      }
      isDragging = true;
      hasMoved = false;
      startX = e.pageX;
      startY = e.pageY;
      initLeft = parseInt(el.style.left, 10) || stk.left;
      initTop = parseInt(el.style.top, 10) || stk.top;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      e.stopPropagation();
    });

    el.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      if (Math.hypot(dx, dy) > 4) {
        hasMoved = true;
        let newL = Math.max(0, initLeft + dx);
        let newT = Math.max(0, initTop + dy);
        if (annotationState.snapToGrid) {
          newL = Math.max(0, snapVal(newL));
          newT = Math.max(0, snapVal(newT));
        }
        el.style.left = `${newL}px`;
        el.style.top = `${newT}px`;
      }
    });

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      if (hasMoved) {
        let finalL = parseInt(el.style.left, 10);
        let finalT = parseInt(el.style.top, 10);
        if (annotationState.snapToGrid) {
          finalL = Math.max(0, snapVal(finalL));
          finalT = Math.max(0, snapVal(finalT));
          el.style.left = `${finalL}px`;
          el.style.top = `${finalT}px`;
        }
        stk.left = finalL;
        stk.top = finalT;
        saveAnnotations();
      }
    };

    el.addEventListener("pointerup", stopDrag);
    el.addEventListener("pointercancel", stopDrag);

    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteAnnotationItem(stk.id, "sticker");
    });

    el.addEventListener("click", (e) => {
      if (annotationState.activeTool === "eraser" && canEraseType("sticker")) {
        e.stopPropagation();
        deleteAnnotationItem(stk.id, "sticker");
      }
    });

    annotationHtmlElements.appendChild(el);
    return el;
  }

  // --- 4. RECTANGULAR SELECTION & MOVE TOOL ---
  let isSelectingRect = false;
  let selectStartX = 0, selectStartY = 0;

  document.addEventListener("pointerdown", (e) => {
    if (!annotationState.isOpen || annotationState.activeTool !== "select") return;
    if (isInsideNavigationPanels(e)) return;
    if (e.target.closest(".user-annotation-textbox") || e.target.closest(".user-annotation-stickynote") || e.target.closest(".user-annotation-sticker")) {
      return;
    }
    isSelectingRect = true;
    selectStartX = e.pageX;
    selectStartY = e.pageY;
    if (annotationSelectionRect) {
      annotationSelectionRect.style.left = `${selectStartX}px`;
      annotationSelectionRect.style.top = `${selectStartY}px`;
      annotationSelectionRect.style.width = "0px";
      annotationSelectionRect.style.height = "0px";
      annotationSelectionRect.style.display = "block";
    }
  });

  document.addEventListener("pointermove", (e) => {
    if (!isSelectingRect || !annotationSelectionRect) return;
    const minX = Math.min(selectStartX, e.pageX);
    const minY = Math.min(selectStartY, e.pageY);
    const w = Math.abs(e.pageX - selectStartX);
    const h = Math.abs(e.pageY - selectStartY);
    annotationSelectionRect.style.left = `${minX}px`;
    annotationSelectionRect.style.top = `${minY}px`;
    annotationSelectionRect.style.width = `${w}px`;
    annotationSelectionRect.style.height = `${h}px`;
  });

  document.addEventListener("pointerup", (e) => {
    if (!isSelectingRect) return;
    isSelectingRect = false;
    if (annotationSelectionRect) {
      annotationSelectionRect.style.display = "none";
    }
    const minX = Math.min(selectStartX, e.pageX);
    const minY = Math.min(selectStartY, e.pageY);
    const maxX = Math.max(selectStartX, e.pageX);
    const maxY = Math.max(selectStartY, e.pageY);

    // Clear previous selection
    document.querySelectorAll(".annotation-selected").forEach((el) => el.classList.remove("annotation-selected"));
    annotationState.selectedElementIds.clear();

    if (Math.abs(maxX - minX) > 15 && Math.abs(maxY - minY) > 15) {
      // Find intersecting textboxes, stickynotes, stickers, and strokes
      annotationHtmlElements?.querySelectorAll(".user-annotation-textbox, .user-annotation-stickynote, .user-annotation-sticker").forEach((el) => {
        const l = parseInt(el.style.left, 10);
        const t = parseInt(el.style.top, 10);
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (l < maxX && l + w > minX && t < maxY && t + h > minY) {
          el.classList.add("annotation-selected");
          annotationState.selectedElementIds.add(el.getAttribute("data-id"));
        }
      });
      annotationSvgCanvas?.querySelectorAll(".annotation-stroke").forEach((path) => {
        const id = path.getAttribute("data-id");
        const strokeData = annotationsData.strokes.find((s) => s.id === id);
        if (strokeData && strokeData.y >= minY && strokeData.y <= maxY) {
          path.classList.add("annotation-selected");
          annotationState.selectedElementIds.add(id);
        }
      });
    }
  });

  // --- 5. FREE DRAG-AND-SELECT TEXT BOX TOOL ---
  let isBoxDragging = false;
  let boxStartX = 0;
  let boxStartY = 0;

  document.addEventListener("pointerdown", (e) => {
    if (!annotationState.isOpen || annotationState.activeTool !== "textbox") return;
    if (isInsideNavigationPanels(e)) return;
    const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (targetEl && typeof targetEl.closest === "function") {
      if (targetEl.closest(".user-annotation-textbox") || targetEl.closest(".user-annotation-stickynote") || targetEl.closest(".user-annotation-sticker")) {
        return;
      }
    }
    isBoxDragging = true;
    boxStartX = snapVal(e.pageX);
    boxStartY = snapVal(e.pageY);
    if (annotationDragPreview) {
      annotationDragPreview.style.left = `${boxStartX}px`;
      annotationDragPreview.style.top = `${boxStartY}px`;
      annotationDragPreview.style.width = "0px";
      annotationDragPreview.style.height = "0px";
      annotationDragPreview.style.display = "block";
    }
  });

  document.addEventListener("pointermove", (e) => {
    if (!isBoxDragging || !annotationDragPreview) return;
    const curX = snapVal(e.pageX);
    const curY = snapVal(e.pageY);
    const minX = Math.min(boxStartX, curX);
    const minY = Math.min(boxStartY, curY);
    const w = Math.abs(curX - boxStartX);
    const h = Math.abs(curY - boxStartY);
    annotationDragPreview.style.left = `${minX}px`;
    annotationDragPreview.style.top = `${minY}px`;
    annotationDragPreview.style.width = `${w}px`;
    annotationDragPreview.style.height = `${h}px`;
    if (minX + w + 500 > (annotationSvgCanvas ? parseInt(annotationSvgCanvas.style.width, 10) || 0 : 0)) {
      syncAnnotationCanvasDimensions(minX + w);
    }
  });

  document.addEventListener("pointerup", (e) => {
    if (!isBoxDragging) return;
    isBoxDragging = false;
    if (annotationDragPreview) {
      annotationDragPreview.style.display = "none";
    }
    const curX = snapVal(e.pageX);
    const curY = snapVal(e.pageY);
    let minX = Math.min(boxStartX, curX);
    let minY = Math.min(boxStartY, curY);
    let w = Math.abs(curX - boxStartX);
    let h = Math.abs(curY - boxStartY);

    // If user made a text selection on the page, use the exact selected text area
    const sel = window.getSelection();
    let initialText = "";
    if (sel && !sel.isCollapsed && sel.toString().trim()) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      minX = rect.left + window.scrollX;
      minY = rect.bottom + window.scrollY + 6;
      w = Math.max(160, Math.round(rect.width));
      h = Math.max(70, Math.round(rect.height + 30));
      if (annotationState.snapToGrid) {
        const g = getGridSize();
        minX = snapVal(minX);
        minY = snapVal(minY);
        w = Math.max(g * 4, snapVal(w));
        h = Math.max(g * 2, snapVal(h));
      }
      initialText = sel.toString().trim();
      sel.removeAllRanges();
    } else {
      const g = getGridSize();
      if (w < 20 && h < 20) {
        w = annotationState.snapToGrid ? g * 9 : 200;
        h = annotationState.snapToGrid ? g * 3 : 80;
      } else {
        w = Math.max(annotationState.snapToGrid ? g * 4 : 120, w);
        h = Math.max(annotationState.snapToGrid ? g * 2 : 60, h);
      }
    }

    const newTb = {
      id: `tb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      left: Math.round(minX),
      top: Math.round(minY),
      width: Math.round(w),
      height: Math.round(h),
      text: initialText,
      color: annotationState.activeColor,
      fontSize: annotationState.textBoxFontSize || 14
    };
    annotationRedoStack.length = 0;
    annotationsData.textboxes.push(newTb);
    saveAnnotations();
    const boxEl = renderTextBoxDOM(newTb);
    updateAnnotationCounter();
    if (boxEl) {
      const editable = boxEl.querySelector(".textbox-content");
      if (editable) {
        setTimeout(() => editable.focus(), 60);
      }
    }
  });

  // --- 6. CLICK-TO-PLACE STICKY NOTE TOOL ---
  document.addEventListener("click", (e) => {
    if (!annotationState.isOpen || annotationState.activeTool !== "stickynote") return;
    if (isInsideNavigationPanels(e)) return;
    const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (targetEl && typeof targetEl.closest === "function") {
      if (targetEl.closest(".user-annotation-textbox") || targetEl.closest(".user-annotation-stickynote") || targetEl.closest(".user-annotation-sticker")) {
        return;
      }
    }
    const posX = annotationState.snapToGrid ? snapVal(e.pageX) : Math.max(10, e.pageX - 12);
    const posY = annotationState.snapToGrid ? snapVal(e.pageY) : Math.max(10, e.pageY - 12);
    const timeStr = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const newNote = {
      id: `sn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      left: Math.round(posX),
      top: Math.round(posY),
      text: "",
      color: annotationState.activeColor,
      time: timeStr
    };
    annotationRedoStack.length = 0;
    annotationsData.stickynotes.push(newNote);
    saveAnnotations();
    const noteEl = renderStickyNoteDOM(newNote);
    updateAnnotationCounter();
    if (noteEl) {
      noteEl.classList.add("is-selected");
      const textarea = noteEl.querySelector(".sticky-note-textarea");
      if (textarea) {
        setTimeout(() => textarea.focus(), 60);
      }
    }
  });

  // --- 7. CLICK-TO-STAMP STICKER TOOL ---
  document.addEventListener("click", (e) => {
    if (!annotationState.isOpen || annotationState.activeTool !== "sticker") return;
    if (isInsideNavigationPanels(e)) return;
    const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (targetEl && typeof targetEl.closest === "function") {
      if (targetEl.closest(".user-annotation-textbox") || targetEl.closest(".user-annotation-stickynote") || targetEl.closest(".user-annotation-sticker")) {
        return;
      }
    }
    const posX = annotationState.snapToGrid ? snapVal(e.pageX) : Math.max(10, e.pageX - 20);
    const posY = annotationState.snapToGrid ? snapVal(e.pageY) : Math.max(10, e.pageY - 12);
    const active = annotationState.activeSticker || { type: "tag", variant: "danger", label: "⚠️ HIGH RISK" };
    const newStk = {
      id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      left: Math.round(posX),
      top: Math.round(posY),
      type: active.type,
      variant: active.variant,
      label: active.label,
      icon: active.icon
    };
    annotationRedoStack.length = 0;
    if (!annotationsData.stickers) annotationsData.stickers = [];
    annotationsData.stickers.push(newStk);
    saveAnnotations();
    renderStickerDOM(newStk);
    updateAnnotationCounter();
  });

  // Sticker Popover interactions
  stickerPopover.querySelectorAll(".sticker-badge-btn, .sticker-emoji-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = btn.getAttribute("data-type");
      if (type === "emoji") {
        annotationState.activeSticker = { type: "emoji", icon: btn.getAttribute("data-icon") };
      } else {
        annotationState.activeSticker = {
          type: "tag",
          variant: btn.getAttribute("data-variant"),
          label: btn.getAttribute("data-label")
        };
      }
      setAnnotationTool("sticker");
      stickerPopover.classList.remove("is-open");
    });
  });

  if (btnCloseStickers) {
    btnCloseStickers.addEventListener("click", (e) => {
      e.stopPropagation();
      stickerPopover.classList.remove("is-open");
    });
  }

  // --- 8. PENCIL SKETCH OVERLAY DRAWING & MOVE ---
  let isDrawing = false;
  let currentStrokePoints = [];
  let currentPathEl = null;

  function pointsToSvgPath(pts, snap = false) {
    if (!pts || pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y + 0.1}`;
    if (snap) {
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` L ${pts[i].x} ${pts[i].y}`;
      }
      return d;
    }
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      d += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
    }
    d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
    return d;
  }

  function applyStrokeVisualStyle(pathEl, size, strokeStyle) {
    if (!pathEl) return;
    const st = strokeStyle || "solid";
    const sz = Number(size) || 4;
    if (st === "dashed") {
      pathEl.setAttribute("stroke-dasharray", `${Math.max(6, sz * 2)} ${Math.max(5, Math.round(sz * 1.5))}`);
      pathEl.setAttribute("stroke-opacity", "1");
    } else if (st === "marker") {
      pathEl.removeAttribute("stroke-dasharray");
      pathEl.setAttribute("stroke-opacity", "0.45");
    } else {
      pathEl.removeAttribute("stroke-dasharray");
      pathEl.setAttribute("stroke-opacity", "1");
    }
    pathEl.setAttribute("data-stroke-style", st);
  }

  if (annotationSvgCanvas) {
    annotationSvgCanvas.addEventListener("pointerdown", (e) => {
      if (!annotationState.isOpen || annotationState.activeTool !== "sketch") return;
      if (isInsideNavigationPanels(e)) return;
      if (e.button !== 0) return;
      isDrawing = true;
      try { annotationSvgCanvas.setPointerCapture(e.pointerId); } catch (_) {}
      const startX = snapVal(e.pageX);
      const startY = snapVal(e.pageY);
      currentStrokePoints = [{ x: startX, y: startY }];

      currentPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      currentPathEl.setAttribute("class", "annotation-stroke");
      currentPathEl.setAttribute("data-id", `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      currentPathEl.setAttribute("stroke", annotationState.activeColor);
      currentPathEl.setAttribute("stroke-width", annotationState.activeSize);
      currentPathEl.setAttribute("fill", "none");
      currentPathEl.setAttribute("stroke-linecap", "round");
      currentPathEl.setAttribute("stroke-linejoin", "round");
      applyStrokeVisualStyle(currentPathEl, annotationState.activeSize, annotationState.strokeStyle);
      currentPathEl.setAttribute("d", pointsToSvgPath(currentStrokePoints, annotationState.snapToGrid));
      annotationSvgCanvas.appendChild(currentPathEl);
      e.preventDefault();
    });

    annotationSvgCanvas.addEventListener("pointermove", (e) => {
      if (!isDrawing || !currentPathEl) return;
      const ptX = snapVal(e.pageX);
      const ptY = snapVal(e.pageY);
      const lastPt = currentStrokePoints[currentStrokePoints.length - 1];
      if (!lastPt || lastPt.x !== ptX || lastPt.y !== ptY) {
        currentStrokePoints.push({ x: ptX, y: ptY });
        currentPathEl.setAttribute("d", pointsToSvgPath(currentStrokePoints, annotationState.snapToGrid));
        if (currentStrokePoints.length % 6 === 0) {
          syncAnnotationCanvasDimensions(ptX);
        }
      }
    });

    const stopDrawing = () => {
      if (!isDrawing) return;
      isDrawing = false;
      if (currentPathEl && currentStrokePoints.length > 0) {
        const id = currentPathEl.getAttribute("data-id");
        const strokeObj = {
          id,
          color: annotationState.activeColor,
          size: annotationState.activeSize,
          style: annotationState.strokeStyle || "solid",
          d: currentPathEl.getAttribute("d"),
          y: currentStrokePoints[0].y,
          points: currentStrokePoints.map((p) => ({ x: p.x, y: p.y })),
          snapped: annotationState.snapToGrid
        };
        annotationRedoStack.length = 0;
        annotationsData.strokes.push(strokeObj);
        setupStrokeMoveListener(currentPathEl, strokeObj);
        saveAnnotations();
        updateAnnotationCounter();
      }
      currentPathEl = null;
      currentStrokePoints = [];
    };

    annotationSvgCanvas.addEventListener("pointerup", stopDrawing);
    annotationSvgCanvas.addEventListener("pointercancel", stopDrawing);
  }

  // Setup stroke move listener in select mode
  function setupStrokeMoveListener(pathEl, strokeObj) {
    let isMovingStroke = false;
    let startX = 0, startY = 0;
    let initialPoints = [];

    pathEl.addEventListener("pointerdown", (e) => {
      if (annotationState.activeTool === "eraser") {
        if (canEraseType("stroke")) {
          deleteAnnotationItem(strokeObj.id, "stroke");
        }
        return;
      }
      if (annotationState.activeTool !== "select") return;
      isMovingStroke = true;
      startX = e.pageX;
      startY = e.pageY;
      initialPoints = (strokeObj.points || []).map((p) => ({ x: p.x, y: p.y }));
      try { pathEl.setPointerCapture(e.pointerId); } catch (_) {}
      e.stopPropagation();
    });

    pathEl.addEventListener("pointermove", (e) => {
      if (!isMovingStroke || !initialPoints.length) return;
      let dx = e.pageX - startX;
      let dy = e.pageY - startY;
      if (annotationState.snapToGrid) {
        const g = getGridSize();
        dx = Math.round(dx / g) * g;
        dy = Math.round(dy / g) * g;
      }
      const updatedPts = initialPoints.map((p) => ({ x: p.x + dx, y: p.y + dy }));
      strokeObj.points = updatedPts;
      const isSnapped = strokeObj.snapped || annotationState.snapToGrid;
      const newD = pointsToSvgPath(updatedPts, isSnapped);
      strokeObj.d = newD;
      strokeObj.y = updatedPts[0].y;
      pathEl.setAttribute("d", newD);
    });

    const stopStrokeMove = () => {
      if (!isMovingStroke) return;
      isMovingStroke = false;
      saveAnnotations();
    };

    pathEl.addEventListener("pointerup", stopStrokeMove);
    pathEl.addEventListener("pointercancel", stopStrokeMove);
    pathEl.addEventListener("click", () => handleItemClick(strokeObj.id, "stroke"));
  }

  // --- 9. TEXT HIGHLIGHTING ---
  function applySelectionHighlight() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const common = range.commonAncestorContainer;
    const commonEl = common && (common.nodeType === 1 ? common : common.parentElement);
    if (
      commonEl &&
      typeof commonEl.closest === "function" &&
      commonEl.closest("#annotation-layer-container, .edit-annotation-bar, .utility-floating-bar, .search-floating-bar, .shortcut-customizer-bar, .top-nav, .rail-navigator, #doubt-solver-tile")
    ) {
      return;
    }
    const selectedText = sel.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    const id = `hl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const color = annotationState.activeColor;
    const hlStyle = annotationState.highlightStyle || "soft";

    try {
      const mark = document.createElement("mark");
      mark.className = "user-annotation-highlight";
      mark.setAttribute("data-id", id);
      applyHighlightVisualStyle(mark, color, hlStyle);
      range.surroundContents(mark);

      const markY = mark.offsetTop || (mark.getBoundingClientRect().top + window.scrollY);
      annotationRedoStack.length = 0;
      annotationsData.highlights.push({
        id,
        text: selectedText,
        color,
        style: hlStyle,
        y: Math.round(markY)
      });
      mark.addEventListener("click", (e) => {
        if (annotationState.activeTool === "eraser" && canEraseType("highlight")) {
          e.stopPropagation();
          deleteAnnotationItem(id, "highlight");
        }
      });
      saveAnnotations();
      updateAnnotationCounter();
      sel.removeAllRanges();
      if (selectionTooltip) selectionTooltip.style.display = "none";
    } catch (e) {
      console.warn("Selection crossed nodes, highlighting through text match", e);
      sel.removeAllRanges();
      if (selectionTooltip) selectionTooltip.style.display = "none";
    }
  }

  // Quick highlight tooltip on text selection
  document.addEventListener("selectionchange", () => {
    if (!annotationState.isOpen || !selectionTooltip) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      selectionTooltip.style.display = "none";
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      selectionTooltip.style.left = `${rect.left + rect.width / 2}px`;
      selectionTooltip.style.top = `${rect.top + window.scrollY}px`;
      selectionTooltip.style.display = "flex";
    }
  });

  if (btnQuickHighlight) {
    btnQuickHighlight.addEventListener("click", (e) => {
      e.preventDefault();
      applySelectionHighlight();
    });
  }

  document.addEventListener("mouseup", (e) => {
    if (!annotationState.isOpen) return;
    if (annotationState.activeTool === "highlight") {
      if (isInsideNavigationPanels(e)) return;
      const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
      if (targetEl && typeof targetEl.closest === "function" && targetEl.closest("#selection-highlight-tooltip")) return;
      applySelectionHighlight();
    }
  });

  // --- 10. REHYDRATE ALL SAVED ANNOTATIONS ---
  function restoreSavedHighlight(hlData) {
    if (!hlData || !hlData.text) return;
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
            parent.closest("#annotation-layer-container") ||
            parent.closest(".edit-annotation-bar") ||
            parent.closest(".utility-floating-bar") ||
            parent.closest(".search-floating-bar") ||
            parent.closest(".shortcut-customizer-bar") ||
            parent.closest("#doubt-solver-tile") ||
            parent.closest(".top-nav") ||
            parent.closest(".rail-navigator")
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      const idx = node.nodeValue.indexOf(hlData.text);
      if (idx !== -1) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + hlData.text.length);
        const mark = document.createElement("mark");
        mark.className = "user-annotation-highlight";
        mark.setAttribute("data-id", hlData.id);
        const color = hlData.color || "#FFE066";
        applyHighlightVisualStyle(mark, color, hlData.style || "soft");
        mark.addEventListener("click", () => handleItemClick(hlData.id, "highlight"));
        try {
          range.surroundContents(mark);
          break;
        } catch (e) {
          // ignore if complex node boundary
        }
      }
    }
  }

  function renderSingleStrokeSVG(stroke) {
    if (!annotationSvgCanvas) return null;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "annotation-stroke");
    path.setAttribute("data-id", stroke.id);
    path.setAttribute("d", stroke.d);
    path.setAttribute("stroke", stroke.color || "#FFE066");
    path.setAttribute("stroke-width", stroke.size || 4);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    applyStrokeVisualStyle(path, stroke.size || 4, stroke.style || "solid");
    setupStrokeMoveListener(path, stroke);
    annotationSvgCanvas.appendChild(path);
    return path;
  }

  function renderAllSavedAnnotations() {
    // 1. Strokes
    if (annotationSvgCanvas) {
      annotationSvgCanvas.innerHTML = "";
      annotationsData.strokes.forEach((stroke) => renderSingleStrokeSVG(stroke));
    }

    // 2. Text Boxes, Sticky Notes, and Stickers
    if (annotationHtmlElements) {
      annotationHtmlElements.innerHTML = "";
      annotationsData.textboxes.forEach((tb) => renderTextBoxDOM(tb));
      annotationsData.stickynotes.forEach((sn) => renderStickyNoteDOM(sn));
      (annotationsData.stickers || []).forEach((stk) => renderStickerDOM(stk));
    }

    // 3. Highlights
    annotationsData.highlights.forEach((hl) => restoreSavedHighlight(hl));
  }

  function loadAnnotations() {
    try {
      const raw = localStorage.getItem(ANNOTATION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        annotationsData = {
          version: parsed.version || 1,
          strokes: Array.isArray(parsed.strokes) ? parsed.strokes : [],
          textboxes: Array.isArray(parsed.textboxes) ? parsed.textboxes : [],
          stickynotes: Array.isArray(parsed.stickynotes) ? parsed.stickynotes : [],
          highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
          stickers: Array.isArray(parsed.stickers) ? parsed.stickers : []
        };
      }
    } catch (e) {
      console.warn("IndexIndia: Could not parse saved annotations", e);
    }
    renderAllSavedAnnotations();
    updateAnnotationCounter();
    const hasAny = (
      (annotationsData.stickynotes && annotationsData.stickynotes.length > 0) ||
      (annotationsData.textboxes && annotationsData.textboxes.length > 0) ||
      (annotationsData.strokes && annotationsData.strokes.length > 0) ||
      (annotationsData.stickers && annotationsData.stickers.length > 0)
    );
    if (hasAny) {
      document.body.classList.add("has-annotations");
    }
    if (typeof triggerCloudAnnotationFetch === "function") {
      triggerCloudAnnotationFetch();
    }
  }

  // --- 11. PREVIOUS / NEXT ANNOTATION NAVIGATION ---
  function getAllAnnotationElements() {
    const list = [];
    if (annotationHtmlElements) {
      annotationHtmlElements.querySelectorAll(".user-annotation-textbox, .user-annotation-stickynote, .user-annotation-sticker").forEach((el) => {
        const top = parseInt(el.style.top, 10) || el.offsetTop;
        list.push({ el, top });
      });
    }
    document.querySelectorAll("mark.user-annotation-highlight").forEach((el) => {
      const top = el.offsetTop || (el.getBoundingClientRect().top + window.scrollY);
      list.push({ el, top });
    });
    if (annotationSvgCanvas) {
      annotationSvgCanvas.querySelectorAll(".annotation-stroke").forEach((el) => {
        const bbox = el.getBBox ? el.getBBox() : { y: 0 };
        list.push({ el, top: bbox.y });
      });
    }
    list.sort((a, b) => a.top - b.top);
    return list.map((item) => item.el);
  }

  function showAnnotationMatch(idx) {
    const elements = getAllAnnotationElements();
    if (elements.length === 0) {
      updateAnnotationCounter();
      return;
    }
    annotationState.currentFocusIdx = (idx + elements.length) % elements.length;
    const target = elements[annotationState.currentFocusIdx];

    elements.forEach((el) => el.classList.remove("annotation-focus-pulse"));
    if (target) {
      target.classList.add("annotation-focus-pulse");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => target.classList.remove("annotation-focus-pulse"), 1600);
    }
    updateAnnotationCounter();
  }

  if (annotationBtnNext) {
    annotationBtnNext.addEventListener("click", () => {
      showAnnotationMatch(annotationState.currentFocusIdx + 1);
    });
  }
  if (annotationBtnPrev) {
    annotationBtnPrev.addEventListener("click", () => {
      showAnnotationMatch(annotationState.currentFocusIdx - 1);
    });
  }

  // Undo & Redo implementations
  function getItemTimestamp(item) {
    if (item.createdAt) return item.createdAt;
    if (item.id) {
      const parts = item.id.split("_");
      if (parts.length >= 2) {
        const ts = parseInt(parts[1], 10);
        if (!isNaN(ts) && ts > 0) return ts;
      }
    }
    return 0;
  }

  function performAnnotationUndo() {
    const allItems = [
      ...annotationsData.strokes.map((s) => ({ ...s, type: "stroke" })),
      ...annotationsData.textboxes.map((tb) => ({ ...tb, type: "textbox" })),
      ...annotationsData.stickynotes.map((sn) => ({ ...sn, type: "stickynote" })),
      ...(annotationsData.stickers || []).map((stk) => ({ ...stk, type: "sticker" })),
      ...annotationsData.highlights.map((hl) => ({ ...hl, type: "highlight" }))
    ];
    if (allItems.length === 0) return;
    allItems.sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
    const latest = allItems[0];
    annotationRedoStack.push(JSON.parse(JSON.stringify(latest)));
    deleteAnnotationItem(latest.id, latest.type);
  }

  function performAnnotationRedo() {
    if (annotationRedoStack.length === 0) return;
    const item = annotationRedoStack.pop();
    if (!item || !item.type) return;

    if (item.type === "stroke") {
      annotationsData.strokes.push(item);
      renderSingleStrokeSVG(item);
    } else if (item.type === "textbox") {
      annotationsData.textboxes.push(item);
      renderTextBoxDOM(item);
    } else if (item.type === "stickynote") {
      annotationsData.stickynotes.push(item);
      renderStickyNoteDOM(item);
    } else if (item.type === "sticker") {
      if (!annotationsData.stickers) annotationsData.stickers = [];
      annotationsData.stickers.push(item);
      renderStickerDOM(item);
    } else if (item.type === "highlight") {
      annotationsData.highlights.push(item);
      restoreSavedHighlight(item);
    }
    document.body.classList.add("has-annotations");
    saveAnnotations();
    updateAnnotationCounter();
  }

  if (annotationBtnUndo) {
    annotationBtnUndo.addEventListener("click", () => {
      performAnnotationUndo();
    });
  }

  if (annotationBtnRedo) {
    annotationBtnRedo.addEventListener("click", () => {
      performAnnotationRedo();
    });
  }

  // Clear all button
  if (annotationBtnClear) {
    annotationBtnClear.addEventListener("click", () => {
      if (confirm("Clear all annotations, sketches, stickers, and notes on this page?")) {
        annotationsData = { version: 1, strokes: [], textboxes: [], stickynotes: [], highlights: [], stickers: [] };
        if (annotationSvgCanvas) annotationSvgCanvas.innerHTML = "";
        if (annotationHtmlElements) annotationHtmlElements.innerHTML = "";
        document.querySelectorAll("mark.user-annotation-highlight").forEach((m) => {
          if (m.parentNode) {
            m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
          }
        });
        document.body.classList.remove("has-annotations");
        saveAnnotations();
        updateAnnotationCounter();
      }
    });
  }

  // --- 12. PALETTE DRAG HANDLER ---
  let isDraggingPalette = false;
  let paletteOffsetX = 0;
  let paletteOffsetY = 0;

  if (paletteDragHandle) {
    paletteDragHandle.addEventListener("pointerdown", (e) => {
      isDraggingPalette = true;
      const rect = editAnnotationBar.getBoundingClientRect();
      paletteOffsetX = e.clientX - rect.left;
      paletteOffsetY = e.clientY - rect.top;
      try { paletteDragHandle.setPointerCapture(e.pointerId); } catch (_) {}
      editAnnotationBar.classList.add("is-dragging-bar");
      editAnnotationBar.style.left = `${rect.left}px`;
      editAnnotationBar.style.top = `${rect.top}px`;
      editAnnotationBar.style.transform = "none";
      e.preventDefault();
    });

    paletteDragHandle.addEventListener("pointermove", (e) => {
      if (!isDraggingPalette) return;
      const newX = Math.max(10, Math.min(window.innerWidth - editAnnotationBar.offsetWidth - 10, e.clientX - paletteOffsetX));
      const newY = Math.max(10, Math.min(window.innerHeight - editAnnotationBar.offsetHeight - 10, e.clientY - paletteOffsetY));
      editAnnotationBar.style.left = `${newX}px`;
      editAnnotationBar.style.top = `${newY}px`;
      if (stickerPopover.classList.contains("is-open")) {
        stickerPopover.style.left = `${newX + editAnnotationBar.offsetWidth / 2}px`;
        stickerPopover.style.top = `${newY + 48}px`;
      }
    });

    const stopPaletteDrag = () => {
      isDraggingPalette = false;
      editAnnotationBar.classList.remove("is-dragging-bar");
    };
    paletteDragHandle.addEventListener("pointerup", stopPaletteDrag);
    paletteDragHandle.addEventListener("pointercancel", stopPaletteDrag);
  }

  // --- 13. TOOL / COLOR / SIZE BUTTON EVENT BINDINGS ---
  function setAnnotationTool(tool, { suppressPopover = false } = {}) {
    annotationState.activeTool = tool;
    editAnnotationBar.querySelectorAll(".palette-tool-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-tool") === tool);
    });
    document.body.classList.toggle("annotation-mode-sketch", tool === "sketch");
    document.body.classList.toggle("annotation-mode-eraser", tool === "eraser");
    document.body.classList.toggle("annotation-mode-select", tool === "select");
    document.body.classList.toggle("annotation-mode-pan", tool === "pan");
    if (annotationSvgCanvas) {
      annotationSvgCanvas.classList.toggle("is-drawing", tool === "sketch");
    }

    if (tool === "sticker" && !suppressPopover) {
      const rect = editAnnotationBar.getBoundingClientRect();
      stickerPopover.style.left = `${rect.left + rect.width / 2}px`;
      stickerPopover.style.top = `${rect.bottom + 8}px`;
      stickerPopover.classList.toggle("is-open");
    } else if (stickerPopover) {
      stickerPopover.classList.remove("is-open");
    }
    syncAllShortcutToolBarsUI();
  }

  editAnnotationBar.querySelectorAll(".palette-tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tool = btn.getAttribute("data-tool");
      setAnnotationTool(tool);
    });
  });

  editAnnotationBar.querySelectorAll(".palette-color-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.getAttribute("data-color");
      annotationState.activeColor = color;
      editAnnotationBar.querySelectorAll(".palette-color-btn").forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-color") === color);
      });
      syncAllShortcutToolBarsUI();
    });
  });

  editAnnotationBar.querySelectorAll(".palette-size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const size = parseInt(btn.getAttribute("data-size"), 10) || 4;
      annotationState.activeSize = size;
      editAnnotationBar.querySelectorAll(".palette-size-btn").forEach((b) => {
        b.classList.toggle("active", parseInt(b.getAttribute("data-size"), 10) === size);
      });
      syncAllShortcutToolBarsUI();
    });
  });

  // --- 14. OPEN / CLOSE PALETTE CONTROLS ---
  function activateAnnotationMode({ fromInteraction = false, tool = null, suppressPopover = false } = {}) {
    annotationState.isOpen = true;
    document.body.classList.add("is-annotating");
    syncAnnotationCanvasDimensions();
    if (tool) {
      setAnnotationTool(tool, { suppressPopover });
    } else if (!fromInteraction || annotationState.activeTool !== "sticker") {
      setAnnotationTool(annotationState.activeTool || "sketch", { suppressPopover });
    }
    updateAnnotationCounter();
    syncAllShortcutToolBarsUI();
  }

  function deactivateAnnotationMode() {
    annotationState.isOpen = false;
    if (annotationState.activeTool === "sticker") {
      annotationState.activeTool = "sketch";
    }
    document.body.classList.remove("is-annotating");
    if (stickerPopover) stickerPopover.classList.remove("is-open");
    document.body.classList.remove("annotation-mode-sketch", "annotation-mode-eraser", "annotation-mode-select", "annotation-mode-pan");
    if (annotationSvgCanvas) annotationSvgCanvas.classList.remove("is-drawing");
    if (selectionTooltip) selectionTooltip.style.display = "none";
    document.querySelectorAll(".user-annotation-stickynote.is-editing").forEach((n) => n.classList.remove("is-editing"));
    document.querySelectorAll(".annotation-selected").forEach((el) => el.classList.remove("annotation-selected"));

    const hasAnyAnnotations = (
      (annotationsData.stickynotes && annotationsData.stickynotes.length > 0) ||
      (annotationsData.textboxes && annotationsData.textboxes.length > 0) ||
      (annotationsData.strokes && annotationsData.strokes.length > 0) ||
      (annotationsData.stickers && annotationsData.stickers.length > 0)
    );
    if (hasAnyAnnotations) {
      document.body.classList.add("has-annotations");
    } else {
      document.body.classList.remove("has-annotations");
      window.scrollTo({ left: 0, behavior: "smooth" });
    }
    syncAnnotationCanvasDimensions();
    syncAllShortcutToolBarsUI();
  }

  openAnnotationPanel = function() {
    openTopFloatingBar("edit");
  };

  closeAnnotationPanel = function() {
    closeTopFloatingBar("edit");
  };

  toggleAnnotationPanel = function() {
    toggleTopFloatingBar("edit");
  };

  isAnnotationPanelActive = function() {
    return Boolean(annotationState.isOpen);
  };

  registerTopFloatingBar({
    id: "edit",
    wrapper: document.getElementById("edit-nav-wrapper"),
    btn: editNavBtn,
    bar: editAnnotationBar,
    closeBtnSelector: "#annotation-btn-close",
    extraHoverSelectors: ["#sticker-popover"],
    onPreview: () => {
      // Hover preview shows toolbar without activating drawing mode
      updateAnnotationCounter();
    },
    onPin: ({ fromInteraction }) => {
      activateAnnotationMode({ fromInteraction });
    },
    onClose: () => {
      deactivateAnnotationMode();
    }
  });

  // Keyboard shortcuts when annotation panel is open (V: select, P: sketch, H: highlight, T: textbox, S: note, K: sticker, X: eraser, G: snap)
  document.addEventListener("keydown", (e) => {
    if (!isAnnotationPanelActive()) return;
    const isEditingInput = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if (isEditingInput) {
      if (e.key === "Backspace" || e.key === "Delete") {
        const currentText = (document.activeElement.value !== undefined ? document.activeElement.value : (document.activeElement.textContent || document.activeElement.innerText || "")).replace(/\n/g, "").trim();
        if (!currentText) {
          const parentBox = document.activeElement.closest(".user-annotation-textbox");
          if (parentBox) {
            e.preventDefault();
            deleteAnnotationItem(parentBox.getAttribute("data-id"), "textbox");
            return;
          }
          const parentNote = document.activeElement.closest(".user-annotation-stickynote");
          if (parentNote) {
            e.preventDefault();
            deleteAnnotationItem(parentNote.getAttribute("data-id"), "stickynote");
            return;
          }
        }
      }
      return;
    }
    const noMod = !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;

    if ((e.code === "KeyV" || e.key?.toLowerCase() === "v") && noMod) {
      e.preventDefault();
      setAnnotationTool("select");
    } else if ((e.code === "KeyP" || e.key?.toLowerCase() === "p") && noMod) {
      e.preventDefault();
      setAnnotationTool("sketch");
    } else if ((e.code === "KeyH" || e.key?.toLowerCase() === "h") && noMod) {
      e.preventDefault();
      setAnnotationTool("highlight");
    } else if ((e.code === "KeyT" || e.key?.toLowerCase() === "t") && noMod) {
      e.preventDefault();
      setAnnotationTool("textbox");
    } else if ((e.code === "KeyS" || e.key?.toLowerCase() === "s") && noMod) {
      e.preventDefault();
      setAnnotationTool("stickynote");
    } else if ((e.code === "KeyK" || e.key?.toLowerCase() === "k") && noMod) {
      e.preventDefault();
      setAnnotationTool("sticker");
    } else if ((e.code === "KeyX" || e.key?.toLowerCase() === "x") && noMod) {
      e.preventDefault();
      setAnnotationTool("eraser");
    } else if ((e.code === "KeyG" || e.key?.toLowerCase() === "g") && noMod) {
      e.preventDefault();
      toggleSnapToGrid();
    } else if ((e.ctrlKey || e.metaKey) && (e.key?.toLowerCase() === "y" || (e.shiftKey && e.key?.toLowerCase() === "z"))) {
      e.preventDefault();
      performAnnotationRedo();
    } else if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      performAnnotationUndo();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      // Delete selected elements
      if (annotationState.selectedElementIds && annotationState.selectedElementIds.size > 0) {
        annotationState.selectedElementIds.forEach((id) => {
          deleteAnnotationItem(id, "textbox");
          deleteAnnotationItem(id, "stickynote");
          deleteAnnotationItem(id, "sticker");
          deleteAnnotationItem(id, "stroke");
        });
        annotationState.selectedElementIds.clear();
      }
      const selectedEls = document.querySelectorAll(".user-annotation-textbox.is-selected, .user-annotation-stickynote.is-selected, .user-annotation-sticker.is-selected");
      selectedEls.forEach((selEl) => {
        const id = selEl.getAttribute("data-id");
        if (id) {
          if (selEl.classList.contains("user-annotation-textbox")) deleteAnnotationItem(id, "textbox");
          if (selEl.classList.contains("user-annotation-stickynote")) deleteAnnotationItem(id, "stickynote");
          if (selEl.classList.contains("user-annotation-sticker")) deleteAnnotationItem(id, "sticker");
        }
      });
    }
  });

  // Line segment distance helper for exact stroke hit-testing
  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function isPointOnStroke(px, py, stroke) {
    if (!stroke.points || stroke.points.length === 0) return false;
    const strokeTolerance = Math.max((Number(stroke.size) || 4) / 2 + 3.5, 4.5);
    const pts = stroke.points;
    if (pts.length === 1) {
      return Math.hypot(pts[0].x - px, pts[0].y - py) <= strokeTolerance;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      if (distToSegment(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <= strokeTolerance) {
        return true;
      }
    }
    return false;
  }

  // Global Eraser Action (Click or Drag over exact stroke line, highlight, box, note, or sticker)
  function handleEraserAction(e) {
    if (!annotationState.isOpen || annotationState.activeTool !== "eraser") return;
    const target = e.target;
    if (target && typeof target.closest === "function") {
      const stroke = target.closest(".annotation-stroke");
      if (stroke && canEraseType("stroke")) {
        deleteAnnotationItem(stroke.getAttribute("data-id"), "stroke");
        return;
      }
      const tb = target.closest(".user-annotation-textbox");
      if (tb && canEraseType("textbox")) {
        deleteAnnotationItem(tb.getAttribute("data-id"), "textbox");
        return;
      }
      const sn = target.closest(".user-annotation-stickynote");
      if (sn && canEraseType("stickynote")) {
        deleteAnnotationItem(sn.getAttribute("data-id"), "stickynote");
        return;
      }
      const stk = target.closest(".user-annotation-sticker");
      if (stk && canEraseType("sticker")) {
        deleteAnnotationItem(stk.getAttribute("data-id"), "sticker");
        return;
      }
      const hl = target.closest("mark.user-annotation-highlight");
      if (hl && canEraseType("highlight")) {
        deleteAnnotationItem(hl.getAttribute("data-id"), "highlight");
        return;
      }
    }

    if (typeof document.elementsFromPoint === "function") {
      const els = document.elementsFromPoint(e.clientX, e.clientY) || [];
      for (const el of els) {
        if (!el || typeof el.closest !== "function") continue;
        const hl = el.closest("mark.user-annotation-highlight");
        if (hl && canEraseType("highlight")) {
          deleteAnnotationItem(hl.getAttribute("data-id"), "highlight");
          return;
        }
        const tb = el.closest(".user-annotation-textbox");
        if (tb && canEraseType("textbox")) {
          deleteAnnotationItem(tb.getAttribute("data-id"), "textbox");
          return;
        }
        const sn = el.closest(".user-annotation-stickynote");
        if (sn && canEraseType("stickynote")) {
          deleteAnnotationItem(sn.getAttribute("data-id"), "stickynote");
          return;
        }
        const stk = el.closest(".user-annotation-sticker");
        if (stk && canEraseType("sticker")) {
          deleteAnnotationItem(stk.getAttribute("data-id"), "sticker");
          return;
        }
      }
    }

    // Precise hit-testing on SVG strokes (exact stroke line only, not surroundings)
    if (canEraseType("stroke")) {
      const x = e.pageX;
      const y = e.pageY;
      if (annotationsData.strokes && annotationsData.strokes.length > 0) {
        for (const stroke of annotationsData.strokes) {
          if (isPointOnStroke(x, y, stroke)) {
            deleteAnnotationItem(stroke.id, "stroke");
            return;
          }
        }
      }
    }
  }

  document.addEventListener("pointerdown", (e) => {
    if (annotationState.isOpen && annotationState.activeTool === "eraser") {
      if (isInsideNavigationPanels(e) || e.target.closest(".edit-annotation-bar")) return;
      handleEraserAction(e);
    }
  });

  document.addEventListener("pointermove", (e) => {
    if (annotationState.isOpen && annotationState.activeTool === "eraser" && e.buttons > 0) {
      if (isInsideNavigationPanels(e) || e.target.closest(".edit-annotation-bar")) return;
      handleEraserAction(e);
    }
  });

  // ==========================================================================
  // PERMANENT SECTION ACTIONS CLUSTER (Black Dot & Gemini Icon on right-top side)
  // ==========================================================================
  function initSectionActionsCluster() {
    const pageId = getForumPageId();
    const storageKey = `indexindia_section_audit_${pageId}`;
    let auditData = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) auditData = JSON.parse(raw);
    } catch (e) {}

    // Find all sections on the page, excluding comment box & forum containers and overview header
    const sections = Array.from(document.querySelectorAll(
      ".doc-section, .doc-subsection, .doc-subsubsection, .story-node-section, .page-directory-section, .content-area > section"
    )).filter((sec) => {
      if (sec.id === "forum-section" || sec.id === "sec-curriculum-overview" || sec.closest("#forum-section, .institutional-forum-section, .forum-directory-section, .compact-forum-composer, .forum-messages-container")) {
        return false;
      }
      return true;
    });

    sections.forEach((section, idx) => {
      const sectionId = section.id || `section_${idx}`;
      let state = auditData[sectionId] || { read: false, important: false };

      // Remove any obsolete legacy elements if present
      const oldDoubtBtn = section.querySelector(".section-doubt-btn");
      if (oldDoubtBtn) oldDoubtBtn.remove();
      const oldAuditWrap = section.querySelector(".section-audit-badge-wrap");
      if (oldAuditWrap) oldAuditWrap.remove();

      let cluster = section.querySelector(".section-action-cluster");
      if (!cluster) {
        cluster = document.createElement("div");
        cluster.className = "section-action-cluster";
        cluster.setAttribute("data-section-id", sectionId);

        // 1. Permanent Status Dot Button
        const dotBtn = document.createElement("button");
        dotBtn.type = "button";
        dotBtn.className = "section-status-dot-btn";
        dotBtn.setAttribute("aria-label", "Toggle section status: Read / Important");

        const dotGlyph = document.createElement("span");
        dotGlyph.className = "status-dot-glyph";

        const dotTip = document.createElement("span");
        dotTip.className = "section-bracket-tip font-mono";

        dotBtn.appendChild(dotGlyph);
        dotBtn.appendChild(dotTip);

        // 2. Permanent Gemini Icon Button
        const geminiBtn = document.createElement("button");
        geminiBtn.type = "button";
        geminiBtn.className = "section-gemini-btn";
        geminiBtn.setAttribute("aria-label", "Ask Gemini AI Doubt about this section");
        geminiBtn.innerHTML = `
          <svg class="gemini-sparkle-svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>
          </svg>
          <span class="section-bracket-tip font-mono">[Ask Doubt]</span>
        `;

        // 3. Permanent Notepad Button ("A" glyph)
        const notepadBtn = document.createElement("button");
        notepadBtn.type = "button";
        notepadBtn.className = "section-notepad-btn";
        notepadBtn.setAttribute("aria-label", "Add Section Note");
        notepadBtn.innerHTML = `
          <span class="notepad-glyph-a font-mono">A</span>
          <span class="section-bracket-tip font-mono">[NOTEPAD]</span>
        `;

        // 4. Permanent Section Forum Discussion Button (Reddit-style comments)
        const forumBtn = document.createElement("button");
        forumBtn.type = "button";
        forumBtn.className = "section-forum-btn";
        forumBtn.setAttribute("aria-label", "Open Section Discussion Forum");
        forumBtn.innerHTML = `
          <svg class="forum-bubble-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="section-forum-count-badge font-mono" style="display:none;"></span>
          <span class="section-bracket-tip font-mono">[DISCUSS]</span>
        `;

        cluster.appendChild(dotBtn);
        cluster.appendChild(geminiBtn);
        cluster.appendChild(notepadBtn);
        cluster.appendChild(forumBtn);
        section.appendChild(cluster);

        // Dot Click: Cycles Unmarked (Black) -> Read (Green) -> Important (Orange) -> Both (Read-Important) -> Unmarked
        dotBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (!state.read && !state.important) {
            state.read = true;
            state.important = false;
          } else if (state.read && !state.important) {
            state.read = false;
            state.important = true;
          } else if (!state.read && state.important) {
            state.read = true;
            state.important = true;
          } else {
            state.read = false;
            state.important = false;
          }

          auditData[sectionId] = state;
          try {
            localStorage.setItem(storageKey, JSON.stringify(auditData));
          } catch (err) {}

          updateClusterView();
        });

        // Gemini Click: Immediately opens AI Doubt Solver with section context
        geminiBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          openDoubtSolverForSection(section);
        });

        // Notepad Click: Adds a section user note tab matching Chapter 1 tab style
        notepadBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          addSectionUserNote(sectionId, section);
        });

        // Forum Click: Toggles the section discussion forum area
        forumBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleSectionForum(sectionId, section, forumBtn);
        });

        // Initialize forum count badge
        updateSectionForumCountBadge(sectionId, forumBtn);
      }

      function updateClusterView() {
        const dotBtn = cluster.querySelector(".section-status-dot-btn");
        const dotTip = cluster.querySelector(".section-status-dot-btn .section-bracket-tip");
        if (!dotBtn || !dotTip) return;

        const isRead = Boolean(state.read);
        const isImp = Boolean(state.important);

        let statusClass = "status-none";
        let tipText = "[Unmarked]";

        if (isRead && isImp) {
          statusClass = "status-both";
          tipText = "[Read & Important]";
        } else if (isImp) {
          statusClass = "status-important";
          tipText = "[Important]";
        } else if (isRead) {
          statusClass = "status-read";
          tipText = "[Read]";
        } else {
          statusClass = "status-none";
          tipText = "[Unmarked]";
        }

        dotBtn.className = `section-status-dot-btn ${statusClass}`;
        dotTip.textContent = tipText;

        syncDirectoryTreeDot(sectionId, statusClass, tipText);
      }

      updateClusterView();
    });

    syncAllDirectoryTreeDots(auditData);
    loadAllSectionUserNotes();
  }

  // ==========================================================================
  // SECTION CUSTOM USER NOTES (Tab style matching Chapter 1 / Chapter 2 entity tabs)
  // ==========================================================================
  const SECTION_NOTES_STORAGE_KEY = "indexindia_section_notes";

  function getStoredSectionNotes() {
    try {
      const raw = localStorage.getItem(SECTION_NOTES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {};
  }

  function saveStoredSectionNotes(notesMap) {
    try {
      localStorage.setItem(SECTION_NOTES_STORAGE_KEY, JSON.stringify(notesMap));
    } catch (_) {}
  }

  function getSectionNotesGrid(section) {
    let grid = section.querySelector(".entity-cards-grid");
    if (!grid) {
      grid = section.querySelector(".user-notes-grid");
    }
    if (!grid) {
      grid = document.createElement("div");
      grid.className = "entity-cards-grid user-notes-grid";
      const tableWrap = section.querySelector(".table-wrapper");
      if (tableWrap && tableWrap.nextSibling) {
        section.insertBefore(grid, tableWrap.nextSibling);
      } else {
        section.appendChild(grid);
      }
    }
    return grid;
  }

  function renderSingleNoteCard(sectionId, section, note, shouldFocus = false) {
    const grid = getSectionNotesGrid(section);
    const existing = grid.querySelector(`[data-note-id="${note.id}"]`);
    if (existing) existing.remove();

    const noteCard = document.createElement("div");
    noteCard.className = "entity-item user-section-note-tab";
    noteCard.setAttribute("data-note-id", note.id);

    noteCard.innerHTML = `
      <div class="user-note-header">
        <div class="user-note-title-wrap">
          <input type="text" class="entity-name user-note-title-input font-mono" value="${(note.title || "").replace(/"/g, '&quot;')}" placeholder="Section Note Title..." spellcheck="false" />
        </div>
        <div class="user-note-actions">
          <button type="button" class="user-note-delete-btn" aria-label="Delete note" data-hover-tag="[DELETE NOTE]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <textarea class="user-note-textarea font-mono" placeholder="Write personal statutory notes, action items, or remarks here..." rows="3">${(note.text || "").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
    `;

    const titleInput = noteCard.querySelector(".user-note-title-input");
    const textarea = noteCard.querySelector(".user-note-textarea");
    const delBtn = noteCard.querySelector(".user-note-delete-btn");

    function persistNote() {
      const allNotes = getStoredSectionNotes();
      if (!allNotes[sectionId]) allNotes[sectionId] = [];
      const item = allNotes[sectionId].find(n => n.id === note.id);
      if (item) {
        item.title = titleInput.value;
        item.text = textarea.value;
        item.timestamp = Date.now();
      } else {
        allNotes[sectionId].push({
          id: note.id,
          title: titleInput.value,
          text: textarea.value,
          timestamp: Date.now()
        });
      }
      saveStoredSectionNotes(allNotes);
    }

    titleInput.addEventListener("input", persistNote);
    textarea.addEventListener("input", persistNote);

    delBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      noteCard.remove();
      const allNotes = getStoredSectionNotes();
      if (allNotes[sectionId]) {
        allNotes[sectionId] = allNotes[sectionId].filter(n => n.id !== note.id);
        if (allNotes[sectionId].length === 0) delete allNotes[sectionId];
        saveStoredSectionNotes(allNotes);
      }
      if (grid.classList.contains("user-notes-grid") && grid.children.length === 0) {
        grid.remove();
      }
    });

    grid.appendChild(noteCard);

    if (shouldFocus) {
      noteCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(() => {
        titleInput.focus();
        titleInput.select();
      }, 60);
    }
  }

  function addSectionUserNote(sectionId, section) {
    const newNote = {
      id: "note_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      title: "My Section Note",
      text: "",
      timestamp: Date.now()
    };

    const allNotes = getStoredSectionNotes();
    if (!allNotes[sectionId]) allNotes[sectionId] = [];
    allNotes[sectionId].push(newNote);
    saveStoredSectionNotes(allNotes);

    renderSingleNoteCard(sectionId, section, newNote, true);
  }

  
  // ==========================================================================
  // SECTION FORUM & DISCUSSION ENGINE (Reddit-style threads per module)
  // ==========================================================================
  function getSectionForumStorageKey(sectionId) {
    const pageId = getForumPageId();
    return `indexindia_section_forum_${pageId}_${sectionId}`;
  }

  function getLocalSectionForumMessages(sectionId) {
    try {
      const key = getSectionForumStorageKey(sectionId);
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (_) {
      return [];
    }
  }

  function saveLocalSectionForumMessage(sectionId, username, message, createdAtISO, parentId = null) {
    try {
      const key = getSectionForumStorageKey(sectionId);
      const list = getLocalSectionForumMessages(sectionId);
      const newEntry = {
        id: `sec_local_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        section_id: sectionId,
        username: username,
        message: message,
        parent_id: parentId,
        created_at: createdAtISO
      };
      list.push(newEntry);
      localStorage.setItem(key, JSON.stringify(list.slice(-150)));
      return newEntry;
    } catch (_) {
      return null;
    }
  }

  async function fetchSectionForumMessages(sectionId) {
    const isSupabaseLive = Boolean(
      SUPABASE_CONFIG.url &&
      SUPABASE_CONFIG.anonKey &&
      !SUPABASE_CONFIG.url.includes("YOUR_") &&
      SUPABASE_CONFIG.url.startsWith("https://")
    );

    const localMessages = getLocalSectionForumMessages(sectionId);

    if (!isSupabaseLive) {
      return localMessages;
    }

    try {
      const pageId = getForumPageId();
      const base = getSupabaseBaseUrl();
      const cutoffMs = Date.now() - (SUPABASE_CONFIG.retentionDays * 86400 * 1000);
      const cutoffISO = new Date(cutoffMs).toISOString();
      const endpoint = `${base}/rest/v1/${SUPABASE_CONFIG.tableName}?page_id=eq.${encodeURIComponent(pageId)}&section_id=eq.${encodeURIComponent(sectionId)}&created_at=gte.${cutoffISO}&order=created_at.asc&limit=150`;
      
      const res = await fetch(endpoint, {
        headers: {
          "apikey": SUPABASE_CONFIG.anonKey,
          "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });

      if (res.ok) {
        const cloudMessages = await res.json();
        // Merge cloud messages with any local pending entries
        const seenIds = new Set(cloudMessages.map(m => String(m.id)));
        const pendingLocal = localMessages.filter(m => !seenIds.has(String(m.id)));
        return [...cloudMessages, ...pendingLocal];
      }
    } catch (e) {
      console.warn("[SectionForum] Supabase fetch error, fallback to local:", e);
    }
    return localMessages;
  }

  async function broadcastSectionForumMessage(sectionId, rawText, parentId = null) {
    const text = (rawText || "").trim();
    if (!text) return false;

    const pageId = getForumPageId();
    const username = getISTUsername();
    const nowISO = new Date().toISOString();
    const finalMessage = parentId ? `[re:${parentId}] ${text}` : text;

    // Always cache locally first for instantaneous rendering
    saveLocalSectionForumMessage(sectionId, username, finalMessage, nowISO, parentId);

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
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "apikey": SUPABASE_CONFIG.anonKey,
            "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            page_id: pageId,
            section_id: sectionId,
            username: username,
            message: finalMessage,
            created_at: nowISO
          })
        });
      } catch (err) {
        console.warn("[SectionForum] Supabase broadcast network warning:", err);
      }
    }

    return true;
  }

  function updateSectionForumCountBadge(sectionId, forumBtn) {
    if (!forumBtn) return;
    const badge = forumBtn.querySelector(".section-forum-count-badge");
    if (!badge) return;
    const msgs = getLocalSectionForumMessages(sectionId);
    if (msgs && msgs.length > 0) {
      badge.textContent = msgs.length > 99 ? "99+" : msgs.length;
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }
  }

  function renderSectionCommentTreeHtml(node, sectionId, isLastChild) {
    const safeAuthor = escapeForumHtml(node.username || "ANON_IST");
    const safeContent = escapeForumHtml(node.text || "");
    const branchSymbol = isLastChild ? "└──" : "├──";
    const canReply = node.depth < 2;

    const replyButtonHtml = canReply
      ? `<button type="button" class="sec-tree-reply-trigger font-mono" data-id="${node.id}" data-author="${safeAuthor}" data-section="${sectionId}">[reply]</button>`
      : "";

    let childrenHtml = "";
    if (node.children && node.children.length > 0) {
      const childCount = node.children.length;
      const childItemsHtml = node.children.map((child, idx) => {
        return renderSectionCommentTreeHtml(child, sectionId, idx === childCount - 1);
      }).join("");
      childrenHtml = `<div class="sec-tree-children">${childItemsHtml}</div>`;
    }

    return `
      <div class="sec-tree-node-item" data-id="${node.id}" data-depth="${node.depth}">
        <div class="sec-tree-node-row">
          <span class="sec-tree-branch font-mono">${branchSymbol}</span>
          <span class="sec-tree-author font-mono">${safeAuthor}<span class="sec-tree-colon">:</span></span>
          <span class="sec-tree-text">${safeContent}</span>
          ${replyButtonHtml}
        </div>
        <div class="sec-tree-reply-slot" id="sec-reply-slot-${sectionId}-${node.id}"></div>
        ${childrenHtml}
      </div>
    `;
  }

  async function renderSectionForumDrawer(sectionId, drawer) {
    const feed = drawer.querySelector(".section-forum-feed");
    if (!feed) return;

    const messages = await fetchSectionForumMessages(sectionId);

    // If no comments, keep feed clean & empty (zero bloat, only composer visible)
    if (!messages || messages.length === 0) {
      feed.innerHTML = "";
      feed.style.display = "none";
      return;
    }

    feed.style.display = "flex";
    const roots = buildCommentTree(messages);
    const totalRoots = roots.length;
    const html = `
      <div class="sec-tree-forum-feed">
        ${roots.map((rootNode, idx) => renderSectionCommentTreeHtml(rootNode, sectionId, idx === totalRoots - 1)).join("")}
      </div>
    `;
    feed.innerHTML = html;
  }

  function toggleSectionForum(sectionId, section, forumBtn) {
    let drawer = section.querySelector(".section-forum-drawer");

    if (drawer) {
      if (drawer.style.display === "none") {
        drawer.style.display = "block";
        forumBtn.classList.add("active");
        renderSectionForumDrawer(sectionId, drawer);
        const input = drawer.querySelector(".section-forum-input");
        if (input) input.focus();
      } else {
        drawer.style.display = "none";
        forumBtn.classList.remove("active");
      }
      return;
    }

    // Create minimal, zero-bloat drawer if not yet created
    drawer = document.createElement("div");
    drawer.className = "section-forum-drawer font-mono";
    drawer.setAttribute("data-section-id", sectionId);

    drawer.innerHTML = `
      <div class="section-forum-feed" id="sec-feed-${sectionId}" style="display:none;"></div>

      <!-- Ultra-Clean Minimal Section Forum Composer -->
      <form class="section-forum-composer" autocomplete="off">
        <div class="section-forum-composer-row">
          <input type="text" class="section-forum-input font-mono" maxlength="300" placeholder="Type comment... (Enter to send)" />
          <button type="submit" class="section-forum-send-btn font-mono">SEND</button>
        </div>
      </form>
    `;

    // Insert drawer right after cards grid or as last element of section
    const grid = section.querySelector(".entity-cards-grid, .user-notes-grid") || section.lastElementChild;
    if (grid && grid.parentElement === section) {
      grid.insertAdjacentElement("afterend", drawer);
    } else {
      section.appendChild(drawer);
    }

    forumBtn.classList.add("active");
    renderSectionForumDrawer(sectionId, drawer);

    // Close button
    const closeBtn = drawer.querySelector(".section-forum-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        drawer.style.display = "none";
        forumBtn.classList.remove("active");
      });
    }

    // Refresh button
    const refreshBtn = drawer.querySelector(".section-forum-refresh-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", (e) => {
        e.preventDefault();
        renderSectionForumDrawer(sectionId, drawer);
      });
    }

    // Form submit
    const form = drawer.querySelector(".section-forum-composer");
    const input = drawer.querySelector(".section-forum-input");
    const sendBtn = drawer.querySelector(".section-forum-send-btn");

    async function handleSecSubmit() {
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "SENDING...";
      }
      try {
        await broadcastSectionForumMessage(sectionId, text);
        input.value = "";
        await renderSectionForumDrawer(sectionId, drawer);
        updateSectionForumCountBadge(sectionId, forumBtn);
      } finally {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = "SEND";
        }
      }
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        handleSecSubmit();
      });
    }

    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSecSubmit();
        }
      });
      setTimeout(() => input.focus(), 80);
    }

    // Inline replies within this section drawer
    drawer.addEventListener("click", (e) => {
      const replyBtn = e.target.closest(".sec-tree-reply-trigger");
      if (!replyBtn) return;
      e.preventDefault();
      const parentId = replyBtn.getAttribute("data-id");
      const replySlot = drawer.querySelector(`#sec-reply-slot-${sectionId}-${parentId}`);
      if (!replySlot) return;

      if (replySlot.hasChildNodes()) {
        replySlot.innerHTML = "";
        return;
      }

      replySlot.innerHTML = `
        <div class="sec-inline-reply-box font-mono">
          <span class="sec-tree-branch">└──</span>
          <input type="text" class="sec-inline-reply-input font-mono" maxlength="300" placeholder="Reply to comment... (Enter to submit)" />
          <button type="button" class="sec-inline-reply-send font-mono">REPLY</button>
          <button type="button" class="sec-inline-reply-cancel font-mono">✕</button>
        </div>
      `;

      const rInput = replySlot.querySelector(".sec-inline-reply-input");
      const rSend = replySlot.querySelector(".sec-inline-reply-send");
      const rCancel = replySlot.querySelector(".sec-inline-reply-cancel");

      async function submitReply() {
        const rText = rInput.value.trim();
        if (!rText) return;
        rSend.disabled = true;
        rSend.textContent = "...";
        try {
          await broadcastSectionForumMessage(sectionId, rText, parentId);
          replySlot.innerHTML = "";
          await renderSectionForumDrawer(sectionId, drawer);
          updateSectionForumCountBadge(sectionId, forumBtn);
        } finally {
          rSend.disabled = false;
        }
      }

      rSend.addEventListener("click", submitReply);
      rCancel.addEventListener("click", () => { replySlot.innerHTML = ""; });
      rInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          submitReply();
        } else if (ev.key === "Escape") {
          replySlot.innerHTML = "";
        }
      });
      setTimeout(() => rInput.focus(), 40);
    });

    drawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function loadAllSectionUserNotes() {
    const allNotes = getStoredSectionNotes();
    const sections = Array.from(document.querySelectorAll(
      ".doc-section, .doc-subsection, .doc-subsubsection, .story-node-section, .page-directory-section, .content-area > section"
    ));

    sections.forEach((section, idx) => {
      const sectionId = section.id || `section_${idx}`;
      const notesList = allNotes[sectionId];
      if (Array.isArray(notesList) && notesList.length > 0) {
        notesList.forEach((note) => {
          renderSingleNoteCard(sectionId, section, note, false);
        });
      }
    });
  }

  function syncDirectoryTreeDot(sectionId, statusClass, tipText) {
    const treeNode = document.querySelector(`.tree-node[href="#${sectionId}"]`);
    if (!treeNode) return;

    let treeDot = treeNode.querySelector(".tree-status-dot");
    if (!treeDot) {
      treeDot = document.createElement("span");
      treeDot.className = "tree-status-dot";
      treeDot.setAttribute("data-target", sectionId);
      const nameSpan = treeNode.querySelector(".tree-name");
      if (nameSpan && nameSpan.nextSibling) {
        treeNode.insertBefore(treeDot, nameSpan.nextSibling);
      } else {
        treeNode.appendChild(treeDot);
      }

      // Allow clicking the tree dot to cycle section status directly from tree drawer
      treeDot.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const sec = document.getElementById(sectionId);
        if (sec) {
          const dotBtn = sec.querySelector(".section-status-dot-btn");
          if (dotBtn) {
            dotBtn.click();
            return;
          }
        }
      });
    }

    if (statusClass === "status-both") {
      treeDot.className = "tree-status-dot status-both";
      treeDot.title = "[Read & Important]";
    } else if (statusClass === "status-important") {
      treeDot.className = "tree-status-dot status-important";
      treeDot.title = "[Important]";
    } else if (statusClass === "status-read") {
      treeDot.className = "tree-status-dot status-read";
      treeDot.title = "[Read]";
    } else {
      treeDot.className = "tree-status-dot";
      treeDot.title = "[Unmarked - Click to cycle]";
    }
  }

  function syncAllDirectoryTreeDots(auditData) {
    const treeNodes = document.querySelectorAll(".tree-node");
    treeNodes.forEach((node) => {
      const href = node.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const sectionId = href.replace(/^#/, "");
      const state = (auditData && auditData[sectionId]) || null;
      let statusClass = "status-none";
      let tipText = "[Unmarked]";
      if (state) {
        if (state.read && state.important) {
          statusClass = "status-both";
          tipText = "[Read & Important]";
        } else if (state.important) {
          statusClass = "status-important";
          tipText = "[Important]";
        } else if (state.read) {
          statusClass = "status-read";
          tipText = "[Read]";
        }
      }
      syncDirectoryTreeDot(sectionId, statusClass, tipText);
    });
  }

  // Re-sync canvas and load saved notes
  syncAnnotationCanvasDimensions();
  loadAnnotations();
  initSectionActionsCluster();
  window.addEventListener("resize", syncAnnotationCanvasDimensions);
  window.addEventListener("scroll", syncAnnotationCanvasDimensions, { passive: true });

  // ==========================================================================
  // 13. TOP BAR EXPAND / FULL-HEIGHT VIEW CONTROLS
  // ==========================================================================
  const expandNavBtn = document.getElementById("expand-nav-btn");
  let navRestoreFloatBtn = document.getElementById("nav-restore-float-btn");

  if (!navRestoreFloatBtn) {
    navRestoreFloatBtn = document.createElement("button");
    navRestoreFloatBtn.type = "button";
    navRestoreFloatBtn.className = "nav-restore-float-btn";
    navRestoreFloatBtn.id = "nav-restore-float-btn";
    navRestoreFloatBtn.setAttribute("aria-label", "Restore Top Navigation Bar");
    navRestoreFloatBtn.setAttribute("title", "Restore Top Bar ( F )");
    navRestoreFloatBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"></path>
      </svg>
    `;
    document.body.appendChild(navRestoreFloatBtn);
  }

  hideTopBar = function() {
    document.body.classList.add("top-bar-hidden");
    if (expandNavBtn) expandNavBtn.classList.add("is-active");
    hideTopFloatingHoverPreview();
    try {
      localStorage.setItem("indexindia_topbar_hidden", "true");
    } catch (e) {}
    if (typeof syncAnnotationCanvasDimensions === "function") {
      setTimeout(syncAnnotationCanvasDimensions, 260);
    }
  };

  showTopBar = function() {
    document.body.classList.remove("top-bar-hidden");
    if (expandNavBtn) expandNavBtn.classList.remove("is-active");
    try {
      localStorage.setItem("indexindia_topbar_hidden", "false");
    } catch (e) {}
    if (typeof syncAnnotationCanvasDimensions === "function") {
      setTimeout(syncAnnotationCanvasDimensions, 260);
    }
  };

  toggleTopBar = function() {
    if (document.body.classList.contains("top-bar-hidden")) {
      showTopBar();
    } else {
      hideTopBar();
    }
  };

  isTopBarHidden = function() {
    return document.body.classList.contains("top-bar-hidden");
  };

  if (expandNavBtn) {
    expandNavBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTopBar();
    });
  }

  if (navRestoreFloatBtn) {
    navRestoreFloatBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showTopBar();
    });
  }

  // Restore saved state if user preferred hidden top bar
  try {
    if (localStorage.getItem("indexindia_topbar_hidden") === "true") {
      hideTopBar();
    }
  } catch (e) {}

  window.addEventListener("resize", () => {
    if (window.innerWidth <= 1280) {
      if (isTreeCurrentlyOpen() && doubtTile && doubtTile.classList.contains("is-open")) {
        closeDoubtSolver();
      }
    }
  });

  // ==========================================================================
  // 14. UNIVERSAL HOVER TAG TOOLTIP SYSTEM (100% BLACK BG, MONO [TAGS])
  // ==========================================================================
  function initHoverTagSystem() {
    let hoverTagEl = document.getElementById("system-hover-tag");
    if (!hoverTagEl) {
      hoverTagEl = document.createElement("div");
      hoverTagEl.id = "system-hover-tag";
      hoverTagEl.className = "system-hover-tag";
      hoverTagEl.setAttribute("role", "tooltip");
      hoverTagEl.setAttribute("aria-hidden", "true");
      document.body.appendChild(hoverTagEl);
    }

    // Default tag mappings for key top bar elements
    const defaultTagMap = {
      "nav-home-btn": "[HOME]",
      "expand-nav-btn": "[EXPAND]",
      "search-nav-btn": "[SEARCH]",
      "nav-tree-toggle-btn": "[DIRECTORY TREE]",
      "contact-nav-btn": "[CONTACT US]",
      "feedback-nav-btn": "[FEEDBACK]",
      "doubt-nav-btn": "[ASK AI]",
      "edit-nav-btn": "[EDIT]",
      "shortcuts-btn": "[SHORTCUTS]",
      "account-btn": "[ACCOUNT]",
      "settings-btn": "[SETTINGS]",
      "nav-statutory-btn": "[STATUTORY & PRIVACY]",
      "add-shortcut-btn": "[ADD SHORTCUT]",
      "nav-restore-float-btn": "[EXPAND]"
    };

    function sanitizeTitles() {
      // Map standard top buttons if attribute missing
      for (const [id, tag] of Object.entries(defaultTagMap)) {
        const el = document.getElementById(id);
        if (el) {
          if (!el.hasAttribute("data-hover-tag")) {
            el.setAttribute("data-hover-tag", tag);
          }
          el.removeAttribute("title");
        }
      }

      // Strip browser native title from elements that use custom tags or color/size dots
      document.querySelectorAll("[data-hover-tag], .palette-tool-btn, .palette-color-btn, .palette-size-btn, .palette-btn, .palette-close-btn, .finder-btn, .doubt-tile-close, .rail-header-btn.close-btn, #btn-close-tree").forEach((el) => {
        el.removeAttribute("title");
      });
    }

    sanitizeTitles();
    setInterval(sanitizeTitles, 3000);

    let activeAnchor = null;

    function hideTag() {
      hoverTagEl.classList.remove("is-visible", "is-below");
      activeAnchor = null;
    }

    document.addEventListener("pointerover", (e) => {
      const target = e.target instanceof Element ? e.target : e.target?.parentElement;
      if (!target) return;

      // RULE: NO TAG FOR COLOR AND SIZE
      if (
        target.closest(".palette-color-btn") ||
        target.closest(".palette-size-btn") ||
        target.closest(".palette-color-group") ||
        target.closest(".palette-size-group") ||
        target.closest("[data-no-tag='true']")
      ) {
        hideTag();
        return;
      }

      let tagText = "";
      let anchorEl = null;

      // 1. Check for data-hover-tag
      const taggedEl = target.closest("[data-hover-tag]");
      if (taggedEl) {
        tagText = taggedEl.getAttribute("data-hover-tag") || "";
        anchorEl = taggedEl;
      }
      // 2. Directory Tree Section / Chapter / Node Hover
      else {
        const treeNode = target.closest(".tree-node, .tree-chapter-node, .tree-subtopic-node");
        if (treeNode) {
          const titleSpan = treeNode.querySelector(".tree-name");
          let rawTitle = (titleSpan ? titleSpan.textContent : treeNode.textContent) || "";
          rawTitle = rawTitle.replace(/[├└│─\-\|\+]/g, "").replace(/\s+/g, " ").trim();
          if (rawTitle) {
            tagText = `[${rawTitle.toUpperCase()}]`;
            anchorEl = treeNode;
          }
        } else if (target.closest(".tree-section-header")) {
          const headerEl = target.closest(".tree-section-header");
          let rawTitle = headerEl.textContent.trim();
          if (rawTitle) {
            tagText = `[${rawTitle.toUpperCase()}]`;
            anchorEl = headerEl;
          }
        }
      }

      if (!tagText || !anchorEl) {
        hideTag();
        return;
      }

      // Ensure wrapped in square brackets [...]
      tagText = tagText.trim();
      if (!tagText.startsWith("[")) tagText = `[${tagText}`;
      if (!tagText.endsWith("]")) tagText = `${tagText}]`;

      activeAnchor = anchorEl;
      hoverTagEl.textContent = tagText;

      const rect = anchorEl.getBoundingClientRect();
      const isTopNav = !!anchorEl.closest(".top-nav") || rect.top < 65;

      let posX = rect.left + rect.width / 2;
      // Clamp horizontally within screen
      posX = Math.max(70, Math.min(window.innerWidth - 70, posX));

      if (isTopNav) {
        hoverTagEl.classList.add("is-below");
        hoverTagEl.style.left = `${posX}px`;
        hoverTagEl.style.top = `${rect.bottom + 8}px`;
      } else {
        if (rect.top > 40) {
          hoverTagEl.classList.remove("is-below");
          hoverTagEl.style.left = `${posX}px`;
          hoverTagEl.style.top = `${rect.top - 8}px`;
        } else {
          hoverTagEl.classList.add("is-below");
          hoverTagEl.style.left = `${posX}px`;
          hoverTagEl.style.top = `${rect.bottom + 8}px`;
        }
      }

      hoverTagEl.classList.add("is-visible");
    }, { passive: true });

    document.addEventListener("pointerout", (e) => {
      if (!activeAnchor) return;
      const related = e.relatedTarget;
      if (!related || (activeAnchor !== related && !activeAnchor.contains(related))) {
        hideTag();
      }
    }, { passive: true });

    window.addEventListener("scroll", hideTag, { passive: true });
  }

  // ==========================================================================
  // 15. SHORTCUT CUSTOMIZER BAR, PINNING ENGINE & SHORTCUT TOOL FLOATING BARS
  // ==========================================================================
  const SHORTCUT_TOOL_COLOR_PRESETS = [
    { label: "Yellow", hex: "#FFE066" },
    { label: "Orange", hex: "#FF6B35" },
    { label: "Sky Blue", hex: "#38BDF8" },
    { label: "Mint Green", hex: "#34D399" },
    { label: "Rose Red", hex: "#F43F5E" },
    { label: "Violet", hex: "#A855F7" },
    { label: "Ink Black", hex: "#18181B" }
  ];

  const SHORTCUT_STROKE_SIZES = [
    { val: 2, label: "Fine (2px)", short: "Fine 2px", dot: 4 },
    { val: 4, label: "Medium (4px)", short: "Med 4px", dot: 7 },
    { val: 8, label: "Thick (8px)", short: "Thick 8px", dot: 10 },
    { val: 14, label: "Bold (14px)", short: "Bold 14px", dot: 13 }
  ];

  const SHORTCUT_STROKE_STYLES = [
    { val: "solid", label: "Solid Ink" },
    { val: "dashed", label: "Dashed" },
    { val: "marker", label: "Translucent" }
  ];

  const SHORTCUT_HIGHLIGHT_STYLES = [
    { val: "soft", label: "Marker Soft" },
    { val: "vivid", label: "Vivid Strong" },
    { val: "underline", label: "Underline" }
  ];

  const SHORTCUT_TEXT_SIZES = [
    { val: 12, label: "12px Small" },
    { val: 14, label: "14px Medium" },
    { val: 16, label: "16px Large" },
    { val: 20, label: "20px X-Large" }
  ];

  const SHORTCUT_NOTE_SIZES = [
    { val: "180x100", w: 180, h: 100, label: "Compact 180x100", short: "Compact" },
    { val: "240x130", w: 240, h: 130, label: "Standard 240x130", short: "Standard" },
    { val: "320x180", w: 320, h: 180, label: "Large 320x180", short: "Large" }
  ];

  const SHORTCUT_ERASER_TARGETS = [
    { val: "all", label: "All Items" },
    { val: "stroke", label: "Sketches Only" },
    { val: "highlight", label: "Highlights Only" },
    { val: "note", label: "Boxes & Notes" },
    { val: "sticker", label: "Stickers Only" }
  ];

  const SHORTCUT_GRID_SIZES = [
    { val: 16, label: "16px Fine" },
    { val: 24, label: "24px Standard" },
    { val: 36, label: "36px Wide" }
  ];

  const SHORTCUT_STICKER_BADGES = [
    { type: "tag", variant: "danger", label: "⚠️ HIGH RISK" },
    { type: "tag", variant: "success", label: "✅ VERIFIED" },
    { type: "tag", variant: "danger", label: "🚨 RED FLAG" },
    { type: "tag", variant: "info", label: "🔍 AUDIT REQ" },
    { type: "tag", variant: "warning", label: "📌 KEY FINDING" },
    { type: "tag", variant: "purple", label: "⚖️ COMPLIANT" },
    { type: "tag", variant: "teal", label: "💡 INSIGHT" },
    { type: "tag", variant: "warning", label: "🛡️ MOAT" }
  ];

  const SHORTCUT_STICKER_EMOJIS = ["🎯", "📈", "📉", "🚩", "⭐", "🔥", "🏛️", "💰"];

  // Dropdown options for all 21 additional shortcuts
  const SHORTCUT_UNDO_SCOPES = [
    { val: "last", label: "Last Action (Default)" },
    { val: "strokes", label: "All Freehand Sketches" },
    { val: "highlights", label: "All Highlights" },
    { val: "notes", label: "All Notes & Boxes" },
    { val: "stickers", label: "All Stickers" }
  ];

  const SHORTCUT_REDO_SCOPES = [
    { val: "next", label: "Next Action (Default)" },
    { val: "all", label: "Redo All History" }
  ];

  const SHORTCUT_CLEAR_SCOPES = [
    { val: "all", label: "All Annotations" },
    { val: "strokes", label: "Sketches Only" },
    { val: "highlights", label: "Highlights Only" },
    { val: "notes", label: "Notes & Boxes Only" },
    { val: "stickers", label: "Stickers Only" }
  ];

  const SHORTCUT_EXPAND_MODES = [
    { val: "standard", label: "Standard View" },
    { val: "zen", label: "Hide Top Bar (Zen Mode)" },
    { val: "fullscreen", label: "Fullscreen Window (F11)" }
  ];

  const SHORTCUT_TREE_FILTERS = [
    { val: "all", label: "All 18 Chapters" },
    { val: "active", label: "Current Chapter Only" },
    { val: "unread", label: "Unread Sections" },
    { val: "marked", label: "Important Sections" }
  ];

  const SHORTCUT_DOUBT_MODES = [
    { val: "general", label: "Universal AI Assistant" },
    { val: "section", label: "Active Section Doubt" },
    { val: "audit", label: "Compliance & Risk Audit" },
    { val: "penalty", label: "Statutory Penalty Check" }
  ];

  const SHORTCUT_HOME_DESTINATIONS = [
    { val: "top", label: "Document Top (Cover)" },
    { val: "chapter1", label: "Chapter 1 (Overview)" },
    { val: "glossary", label: "Statutory Glossary" },
    { val: "framework", label: "Analytical Framework" }
  ];

  const SHORTCUT_NOTEPAD_TYPES = [
    { val: "general", label: "General Section Note" },
    { val: "risk", label: "⚠️ High Risk Finding" },
    { val: "statutory", label: "⚖️ Statutory Citation" },
    { val: "action", label: "📌 Action Item" }
  ];

  const SHORTCUT_THEME_MODES = [
    { val: "toggle", label: "Toggle Dark / Light" },
    { val: "dark", label: "Dark Terminal Theme" },
    { val: "light", label: "Light Blueprint Theme" }
  ];

  const SHORTCUT_GRID_STYLES = [
    { val: "toggle", label: "Toggle Grid On / Off" },
    { val: "fine", label: "Fine Grid (16px)" },
    { val: "standard", label: "Standard Grid (24px)" },
    { val: "wide", label: "Wide Grid (36px)" }
  ];

  const SHORTCUT_CENTER_ALIGNMENTS = [
    { val: "center", label: "Center Content Column" },
    { val: "active-section", label: "Align Active Section" },
    { val: "top", label: "Align Page Top" }
  ];

  const SHORTCUT_PRINT_LAYOUTS = [
    { val: "clean", label: "Clean Reading View" },
    { val: "annotated", label: "Include My Annotations" },
    { val: "summary", label: "Executive Summary Only" }
  ];

  const SHORTCUT_FONT_SIZES = [
    { val: "small", label: "Small (13px)" },
    { val: "medium", label: "Medium (15px Default)" },
    { val: "large", label: "Large (17.5px)" }
  ];

  const SHORTCUT_FONT_STYLES = [
    { val: "reading", label: "Sans-Serif Standard" },
    { val: "typewriter", label: "Monospace Terminal" }
  ];

  const SHORTCUT_SCROLL_TOP_TARGETS = [
    { val: "top", label: "Absolute Page Top" },
    { val: "title", label: "Chapter Title Heading" },
    { val: "first-section", label: "First Content Section" }
  ];

  const SHORTCUT_SCROLL_BOTTOM_TARGETS = [
    { val: "bottom", label: "Absolute Page Bottom" },
    { val: "forum", label: "Institutional Forum" },
    { val: "terminal-footer", label: "Terminal Colophon" }
  ];

  const SHORTCUT_NEXT_SECTION_MODES = [
    { val: "next", label: "Next Section (Down)" },
    { val: "next-marked", label: "Next Marked / Important" },
    { val: "next-chapter", label: "Next Chapter Title" }
  ];

  const SHORTCUT_PREV_SECTION_MODES = [
    { val: "prev", label: "Previous Section (Up)" },
    { val: "prev-marked", label: "Previous Marked Section" },
    { val: "prev-chapter", label: "Previous Chapter Title" }
  ];

  const SHORTCUT_FORUM_VIEWS = [
    { val: "all", label: "All Institutional Threads" },
    { val: "chapter", label: "Current Chapter Queries" },
    { val: "unresolved", label: "Unresolved Discussions" }
  ];

  const SHORTCUT_COPY_LINK_FORMATS = [
    { val: "section", label: "Direct Section Anchor URL" },
    { val: "page", label: "Standard Page URL" },
    { val: "markdown", label: "Markdown Link Citation" }
  ];

  // All 29 non-native shortcuts have a floating bar with dropdown(s).
  // The 6 native shortcuts (search, edit, shortcuts, contact, account, settings) have their native rich floating panels.
  const SHORTCUT_TOOL_BAR_IDS = new Set([
    "sketch",
    "highlight",
    "textbox",
    "stickynote",
    "sticker",
    "select",
    "eraser",
    "snap",
    "undo",
    "redo",
    "clear",
    "expand",
    "tree",
    "doubt",
    "home",
    "notepad",
    "darkmode",
    "gridbg",
    "centerview",
    "print",
    "font_size_up",
    "font_size_down",
    "font_typewriter",
    "scroll_top",
    "scroll_bottom",
    "next_section",
    "prev_section",
    "forum",
    "copy_link"
  ]);

  const SHORTCUT_NATIVE_PANEL_IDS = new Set([
    "search",
    "edit",
    "shortcuts",
    "contact",
    "account",
    "settings"
  ]);

  function getColorLabel(hex) {
    const norm = String(hex || "#FFE066").toUpperCase();
    const match = SHORTCUT_TOOL_COLOR_PRESETS.find((c) => c.hex.toUpperCase() === norm);
    return match ? match.label : norm;
  }

  function getStoredNoteSizeKey() {
    const w = parseInt(localStorage.getItem("indexindia_stickynote_width") || "240", 10) || 240;
    const h = parseInt(localStorage.getItem("indexindia_stickynote_height") || "130", 10) || 130;
    const match = SHORTCUT_NOTE_SIZES.find((n) => Math.abs(n.w - w) <= 15 && Math.abs(n.h - h) <= 15);
    return match ? match.val : "240x130";
  }

  function recolorSelectedAnnotations(newColor) {
    let changed = false;
    const ids = new Set(annotationState.selectedElementIds ? Array.from(annotationState.selectedElementIds) : []);
    document.querySelectorAll(".user-annotation-textbox.is-selected, .user-annotation-textbox.annotation-selected, .user-annotation-stickynote.is-selected, .user-annotation-stickynote.annotation-selected, .annotation-stroke.annotation-selected").forEach((el) => {
      const id = el.getAttribute("data-id");
      if (id) ids.add(id);
    });
    if (ids.size === 0) return false;

    ids.forEach((id) => {
      const tbObj = (annotationsData.textboxes || []).find((t) => t.id === id);
      if (tbObj) {
        tbObj.color = newColor;
        const el = annotationHtmlElements?.querySelector(`.user-annotation-textbox[data-id="${id}"]`);
        if (el) el.style.setProperty("--box-border-color", newColor);
        changed = true;
      }
      const snObj = (annotationsData.stickynotes || []).find((n) => n.id === id);
      if (snObj) {
        snObj.color = newColor;
        const el = annotationHtmlElements?.querySelector(`.user-annotation-stickynote[data-id="${id}"]`);
        if (el) el.style.setProperty("--note-color", newColor);
        changed = true;
      }
      const stObj = (annotationsData.strokes || []).find((s) => s.id === id);
      if (stObj) {
        stObj.color = newColor;
        const el = annotationSvgCanvas?.querySelector(`.annotation-stroke[data-id="${id}"]`);
        if (el) el.setAttribute("stroke", newColor);
        changed = true;
      }
    });

    if (changed) saveAnnotations();
    return changed;
  }

  function restyleSelectedStrokes(style) {
    let changed = false;
    const ids = new Set(annotationState.selectedElementIds ? Array.from(annotationState.selectedElementIds) : []);
    document.querySelectorAll(".annotation-stroke.annotation-selected").forEach((el) => {
      const id = el.getAttribute("data-id");
      if (id) ids.add(id);
    });
    if (ids.size === 0) return false;

    ids.forEach((id) => {
      const stObj = (annotationsData.strokes || []).find((s) => s.id === id);
      if (stObj) {
        stObj.style = style;
        const el = annotationSvgCanvas?.querySelector(`.annotation-stroke[data-id="${id}"]`);
        if (el) {
          if (style === "dashed") {
            el.setAttribute("stroke-dasharray", "6,6");
            el.setAttribute("opacity", "1");
          } else if (style === "marker") {
            el.removeAttribute("stroke-dasharray");
            el.setAttribute("opacity", "0.45");
          } else {
            el.removeAttribute("stroke-dasharray");
            el.setAttribute("opacity", "1");
          }
        }
        changed = true;
      }
    });

    if (changed) saveAnnotations();
    return changed;
  }

  function resizeSelectedTextBoxes(fontSizePx) {
    let changed = false;
    const ids = new Set(annotationState.selectedElementIds ? Array.from(annotationState.selectedElementIds) : []);
    document.querySelectorAll(".user-annotation-textbox.is-selected, .user-annotation-textbox.annotation-selected").forEach((el) => {
      const id = el.getAttribute("data-id");
      if (id) ids.add(id);
    });
    if (ids.size === 0) return false;

    ids.forEach((id) => {
      const tbObj = (annotationsData.textboxes || []).find((t) => t.id === id);
      if (tbObj) {
        tbObj.fontSize = fontSizePx;
        const el = annotationHtmlElements?.querySelector(`.user-annotation-textbox[data-id="${id}"]`);
        if (el) {
          el.style.fontSize = `${fontSizePx}px`;
          const content = el.querySelector(".textbox-content");
          if (content) content.style.fontSize = `${fontSizePx}px`;
          const ta = el.querySelector(".user-annotation-textbox-input");
          if (ta) ta.style.fontSize = `${fontSizePx}px`;
        }
        changed = true;
      }
    });

    if (changed) saveAnnotations();
    return changed;
  }

  function resizeSelectedStickyNotes(w, h) {
    let changed = false;
    const ids = new Set(annotationState.selectedElementIds ? Array.from(annotationState.selectedElementIds) : []);
    document.querySelectorAll(".user-annotation-stickynote.is-selected, .user-annotation-stickynote.annotation-selected").forEach((el) => {
      const id = el.getAttribute("data-id");
      if (id) ids.add(id);
    });
    if (ids.size === 0) return false;

    ids.forEach((id) => {
      const snObj = (annotationsData.stickynotes || []).find((n) => n.id === id);
      if (snObj) {
        snObj.width = w;
        snObj.height = h;
        const el = annotationHtmlElements?.querySelector(`.user-annotation-stickynote[data-id="${id}"]`);
        if (el) {
          el.style.width = `${w}px`;
          el.style.height = `${h}px`;
        }
        changed = true;
      }
    });

    if (changed) saveAnnotations();
    return changed;
  }

  function deleteCurrentlySelectedAnnotations() {
    const toDelete = [];
    document.querySelectorAll(".user-annotation-textbox.is-selected, .user-annotation-textbox.annotation-selected").forEach((el) => {
      const id = el.getAttribute("data-id");
      if (id) toDelete.push([id, "textbox"]);
    });
    document.querySelectorAll(".user-annotation-stickynote.is-selected, .user-annotation-stickynote.annotation-selected").forEach((el) => {
      const id = el.getAttribute("data-id");
      if (id) toDelete.push([id, "stickynote"]);
    });
    document.querySelectorAll(".user-annotation-sticker.is-selected, .user-annotation-sticker.annotation-selected").forEach((el) => {
      const id = el.getAttribute("data-id");
      if (id) toDelete.push([id, "sticker"]);
    });
    document.querySelectorAll(".annotation-stroke.annotation-selected").forEach((el) => {
      const id = el.getAttribute("data-id");
      if (id) toDelete.push([id, "stroke"]);
    });
    (annotationState.selectedElementIds || []).forEach((id) => {
      const el = document.querySelector(`[data-id="${id}"]`);
      if (!el) return;
      if (el.classList.contains("user-annotation-textbox")) toDelete.push([id, "textbox"]);
      else if (el.classList.contains("user-annotation-stickynote")) toDelete.push([id, "stickynote"]);
      else if (el.classList.contains("user-annotation-sticker")) toDelete.push([id, "sticker"]);
      else if (el.classList.contains("annotation-stroke")) toDelete.push([id, "stroke"]);
    });
    const seen = new Set();
    toDelete.forEach(([id, type]) => {
      const key = `${type}:${id}`;
      if (!seen.has(key)) {
        seen.add(key);
        deleteAnnotationItem(id, type);
      }
    });
  }

  function clearAllPageAnnotations() {
    const clearBtn = document.getElementById("annotation-btn-clear");
    if (clearBtn) {
      clearBtn.click();
    } else if (confirm("Clear all annotations, sketches, stickers, and notes on this page?")) {
      annotationsData = { version: 1, strokes: [], textboxes: [], stickynotes: [], highlights: [], stickers: [] };
      if (annotationSvgCanvas) annotationSvgCanvas.innerHTML = "";
      if (annotationHtmlElements) annotationHtmlElements.innerHTML = "";
      document.querySelectorAll("mark.user-annotation-highlight").forEach((m) => {
        if (m.parentNode) m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
      });
      document.body.classList.remove("has-annotations");
      saveAnnotations();
      updateAnnotationCounter();
    }
  }

  function clearAnnotationsByScope(scope = "all") {
    if (scope === "all") {
      clearAllPageAnnotations();
      return;
    }
    if (scope === "strokes") {
      annotationsData.strokes = [];
      if (annotationSvgCanvas) annotationSvgCanvas.innerHTML = "";
    } else if (scope === "highlights") {
      annotationsData.highlights = [];
      document.querySelectorAll("mark.user-annotation-highlight").forEach((m) => {
        if (m.parentNode) m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
      });
    } else if (scope === "notes") {
      annotationsData.textboxes = [];
      annotationsData.stickynotes = [];
      if (annotationHtmlElements) {
        annotationHtmlElements.querySelectorAll(".user-annotation-textbox, .user-annotation-stickynote").forEach((el) => el.remove());
      }
    } else if (scope === "stickers") {
      annotationsData.stickers = [];
      if (annotationHtmlElements) {
        annotationHtmlElements.querySelectorAll(".user-annotation-sticker").forEach((el) => el.remove());
      }
    }
    const hasAny = (
      (annotationsData.strokes?.length || 0) +
      (annotationsData.highlights?.length || 0) +
      (annotationsData.textboxes?.length || 0) +
      (annotationsData.stickynotes?.length || 0) +
      (annotationsData.stickers?.length || 0)
    ) > 0;
    if (!hasAny) document.body.classList.remove("has-annotations");
    saveAnnotations();
    updateAnnotationCounter();
  }

  function renderShortcutColorDropdownHtml(idPrefix, labelText = "Color") {
    const curHex = annotationState.activeColor || "#FFE066";
    const curLabel = getColorLabel(curHex);
    const itemsHtml = SHORTCUT_TOOL_COLOR_PRESETS.map((c) => `
      <button type="button" class="dropdown-item${c.hex.toUpperCase() === curHex.toUpperCase() ? " active" : ""}" data-sc-type="color" data-val="${c.hex}">
        <span class="shortcut-color-dot" style="background:${c.hex};"></span>
        <span>${c.label}</span>
      </button>
    `).join("");
    return `
      <div class="custom-dropdown-row" data-no-tag="true">
        <span class="custom-dropdown-label">${labelText}</span>
        <div class="custom-dropdown" data-dropdown-kind="color" id="${idPrefix}-dd-color">
          <button type="button" class="dropdown-trigger" aria-expanded="false">
            <span class="shortcut-tool-trigger-value">
              <span class="shortcut-color-dot" data-role="color-dot" style="background:${curHex};"></span>
              <span data-role="color-label">${curLabel}</span>
            </span>
            <svg class="dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="dropdown-menu-list">
            ${itemsHtml}
            <label class="dropdown-item shortcut-custom-color-label" data-no-tag="true">
              <span>Custom</span>
              <input type="color" class="shortcut-custom-color-input" data-sc-type="custom-color" value="${curHex}" aria-label="Custom color" />
            </label>
          </div>
        </div>
      </div>
    `;
  }

  function renderShortcutGenericDropdownHtml(idPrefix, kind, labelText, items, curVal) {
    const activeItem = items.find((it) => String(it.val) === String(curVal)) || items[0];
    const itemsHtml = items.map((it) => {
      const isAct = String(it.val) === String(activeItem.val);
      const dotHtml = it.dot
        ? `<span class="shortcut-size-dot-wrap"><span class="shortcut-size-dot" style="width:${it.dot}px;height:${it.dot}px;"></span></span>`
        : "";
      return `
        <button type="button" class="dropdown-item${isAct ? " active" : ""}" data-sc-type="${kind}" data-val="${it.val}">
          ${dotHtml}<span>${it.label}</span>
        </button>
      `;
    }).join("");
    const activeDotHtml = activeItem.dot
      ? `<span class="shortcut-size-dot-wrap"><span class="shortcut-size-dot" data-role="${kind}-dot" style="width:${activeItem.dot}px;height:${activeItem.dot}px;"></span></span>`
      : "";
    return `
      <div class="custom-dropdown-row" data-no-tag="true">
        <span class="custom-dropdown-label">${labelText}</span>
        <div class="custom-dropdown" data-dropdown-kind="${kind}" id="${idPrefix}-dd-${kind}">
          <button type="button" class="dropdown-trigger" aria-expanded="false">
            <span class="shortcut-tool-trigger-value">
              ${activeDotHtml}<span data-role="${kind}-label">${activeItem.short || activeItem.label}</span>
            </span>
            <svg class="dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="dropdown-menu-list">
            ${itemsHtml}
          </div>
        </div>
      </div>
    `;
  }

  function renderShortcutStickerDropdownHtml(idPrefix) {
    const cur = annotationState.activeSticker || SHORTCUT_STICKER_BADGES[0];
    const curText = cur.type === "emoji" ? `${cur.icon} Stamp` : cur.label;
    const badgesHtml = SHORTCUT_STICKER_BADGES.map((b) => {
      const isAct = cur.type !== "emoji" && cur.label === b.label;
      return `
        <button type="button" class="dropdown-item sticker-dropdown-option${isAct ? " active" : ""}" data-sc-type="sticker-tag" data-variant="${b.variant}" data-label="${b.label}">
          <span class="sticker-badge-btn variant-${b.variant}">${b.label}</span>
        </button>
      `;
    }).join("");
    const emojisHtml = SHORTCUT_STICKER_EMOJIS.map((em) => {
      const isAct = cur.type === "emoji" && cur.icon === em;
      return `<button type="button" class="shortcut-emoji-menu-item${isAct ? " active" : ""}" data-sc-type="sticker-emoji" data-icon="${em}">${em}</button>`;
    }).join("");
    return `
      <div class="custom-dropdown-row" data-no-tag="true">
        <span class="custom-dropdown-label">Stamp</span>
        <div class="custom-dropdown" data-dropdown-kind="sticker" id="${idPrefix}-dd-sticker" style="min-width:136px;">
          <button type="button" class="dropdown-trigger" aria-expanded="false">
            <span class="shortcut-tool-trigger-value">
              <span data-role="sticker-label">${curText}</span>
            </span>
            <svg class="dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="dropdown-menu-list is-sticker-menu">
            <div class="shortcut-menu-section-title">AUDIT BADGES</div>
            ${badgesHtml}
            <div class="shortcut-menu-section-title">RESEARCH STAMPS</div>
            <div class="shortcut-emoji-menu-grid">${emojisHtml}</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderShortcutCommonActionsHtml(opts = {}) {
    const snapPressed = annotationState.snapToGrid;
    return `
      <div class="shortcut-tool-actions">
        ${opts.applyHighlight ? `<button type="button" class="palette-btn" data-action="apply-highlight" data-hover-tag="[APPLY HIGHLIGHT]">Apply</button>` : ""}
        ${opts.deleteSelected ? `<button type="button" class="palette-btn" data-action="delete-selected" data-hover-tag="[DELETE SELECTED]">Del</button>` : ""}
        ${opts.snapBtn ? `
          <button type="button" class="palette-btn ${snapPressed ? "active" : ""}" data-action="toggle-snap" data-hover-tag="[SNAP TO GRID]" aria-pressed="${snapPressed}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
          </button>` : ""}
        ${opts.undoRedo !== false ? `
          <button type="button" class="palette-btn" data-action="undo" data-hover-tag="[UNDO]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </button>
          <button type="button" class="palette-btn" data-action="redo" data-hover-tag="[REDO]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
          </button>` : ""}
        ${opts.clear !== false ? `
          <button type="button" class="palette-btn" data-action="clear" data-hover-tag="[CLEAR]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>` : ""}
        <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
  }

  function wireShortcutToolDropdownInteractions(bar, toolId) {
    const closeHoverSuppressed = (dd, row) => {
      dd.classList.remove("is-open");
      const trig = dd.querySelector(".dropdown-trigger");
      if (trig) trig.setAttribute("aria-expanded", "false");
      dd.classList.add("suppress-hover-menu");
      if (row) row.classList.add("suppress-hover-menu");
    };

    bar.querySelectorAll(".custom-dropdown-row").forEach((row) => {
      const dd = row.querySelector(".custom-dropdown");
      if (!dd) return;
      const trig = dd.querySelector(".dropdown-trigger");
      row.addEventListener("mouseleave", () => {
        dd.classList.remove("suppress-hover-menu");
        row.classList.remove("suppress-hover-menu");
      });
      if (trig) {
        trig.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const wasOpen = dd.classList.contains("is-open");
          bar.querySelectorAll(".custom-dropdown.is-open").forEach((other) => {
            if (other !== dd) {
              other.classList.remove("is-open");
              const t = other.querySelector(".dropdown-trigger");
              if (t) t.setAttribute("aria-expanded", "false");
            }
          });
          if (wasOpen) {
            closeHoverSuppressed(dd, row);
          } else {
            dd.classList.remove("suppress-hover-menu");
            row.classList.remove("suppress-hover-menu");
            dd.classList.add("is-open");
            trig.setAttribute("aria-expanded", "true");
          }
        });
      }
    });

    bar.querySelectorAll("[data-sc-type]").forEach((optEl) => {
      const scType = optEl.getAttribute("data-sc-type");
      const row = optEl.closest(".custom-dropdown-row");
      const dd = optEl.closest(".custom-dropdown");

      if (scType === "custom-color") {
        optEl.addEventListener("input", () => {
          annotationState.activeColor = optEl.value;
          if (toolId === "textbox" || toolId === "stickynote" || toolId === "select") {
            recolorSelectedAnnotations(optEl.value);
          }
          syncAllShortcutToolBarsUI();
        });
        optEl.addEventListener("change", () => {
          annotationState.activeColor = optEl.value;
          if (toolId === "textbox" || toolId === "stickynote" || toolId === "select") {
            recolorSelectedAnnotations(optEl.value);
          }
          if (dd) closeHoverSuppressed(dd, row);
          syncAllShortcutToolBarsUI();
        });
        return;
      }

      optEl.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const val = optEl.getAttribute("data-val");

        if (scType === "color") {
          annotationState.activeColor = val;
          if (toolId === "textbox" || toolId === "stickynote" || toolId === "select") {
            recolorSelectedAnnotations(val);
          }
        } else if (scType === "size") {
          annotationState.activeSize = parseInt(val, 10) || 4;
        } else if (scType === "stroke-style") {
          annotationState.strokeStyle = val || "solid";
          restyleSelectedStrokes(annotationState.strokeStyle);
        } else if (scType === "highlight-style") {
          annotationState.highlightStyle = val || "soft";
        } else if (scType === "textbox-size") {
          const px = parseInt(val, 10) || 14;
          annotationState.textBoxFontSize = px;
          try { localStorage.setItem("indexindia_textbox_font_size", String(px)); } catch (_) {}
          resizeSelectedTextBoxes(px);
        } else if (scType === "note-size") {
          const matched = SHORTCUT_NOTE_SIZES.find((n) => n.val === val) || SHORTCUT_NOTE_SIZES[1];
          try {
            localStorage.setItem("indexindia_stickynote_width", String(matched.w));
            localStorage.setItem("indexindia_stickynote_height", String(matched.h));
          } catch (_) {}
          resizeSelectedStickyNotes(matched.w, matched.h);
        } else if (scType === "eraser-target") {
          annotationState.eraserFilter = val || "all";
        } else if (scType === "grid-size") {
          setGridSizePx(parseInt(val, 10) || 24);
        } else if (scType === "sticker-tag") {
          annotationState.activeSticker = {
            type: "tag",
            variant: optEl.getAttribute("data-variant"),
            label: optEl.getAttribute("data-label")
          };
          if (annotationState.isOpen) setAnnotationTool("sticker", { suppressPopover: true });
        } else if (scType === "sticker-emoji") {
          annotationState.activeSticker = {
            type: "emoji",
            icon: optEl.getAttribute("data-icon")
          };
          if (annotationState.isOpen) setAnnotationTool("sticker", { suppressPopover: true });
        } else if (scType === "undo-scope") {
          bar.setAttribute("data-active-undo-scope", val);
          performAnnotationUndo();
        } else if (scType === "redo-scope") {
          bar.setAttribute("data-active-redo-scope", val);
          if (val === "all") {
            while (annotationRedoStack && annotationRedoStack.length > 0) {
              performAnnotationRedo();
            }
          } else {
            performAnnotationRedo();
          }
        } else if (scType === "clear-scope") {
          bar.setAttribute("data-active-clear-scope", val);
          clearAnnotationsByScope(val);
        } else if (scType === "expand-mode") {
          bar.setAttribute("data-active-expand-mode", val);
          if (val === "zen") {
            toggleTopBar();
          } else if (val === "fullscreen") {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.().catch(() => {});
            } else {
              document.exitFullscreen?.().catch(() => {});
            }
          } else {
            if (document.body.classList.contains("top-bar-hidden")) toggleTopBar();
          }
        } else if (scType === "tree-filter") {
          bar.setAttribute("data-active-tree-filter", val);
          if (typeof toggleTree === "function") toggleTree(true);
        } else if (scType === "doubt-mode") {
          bar.setAttribute("data-active-doubt-mode", val);
          if (typeof openDoubtSolver === "function") openDoubtSolver(null, true);
        } else if (scType === "home-dest") {
          bar.setAttribute("data-active-home-dest", val);
          if (val === "chapter1") {
            const ch1 = document.querySelector("#chapter-1, .chapter-1-section, .doc-chapter");
            if (ch1) ch1.scrollIntoView({ behavior: "smooth", block: "start" });
            else window.location.href = "guide.html";
          } else if (val === "glossary") {
            const gl = document.querySelector("#statutory-glossary, .glossary-section, [data-section*='glossary']");
            if (gl) gl.scrollIntoView({ behavior: "smooth", block: "start" });
            else window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        } else if (scType === "notepad-type") {
          bar.setAttribute("data-active-notepad-type", val);
          const sections = Array.from(document.querySelectorAll(".page-directory-section, .doc-section, .content-area > section"));
          const target = sections.find((s) => {
            const r = s.getBoundingClientRect();
            return r.top >= 0 && r.top <= window.innerHeight * 0.6;
          }) || sections[0];
          if (target && typeof addSectionUserNote === "function") {
            addSectionUserNote(target.id || "sec-active", target);
          }
        } else if (scType === "theme-mode") {
          bar.setAttribute("data-active-theme-mode", val);
          if (val === "dark") {
            if (!document.body.classList.contains("theme-dark")) toggleThemeMode();
          } else if (val === "light") {
            if (document.body.classList.contains("theme-dark")) toggleThemeMode();
          } else {
            toggleThemeMode();
          }
        } else if (scType === "grid-style") {
          bar.setAttribute("data-active-grid-style", val);
          if (val === "fine") {
            setGridSizePx(16);
            if (document.body.classList.contains("no-grid")) toggleBackgroundGrid();
          } else if (val === "standard") {
            setGridSizePx(24);
            if (document.body.classList.contains("no-grid")) toggleBackgroundGrid();
          } else if (val === "wide") {
            setGridSizePx(36);
            if (document.body.classList.contains("no-grid")) toggleBackgroundGrid();
          } else {
            toggleBackgroundGrid();
          }
        } else if (scType === "center-align") {
          bar.setAttribute("data-active-center-align", val);
          if (val === "top") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else if (val === "active-section") {
            const sec = document.querySelector(".page-directory-section.is-active-section, .doc-section.is-active, .tree-node.is-active");
            if (sec) sec.scrollIntoView({ behavior: "smooth", block: "center" });
            else window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            const main = document.querySelector(".guide-main") || document.querySelector("main") || document.documentElement;
            main.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        } else if (scType === "print-layout") {
          bar.setAttribute("data-active-print-layout", val);
          window.print();
        } else if (scType === "font-size") {
          applyFontSize(val);
        } else if (scType === "font-style") {
          applyFontStyle(val);
        } else if (scType === "scroll-top-dest") {
          bar.setAttribute("data-active-scroll-top", val);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (scType === "scroll-bottom-dest") {
          bar.setAttribute("data-active-scroll-bottom", val);
          if (val === "forum") {
            const forum = document.getElementById("forum-section") || document.querySelector(".institutional-forum-section");
            if (forum) forum.scrollIntoView({ behavior: "smooth", block: "start" });
            else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          } else {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          }
        } else if (scType === "next-section-mode") {
          bar.setAttribute("data-active-next-mode", val);
          const headings = Array.from(document.querySelectorAll("h1, h2.story-section-title, h3.story-section-title, .page-directory-section"));
          const next = headings.find((h) => h.getBoundingClientRect().top > 80);
          if (next) next.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (scType === "prev-section-mode") {
          bar.setAttribute("data-active-prev-mode", val);
          const headings = Array.from(document.querySelectorAll("h1, h2.story-section-title, h3.story-section-title, .page-directory-section"));
          const prev = headings.filter((h) => h.getBoundingClientRect().top < -20).pop();
          if (prev) prev.scrollIntoView({ behavior: "smooth", block: "start" });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (scType === "forum-view") {
          bar.setAttribute("data-active-forum-view", val);
          const forum = document.getElementById("forum-section") || document.querySelector(".institutional-forum-section");
          if (forum) forum.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (scType === "copy-link-format") {
          bar.setAttribute("data-active-link-format", val);
          let textToCopy = window.location.href;
          if (val === "markdown") {
            textToCopy = `[${document.title || "IndexIndia"}](${window.location.href})`;
          } else if (val === "page") {
            textToCopy = window.location.origin + window.location.pathname;
          }
          try {
            navigator.clipboard.writeText(textToCopy);
            if (typeof showSystemNotification === "function") {
              showSystemNotification(`Copied link (${val}) to clipboard`);
            }
          } catch (_) {}
        }

        if (dd) closeHoverSuppressed(dd, row);
        syncAllShortcutToolBarsUI();
      });
    });

    const applyHlBtn = bar.querySelector('[data-action="apply-highlight"]');
    if (applyHlBtn) {
      applyHlBtn.addEventListener("mousedown", (e) => e.preventDefault());
      applyHlBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        applySelectionHighlight();
      });
    }

    const delSelBtn = bar.querySelector('[data-action="delete-selected"]');
    if (delSelBtn) {
      delSelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteCurrentlySelectedAnnotations();
      });
    }

    const snapBtn = bar.querySelector('[data-action="toggle-snap"]');
    if (snapBtn) {
      snapBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSnapToGrid();
      });
    }

    const snapChk = bar.querySelector(".shortcut-bar-snap-toggle");
    if (snapChk) {
      snapChk.addEventListener("change", (e) => {
        setSnapToGrid(e.target.checked);
      });
    }

    const gridChk = bar.querySelector(".shortcut-grid-vis-toggle");
    if (gridChk) {
      gridChk.addEventListener("change", (e) => {
        const wantOn = e.target.checked;
        document.body.classList.toggle("no-grid", !wantOn);
        try { localStorage.setItem("indexindia_grid", wantOn ? "on" : "off"); } catch (_) {}
        const mainGridToggle = document.getElementById("grid-toggle");
        if (mainGridToggle) mainGridToggle.checked = wantOn;
        syncAllShortcutToolBarsUI();
      });
    }

    const undoBtn = bar.querySelector('[data-action="undo"]');
    if (undoBtn) {
      undoBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        performAnnotationUndo();
      });
    }

    const redoBtn = bar.querySelector('[data-action="redo"]');
    if (redoBtn) {
      redoBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        performAnnotationRedo();
      });
    }

    const clearBtn = bar.querySelector('[data-action="clear"]');
    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const activeScope = bar.getAttribute("data-active-clear-scope") || "all";
        clearAnnotationsByScope(activeScope);
      });
    }

    // Direct Action Buttons on specific toolbars
    const execCustomAction = (selector, fn) => {
      const btn = bar.querySelector(selector);
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          fn();
          syncAllShortcutToolBarsUI();
        });
      }
    };

    execCustomAction('[data-action="exec-expand"]', () => toggleTopBar());
    execCustomAction('[data-action="exec-tree"]', () => { if (typeof toggleTree === "function") toggleTree(true); });
    execCustomAction('[data-action="exec-doubt"]', () => { if (typeof openDoubtSolver === "function") openDoubtSolver(null, true); });
    execCustomAction('[data-action="exec-home"]', () => { window.scrollTo({ top: 0, behavior: "smooth" }); });
    execCustomAction('[data-action="exec-notepad"]', () => {
      const sections = Array.from(document.querySelectorAll(".page-directory-section, .doc-section, .content-area > section"));
      const target = sections.find((s) => {
        const r = s.getBoundingClientRect();
        return r.top >= 0 && r.top <= window.innerHeight * 0.6;
      }) || sections[0];
      if (target && typeof addSectionUserNote === "function") {
        addSectionUserNote(target.id || "sec-active", target);
      }
    });
    execCustomAction('[data-action="exec-darkmode"]', () => toggleThemeMode());
    execCustomAction('[data-action="exec-gridbg"]', () => toggleBackgroundGrid());
    execCustomAction('[data-action="exec-centerview"]', () => {
      const main = document.querySelector(".guide-main") || document.querySelector("main") || document.documentElement;
      main.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    execCustomAction('[data-action="exec-print"]', () => window.print());
    execCustomAction('[data-action="exec-font-up"]', () => {
      const sizes = ["small", "medium", "large"];
      const cur = sizes.findIndex((s) => document.documentElement.classList.contains(`font-size-${s}`));
      const idx = cur === -1 ? 1 : cur;
      if (idx < sizes.length - 1) applyFontSize(sizes[idx + 1]);
    });
    execCustomAction('[data-action="exec-font-down"]', () => {
      const sizes = ["small", "medium", "large"];
      const cur = sizes.findIndex((s) => document.documentElement.classList.contains(`font-size-${s}`));
      const idx = cur === -1 ? 1 : cur;
      if (idx > 0) applyFontSize(sizes[idx - 1]);
    });
    execCustomAction('[data-action="exec-font-typewriter"]', () => {
      const isType = document.body.classList.contains("font-style-typewriter");
      applyFontStyle(isType ? "reading" : "typewriter");
    });
    execCustomAction('[data-action="exec-scroll-top"]', () => window.scrollTo({ top: 0, behavior: "smooth" }));
    execCustomAction('[data-action="exec-scroll-bottom"]', () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
    execCustomAction('[data-action="exec-next-section"]', () => {
      const headings = Array.from(document.querySelectorAll("h1, h2.story-section-title, h3.story-section-title, .page-directory-section"));
      const next = headings.find((h) => h.getBoundingClientRect().top > 80);
      if (next) next.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    execCustomAction('[data-action="exec-prev-section"]', () => {
      const headings = Array.from(document.querySelectorAll("h1, h2.story-section-title, h3.story-section-title, .page-directory-section"));
      const prev = headings.filter((h) => h.getBoundingClientRect().top < -20).pop();
      if (prev) prev.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
    execCustomAction('[data-action="exec-forum"]', () => {
      const forum = document.getElementById("forum-section") || document.querySelector(".institutional-forum-section");
      if (forum) forum.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    execCustomAction('[data-action="exec-copy-link"]', () => {
      try {
        navigator.clipboard.writeText(window.location.href);
        if (typeof showSystemNotification === "function") showSystemNotification("Copied link to clipboard");
      } catch (_) {}
    });
  }

  function getActiveFontSizeKey() {
    if (document.documentElement.classList.contains("font-size-small")) return "small";
    if (document.documentElement.classList.contains("font-size-large")) return "large";
    return "medium";
  }

  function getActiveFontStyleKey() {
    return document.body.classList.contains("font-style-typewriter") ? "typewriter" : "reading";
  }

  function buildShortcutToolFloatingBar(item) {
    const id = item.id;
    const barId = `shortcut-bar-${id}`;
    const existing = document.getElementById(barId);
    if (existing) existing.remove();

    const bar = document.createElement("div");
    bar.id = barId;
    bar.className = "utility-floating-bar settings-floating-bar shortcut-tool-floating-bar";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", `${item.title} Controls`);
    bar.setAttribute("data-shortcut-tool", id);

    const dragHtml = `
      <span class="palette-drag-handle" data-no-tag="true">
        <svg width="10" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2.5"/><circle cx="8" cy="12" r="2.5"/><circle cx="8" cy="20" r="2.5"/><circle cx="16" cy="4" r="2.5"/><circle cx="16" cy="12" r="2.5"/><circle cx="16" cy="20" r="2.5"/></svg>
      </span>
    `;
    let bodyHtml = "";

    if (id === "sketch") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>SKETCH</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutColorDropdownHtml(barId, "Color")}
        ${renderShortcutGenericDropdownHtml(barId, "size", "Size", SHORTCUT_STROKE_SIZES, annotationState.activeSize)}
        ${renderShortcutGenericDropdownHtml(barId, "stroke-style", "Style", SHORTCUT_STROKE_STYLES, annotationState.strokeStyle)}
        <span class="palette-sep">|</span>
        ${renderShortcutCommonActionsHtml({ snapBtn: true })}
      `;
    } else if (id === "highlight") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>HIGHLIGHT</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutColorDropdownHtml(barId, "Color")}
        ${renderShortcutGenericDropdownHtml(barId, "highlight-style", "Style", SHORTCUT_HIGHLIGHT_STYLES, annotationState.highlightStyle)}
        <span class="palette-sep">|</span>
        ${renderShortcutCommonActionsHtml({ applyHighlight: true })}
      `;
    } else if (id === "textbox") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>TEXT BOX</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutColorDropdownHtml(barId, "Color")}
        ${renderShortcutGenericDropdownHtml(barId, "textbox-size", "Font", SHORTCUT_TEXT_SIZES, annotationState.textBoxFontSize)}
        <span class="palette-sep">|</span>
        ${renderShortcutCommonActionsHtml({ snapBtn: true })}
      `;
    } else if (id === "stickynote") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>STICKY NOTE</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutColorDropdownHtml(barId, "Color")}
        ${renderShortcutGenericDropdownHtml(barId, "note-size", "Size", SHORTCUT_NOTE_SIZES, getStoredNoteSizeKey())}
        <span class="palette-sep">|</span>
        ${renderShortcutCommonActionsHtml({ snapBtn: true })}
      `;
    } else if (id === "sticker") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>STICKER</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutStickerDropdownHtml(barId)}
        <span class="palette-sep">|</span>
        ${renderShortcutCommonActionsHtml({ snapBtn: true })}
      `;
    } else if (id === "select") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>SELECT</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutColorDropdownHtml(barId, "Color")}
        <span class="palette-sep">|</span>
        ${renderShortcutCommonActionsHtml({ snapBtn: true, deleteSelected: true })}
      `;
    } else if (id === "eraser") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>ERASER</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "eraser-target", "Target", SHORTCUT_ERASER_TARGETS, annotationState.eraserFilter)}
        <span class="palette-sep">|</span>
        ${renderShortcutCommonActionsHtml({})}
      `;
    } else if (id === "snap") {
      const gridOn = !document.body.classList.contains("no-grid");
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>GRID SNAP</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "grid-size", "Grid Size", SHORTCUT_GRID_SIZES, getGridSize())}
        <label class="setting-toggle-row" data-no-tag="true">
          <span>Snap</span>
          <input type="checkbox" class="edit-flyout-snap-toggle shortcut-bar-snap-toggle" ${annotationState.snapToGrid ? "checked" : ""} />
          <span class="toggle-switch"></span>
        </label>
        <label class="setting-toggle-row" data-no-tag="true">
          <span>Grid</span>
          <input type="checkbox" class="shortcut-grid-vis-toggle" ${gridOn ? "checked" : ""} />
          <span class="toggle-switch"></span>
        </label>
        <span class="palette-sep">|</span>
        ${renderShortcutCommonActionsHtml({ undoRedo: false, clear: false })}
      `;
    } else if (id === "undo") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>UNDO</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "undo-scope", "Scope", SHORTCUT_UNDO_SCOPES, "last")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="undo" data-hover-tag="[UNDO]">Undo</button>
          <button type="button" class="palette-btn" data-action="redo" data-hover-tag="[REDO]">Redo</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "redo") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>REDO</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "redo-scope", "Scope", SHORTCUT_REDO_SCOPES, "next")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="redo" data-hover-tag="[REDO]">Redo</button>
          <button type="button" class="palette-btn" data-action="undo" data-hover-tag="[UNDO]">Undo</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "clear") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>CLEAR</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "clear-scope", "Scope", SHORTCUT_CLEAR_SCOPES, "all")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="clear" data-hover-tag="[CLEAR]">Clear</button>
          <button type="button" class="palette-btn" data-action="undo" data-hover-tag="[UNDO]">Undo</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "expand") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>EXPAND</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "expand-mode", "View Mode", SHORTCUT_EXPAND_MODES, "standard")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-expand" data-hover-tag="[EXPAND]">Toggle (F)</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "tree") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>DIRECTORY TREE</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "tree-filter", "Filter", SHORTCUT_TREE_FILTERS, "all")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-tree" data-hover-tag="[DIRECTORY TREE]">Open Tree</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "doubt") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>ASK GEMINI AI</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "doubt-mode", "AI Mode", SHORTCUT_DOUBT_MODES, "general")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-doubt" data-hover-tag="[ASK AI]">Ask AI</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "home") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>HOME</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "home-dest", "Destination", SHORTCUT_HOME_DESTINATIONS, "top")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-home" data-hover-tag="[HOME]">Go Home</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "notepad") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>NOTEPAD</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "notepad-type", "Note Type", SHORTCUT_NOTEPAD_TYPES, "general")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-notepad" data-hover-tag="[NOTEPAD]">+ Add Note</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "darkmode") {
      const isDark = document.body.classList.contains("theme-dark");
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>THEME</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "theme-mode", "Theme", SHORTCUT_THEME_MODES, isDark ? "dark" : "light")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-darkmode" data-hover-tag="[DARK MODE]">Toggle Theme</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "gridbg") {
      const gridOn = !document.body.classList.contains("no-grid");
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>GRID BG</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "grid-style", "Grid Density", SHORTCUT_GRID_STYLES, "standard")}
        <label class="setting-toggle-row" data-no-tag="true">
          <span>Grid</span>
          <input type="checkbox" class="shortcut-grid-vis-toggle" ${gridOn ? "checked" : ""} />
          <span class="toggle-switch"></span>
        </label>
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-gridbg" data-hover-tag="[GRID BG]">Toggle Grid</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "centerview") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>CENTER VIEW</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "center-align", "Align", SHORTCUT_CENTER_ALIGNMENTS, "center")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-centerview" data-hover-tag="[CENTER VIEW]">Center Area</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "print") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>PRINT / PDF</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "print-layout", "Layout", SHORTCUT_PRINT_LAYOUTS, "clean")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-print" data-hover-tag="[PRINT]">Print / PDF</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "font_size_up") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>TEXT SIZE</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "font-size", "Text Size", SHORTCUT_FONT_SIZES, getActiveFontSizeKey())}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-font-up" data-hover-tag="[FONT +]">+ Increase</button>
          <button type="button" class="palette-btn" data-action="exec-font-down" data-hover-tag="[FONT -]">- Decrease</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "font_size_down") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>TEXT SIZE</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "font-size", "Text Size", SHORTCUT_FONT_SIZES, getActiveFontSizeKey())}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-font-down" data-hover-tag="[FONT -]">- Decrease</button>
          <button type="button" class="palette-btn" data-action="exec-font-up" data-hover-tag="[FONT +]">+ Increase</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "font_typewriter") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>TYPOGRAPHY</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "font-style", "Typeface", SHORTCUT_FONT_STYLES, getActiveFontStyleKey())}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-font-typewriter" data-hover-tag="[FONT STYLE]">Toggle Font</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "scroll_top") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>SCROLL TOP</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "scroll-top-dest", "Target", SHORTCUT_SCROLL_TOP_TARGETS, "top")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-scroll-top" data-hover-tag="[TOP]">Scroll Top</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "scroll_bottom") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>SCROLL BOTTOM</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "scroll-bottom-dest", "Target", SHORTCUT_SCROLL_BOTTOM_TARGETS, "bottom")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-scroll-bottom" data-hover-tag="[BOTTOM]">Scroll Bottom</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "next_section") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>NEXT SECTION</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "next-section-mode", "Jump Mode", SHORTCUT_NEXT_SECTION_MODES, "next")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-next-section" data-hover-tag="[NEXT]">Jump Next (J)</button>
          <button type="button" class="palette-btn" data-action="exec-prev-section" data-hover-tag="[PREVIOUS]">Prev (K)</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "prev_section") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>PREV SECTION</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "prev-section-mode", "Jump Mode", SHORTCUT_PREV_SECTION_MODES, "prev")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-prev-section" data-hover-tag="[PREVIOUS]">Jump Prev (K)</button>
          <button type="button" class="palette-btn" data-action="exec-next-section" data-hover-tag="[NEXT]">Next (J)</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "forum") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>FORUM</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "forum-view", "Filter", SHORTCUT_FORUM_VIEWS, "all")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-forum" data-hover-tag="[FORUM]">Jump to Forum</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    } else if (id === "copy_link") {
      bodyHtml = `
        <span class="shortcut-tool-badge">${item.icon}<span>COPY LINK</span></span>
        <span class="palette-sep">|</span>
        ${renderShortcutGenericDropdownHtml(barId, "copy-link-format", "Format", SHORTCUT_COPY_LINK_FORMATS, "section")}
        <span class="palette-sep">|</span>
        <div class="shortcut-tool-actions">
          <button type="button" class="palette-btn" data-action="exec-copy-link" data-hover-tag="[COPY LINK]">Copy Link</button>
          <button type="button" class="palette-close-btn" data-action="close" data-hover-tag="[CLOSE]" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    }

    bar.innerHTML = dragHtml + bodyHtml;
    document.body.appendChild(bar);
    makeFloatingBarDraggable(bar, ".palette-drag-handle");
    wireShortcutToolDropdownInteractions(bar, id);
    return bar;
  }

  syncAllShortcutToolBarsUI = function() {
    const curColor = annotationState.activeColor || "#FFE066";
    const curSize = annotationState.activeSize || 4;
    const curStrokeStyle = annotationState.strokeStyle || "solid";
    const curHlStyle = annotationState.highlightStyle || "soft";
    const curTbFontSize = annotationState.textBoxFontSize || 14;
    const curNoteKey = getStoredNoteSizeKey();
    const curEraserTarget = annotationState.eraserFilter || "all";
    const curGridSize = annotationState.gridSize || getGridSize();
    const curSticker = annotationState.activeSticker || SHORTCUT_STICKER_BADGES[0];
    const curFontKey = getActiveFontSizeKey();
    const curTypeKey = getActiveFontStyleKey();

    if (editAnnotationBar) {
      editAnnotationBar.querySelectorAll(".palette-color-btn").forEach((b) => {
        b.classList.toggle("active", (b.getAttribute("data-color") || "").toUpperCase() === curColor.toUpperCase());
      });
      editAnnotationBar.querySelectorAll(".palette-size-btn").forEach((b) => {
        b.classList.toggle("active", parseInt(b.getAttribute("data-size"), 10) === curSize);
      });
    }

    document.querySelectorAll(".shortcut-tool-floating-bar").forEach((bar) => {
      const colorDot = bar.querySelector('[data-role="color-dot"]');
      const colorLbl = bar.querySelector('[data-role="color-label"]');
      const customInp = bar.querySelector('[data-sc-type="custom-color"]');
      if (colorDot) colorDot.style.background = curColor;
      if (colorLbl) colorLbl.textContent = getColorLabel(curColor);
      if (customInp && /^#[0-9a-f]{6}$/i.test(curColor)) customInp.value = curColor;
      bar.querySelectorAll('[data-sc-type="color"]').forEach((btn) => {
        btn.classList.toggle("active", (btn.getAttribute("data-val") || "").toUpperCase() === curColor.toUpperCase());
      });

      const syncKind = (kind, val, items) => {
        const matched = items.find((it) => String(it.val) === String(val)) || items[0];
        const lbl = bar.querySelector(`[data-role="${kind}-label"]`);
        if (lbl) lbl.textContent = matched.short || matched.label;
        const dotEl = bar.querySelector(`[data-role="${kind}-dot"]`);
        if (dotEl && matched.dot) {
          dotEl.style.width = `${matched.dot}px`;
          dotEl.style.height = `${matched.dot}px`;
        }
        bar.querySelectorAll(`[data-sc-type="${kind}"]`).forEach((btn) => {
          btn.classList.toggle("active", String(btn.getAttribute("data-val")) === String(matched.val));
        });
      };

      if (bar.querySelector('[data-dropdown-kind="size"]')) syncKind("size", curSize, SHORTCUT_STROKE_SIZES);
      if (bar.querySelector('[data-dropdown-kind="stroke-style"]')) syncKind("stroke-style", curStrokeStyle, SHORTCUT_STROKE_STYLES);
      if (bar.querySelector('[data-dropdown-kind="highlight-style"]')) syncKind("highlight-style", curHlStyle, SHORTCUT_HIGHLIGHT_STYLES);
      if (bar.querySelector('[data-dropdown-kind="textbox-size"]')) syncKind("textbox-size", curTbFontSize, SHORTCUT_TEXT_SIZES);
      if (bar.querySelector('[data-dropdown-kind="note-size"]')) syncKind("note-size", curNoteKey, SHORTCUT_NOTE_SIZES);
      if (bar.querySelector('[data-dropdown-kind="eraser-target"]')) syncKind("eraser-target", curEraserTarget, SHORTCUT_ERASER_TARGETS);
      if (bar.querySelector('[data-dropdown-kind="grid-size"]')) syncKind("grid-size", curGridSize, SHORTCUT_GRID_SIZES);
      if (bar.querySelector('[data-dropdown-kind="font-size"]')) syncKind("font-size", curFontKey, SHORTCUT_FONT_SIZES);
      if (bar.querySelector('[data-dropdown-kind="font-style"]')) syncKind("font-style", curTypeKey, SHORTCUT_FONT_STYLES);

      const stickerLbl = bar.querySelector('[data-role="sticker-label"]');
      if (stickerLbl) {
        stickerLbl.textContent = curSticker.type === "emoji" ? `${curSticker.icon} Stamp` : curSticker.label;
      }
      bar.querySelectorAll('[data-sc-type="sticker-tag"]').forEach((btn) => {
        btn.classList.toggle("active", curSticker.type !== "emoji" && btn.getAttribute("data-label") === curSticker.label);
      });
      bar.querySelectorAll('[data-sc-type="sticker-emoji"]').forEach((btn) => {
        btn.classList.toggle("active", curSticker.type === "emoji" && btn.getAttribute("data-icon") === curSticker.icon);
      });

      const snapBtn = bar.querySelector('[data-action="toggle-snap"]');
      if (snapBtn) {
        snapBtn.classList.toggle("active", annotationState.snapToGrid);
        snapBtn.setAttribute("aria-pressed", annotationState.snapToGrid ? "true" : "false");
      }
      const snapChk = bar.querySelector(".shortcut-bar-snap-toggle");
      if (snapChk) snapChk.checked = annotationState.snapToGrid;
      const gridChk = bar.querySelector(".shortcut-grid-vis-toggle");
      if (gridChk) gridChk.checked = !document.body.classList.contains("no-grid");
    });

    const snapPinnedBtn = document.getElementById("pinned-shortcut-snap");
    if (snapPinnedBtn) {
      snapPinnedBtn.classList.toggle("is-active", annotationState.snapToGrid || TopCenterFloatingManager.getPinnedId() === "shortcut-snap");
    }
    const darkPinnedBtn = document.getElementById("pinned-shortcut-darkmode");
    if (darkPinnedBtn) darkPinnedBtn.classList.toggle("is-active", document.body.classList.contains("theme-dark"));
    const gridPinnedBtn = document.getElementById("pinned-shortcut-gridbg");
    if (gridPinnedBtn) gridPinnedBtn.classList.toggle("is-active", !document.body.classList.contains("no-grid"));
    const typePinnedBtn = document.getElementById("pinned-shortcut-font_typewriter");
    if (typePinnedBtn) typePinnedBtn.classList.toggle("is-active", document.body.classList.contains("font-style-typewriter"));
  };

  const SHORTCUT_CATALOG = [
    {
      id: "select",
      title: "Select & Move Tool",
      tag: "[SELECT]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-select")) {
          toggleTopFloatingBar("shortcut-select");
        } else {
          openAnnotationPanel();
          setAnnotationTool("select");
        }
      }
    },
    {
      id: "sketch",
      title: "Sketch (Pencil Markup)",
      tag: "[SKETCH]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-sketch")) {
          toggleTopFloatingBar("shortcut-sketch");
        } else {
          openAnnotationPanel();
          setAnnotationTool("sketch");
        }
      }
    },
    {
      id: "highlight",
      title: "Highlight (Text Marker)",
      tag: "[HIGHLIGHT]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 7-4.5-4.5-8.5 8.5 4.5 4.5L22 7z"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-highlight")) {
          toggleTopFloatingBar("shortcut-highlight");
        } else {
          openAnnotationPanel();
          setAnnotationTool("highlight");
        }
      }
    },
    {
      id: "textbox",
      title: "Text Box (Annotation)",
      tag: "[TEXT]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-textbox")) {
          toggleTopFloatingBar("shortcut-textbox");
        } else {
          openAnnotationPanel();
          setAnnotationTool("textbox");
        }
      }
    },
    {
      id: "stickynote",
      title: "Sticky Note",
      tag: "[NOTE]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><polyline points="15 3 21 9 15 9 15 3"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-stickynote")) {
          toggleTopFloatingBar("shortcut-stickynote");
        } else {
          openAnnotationPanel();
          setAnnotationTool("stickynote");
        }
      }
    },
    {
      id: "sticker",
      title: "Sticker Stamp",
      tag: "[STICKER]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-sticker")) {
          toggleTopFloatingBar("shortcut-sticker");
        } else {
          openAnnotationPanel();
          setAnnotationTool("sticker");
        }
      }
    },
    {
      id: "eraser",
      title: "Eraser Tool",
      tag: "[ERASER]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-eraser")) {
          toggleTopFloatingBar("shortcut-eraser");
        } else {
          openAnnotationPanel();
          setAnnotationTool("eraser");
        }
      }
    },
    {
      id: "snap",
      title: "Snap to Grid",
      tag: "[SNAP TO GRID]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-snap")) {
          toggleTopFloatingBar("shortcut-snap");
        } else {
          toggleSnapToGrid();
        }
      }
    },
    {
      id: "undo",
      title: "Undo Action",
      tag: "[UNDO]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-undo")) {
          toggleTopFloatingBar("shortcut-undo");
        } else {
          performAnnotationUndo();
        }
      }
    },
    {
      id: "redo",
      title: "Redo Action",
      tag: "[REDO]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-redo")) {
          toggleTopFloatingBar("shortcut-redo");
        } else {
          performAnnotationRedo();
        }
      }
    },
    {
      id: "clear",
      title: "Clear All Annotations",
      tag: "[CLEAR]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-clear")) {
          toggleTopFloatingBar("shortcut-clear");
        } else {
          clearAllPageAnnotations();
        }
      }
    },
    {
      id: "expand",
      title: "Full Screen / Expand Navigation",
      tag: "[EXPAND]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-expand")) {
          toggleTopFloatingBar("shortcut-expand");
        } else {
          const btn = document.getElementById("expand-nav-btn");
          if (btn) btn.click();
          else toggleTopBar();
        }
      }
    },
    {
      id: "search",
      title: "Search Sovereign Terminal",
      tag: "[SEARCH]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
      action: () => {
        toggleTopFloatingBar("search");
      }
    },
    {
      id: "tree",
      title: "Directory Tree Navigation",
      tag: "[DIRECTORY TREE]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M3 6v12h4"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-tree")) {
          toggleTopFloatingBar("shortcut-tree");
        } else {
          const btn = document.getElementById("nav-tree-toggle-btn");
          if (btn) btn.click();
          else if (typeof toggleTree === "function") toggleTree(true);
        }
      }
    },
    {
      id: "doubt",
      title: "Ask Gemini AI Doubt Solver",
      tag: "[ASK AI]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-doubt")) {
          toggleTopFloatingBar("shortcut-doubt");
        } else {
          const btn = document.getElementById("doubt-nav-btn");
          if (btn) btn.click();
          else if (typeof openDoubtSolver === "function") openDoubtSolver(null, true);
        }
      }
    },
    {
      id: "edit",
      title: "Annotation & Markup Panel",
      tag: "[EDIT]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
      action: () => {
        toggleTopFloatingBar("edit");
      }
    },
    {
      id: "shortcuts",
      title: "Keyboard Shortcuts Matrix",
      tag: "[SHORTCUTS]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>`,
      action: () => {
        toggleTopFloatingBar("shortcuts");
      }
    },
    {
      id: "contact",
      title: "Contact Us & Resolution",
      tag: "[CONTACT US]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/></svg>`,
      action: () => {
        toggleTopFloatingBar("contact");
      }
    },
    {
      id: "account",
      title: "Account Dossier & Cloud Sync",
      tag: "[ACCOUNT]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      action: () => {
        toggleTopFloatingBar("account");
      }
    },
    {
      id: "home",
      title: "Sovereign Terminal Home",
      tag: "[HOME]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-home")) {
          toggleTopFloatingBar("shortcut-home");
        } else {
          const btn = document.getElementById("nav-home-btn");
          if (btn) btn.click();
          else window.location.href = "guide.html";
        }
      }
    },
    {
      id: "notepad",
      title: "Section Notepad (Add Note)",
      tag: "[NOTEPAD]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-notepad")) {
          toggleTopFloatingBar("shortcut-notepad");
        } else {
          const sections = Array.from(document.querySelectorAll(".page-directory-section, .doc-section, .content-area > section"));
          const target = sections.find((s) => {
            const r = s.getBoundingClientRect();
            return r.top >= 0 && r.top <= window.innerHeight * 0.6;
          }) || sections[0];
          if (target) {
            const btn = target.querySelector(".section-notepad-btn");
            if (btn) btn.click();
            else if (typeof addSectionUserNote === "function") {
              addSectionUserNote(target.id || "sec-active", target);
            }
          }
        }
      }
    },
    {
      id: "darkmode",
      title: "Dark / Light Mode",
      tag: "[DARK MODE]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-darkmode")) {
          toggleTopFloatingBar("shortcut-darkmode");
        } else {
          toggleThemeMode();
        }
      }
    },
    {
      id: "gridbg",
      title: "Background Grid",
      tag: "[GRID BG]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="3" x2="21" y2="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="3" x2="3" y2="21"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="21" y1="3" x2="21" y2="21"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-gridbg")) {
          toggleTopFloatingBar("shortcut-gridbg");
        } else {
          toggleBackgroundGrid();
        }
      }
    },
    {
      id: "centerview",
      title: "Center Viewport",
      tag: "[CENTER VIEW]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-centerview")) {
          toggleTopFloatingBar("shortcut-centerview");
        } else {
          const main = document.querySelector(".guide-main") || document.querySelector("main") || document.documentElement;
          main.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    },
    {
      id: "print",
      title: "Print / Export PDF",
      tag: "[PRINT]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-print")) {
          toggleTopFloatingBar("shortcut-print");
        } else {
          window.print();
        }
      }
    },
    {
      id: "font_size_up",
      title: "Increase Text Size",
      tag: "[FONT +]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5h3v14M11 19V5h3v14M18 12h5M20.5 9.5v5"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-font_size_up")) {
          toggleTopFloatingBar("shortcut-font_size_up");
        } else {
          const sizes = ["small", "medium", "large"];
          const cur = sizes.findIndex((s) => document.documentElement.classList.contains(`font-size-${s}`));
          const idx = cur === -1 ? 1 : cur;
          if (idx < sizes.length - 1) applyFontSize(sizes[idx + 1]);
        }
      }
    },
    {
      id: "font_size_down",
      title: "Decrease Text Size",
      tag: "[FONT -]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5h3v14M11 19V5h3v14M18 12h5"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-font_size_down")) {
          toggleTopFloatingBar("shortcut-font_size_down");
        } else {
          const sizes = ["small", "medium", "large"];
          const cur = sizes.findIndex((s) => document.documentElement.classList.contains(`font-size-${s}`));
          const idx = cur === -1 ? 1 : cur;
          if (idx > 0) applyFontSize(sizes[idx - 1]);
        }
      }
    },
    {
      id: "font_typewriter",
      title: "Toggle Monospace Font",
      tag: "[FONT STYLE]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-font_typewriter")) {
          toggleTopFloatingBar("shortcut-font_typewriter");
        } else {
          const isType = document.body.classList.contains("font-style-typewriter");
          applyFontStyle(isType ? "reading" : "typewriter");
        }
      }
    },
    {
      id: "scroll_top",
      title: "Scroll to Page Top",
      tag: "[TOP]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-scroll_top")) {
          toggleTopFloatingBar("shortcut-scroll_top");
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    },
    {
      id: "scroll_bottom",
      title: "Scroll to Page Bottom",
      tag: "[BOTTOM]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-scroll_bottom")) {
          toggleTopFloatingBar("shortcut-scroll_bottom");
        } else {
          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        }
      }
    },
    {
      id: "next_section",
      title: "Jump to Next Section",
      tag: "[NEXT]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-next_section")) {
          toggleTopFloatingBar("shortcut-next_section");
        } else {
          const headings = Array.from(document.querySelectorAll("h1, h2.story-section-title, h3.story-section-title, .page-directory-section"));
          const next = headings.find((h) => h.getBoundingClientRect().top > 80);
          if (next) next.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    {
      id: "prev_section",
      title: "Jump to Previous Section",
      tag: "[PREVIOUS]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-prev_section")) {
          toggleTopFloatingBar("shortcut-prev_section");
        } else {
          const headings = Array.from(document.querySelectorAll("h1, h2.story-section-title, h3.story-section-title, .page-directory-section"));
          const prev = headings.filter((h) => h.getBoundingClientRect().top < -20).pop();
          if (prev) prev.scrollIntoView({ behavior: "smooth", block: "start" });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    },
    {
      id: "forum",
      title: "Institutional Forum & Discussion",
      tag: "[FORUM]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-forum")) {
          toggleTopFloatingBar("shortcut-forum");
        } else {
          const forum = document.getElementById("forum-section") || document.querySelector(".institutional-forum-section");
          if (forum) forum.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    {
      id: "copy_link",
      title: "Copy Link to Terminal",
      tag: "[COPY LINK]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
      action: () => {
        if (document.getElementById("shortcut-bar-copy_link")) {
          toggleTopFloatingBar("shortcut-copy_link");
        } else {
          navigator.clipboard.writeText(window.location.href);
        }
      }
    },
    {
      id: "settings",
      title: "View Preferences & Settings",
      tag: "[SETTINGS]",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
      action: () => {
        toggleTopFloatingBar("settings");
      }
    }
  ];

  function initShortcutCustomizer() {
    const addShortcutBtn = document.getElementById("add-shortcut-btn");
    let customizerBar = document.getElementById("shortcut-customizer-bar");
    const pinnedContainer = document.getElementById("pinned-shortcuts-container");

    if (!customizerBar) {
      customizerBar = document.createElement("div");
      customizerBar.id = "shortcut-customizer-bar";
      customizerBar.className = "shortcut-customizer-bar";
      customizerBar.setAttribute("role", "dialog");
      customizerBar.setAttribute("aria-label", "Add Shortcut to Top Bar");
      customizerBar.innerHTML = `
        <span class="customizer-drag-handle" title="Add Shortcut">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"></path><path d="M12 5v14"></path>
          </svg>
        </span>
        <div class="customizer-input-wrap">
          <span class="customizer-search-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>
            </svg>
          </span>
          <input type="text" class="customizer-input font-mono" id="shortcut-customizer-input" placeholder="Search shortcuts to pin (e.g. Sketch, Snap, Dark Mode)..." autocomplete="off" spellcheck="false" />
          <button type="button" class="customizer-clear-btn" id="shortcut-customizer-clear-btn" style="display: none;">&times;</button>
        </div>
        <span class="palette-sep">|</span>
        <button type="button" class="customizer-close-btn" id="shortcut-customizer-close-btn" aria-label="Close" data-hover-tag="[CLOSE]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="customizer-dropdown font-mono" id="shortcut-customizer-dropdown"></div>
      `;
      document.body.appendChild(customizerBar);
    }

    const inputEl = customizerBar.querySelector("#shortcut-customizer-input");
    const clearBtn = customizerBar.querySelector("#shortcut-customizer-clear-btn");
    const closeBtn = customizerBar.querySelector("#shortcut-customizer-close-btn");
    const dropdownEl = customizerBar.querySelector("#shortcut-customizer-dropdown");
    const dragHandle = customizerBar.querySelector(".customizer-drag-handle");

    // Drag support for shortcut customizer
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    if (dragHandle) {
      dragHandle.addEventListener("pointerdown", (e) => {
        isDragging = true;
        const rect = customizerBar.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        try { dragHandle.setPointerCapture(e.pointerId); } catch (_) {}
        customizerBar.classList.add("is-dragging-bar");
        customizerBar.style.left = `${rect.left}px`;
        customizerBar.style.top = `${rect.top}px`;
        customizerBar.style.transform = "none";
        e.preventDefault();
      });

      dragHandle.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        let newLeft = e.clientX - dragOffsetX;
        let newTop = e.clientY - dragOffsetY;
        newLeft = Math.max(10, Math.min(window.innerWidth - customizerBar.offsetWidth - 10, newLeft));
        newTop = Math.max(10, Math.min(window.innerHeight - customizerBar.offsetHeight - 10, newTop));
        customizerBar.style.left = `${newLeft}px`;
        customizerBar.style.top = `${newTop}px`;
      });

      const stopDrag = (e) => {
        if (isDragging) {
          isDragging = false;
          customizerBar.classList.remove("is-dragging-bar");
          try { dragHandle.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };
      dragHandle.addEventListener("pointerup", stopDrag);
      dragHandle.addEventListener("pointercancel", stopDrag);
    }

    function getPinnedIds() {
      try {
        const raw = localStorage.getItem("indexindia_pinned_shortcuts");
        if (raw) return JSON.parse(raw);
      } catch (_) {}
      return [];
    }

    function savePinnedIds(ids) {
      try {
        localStorage.setItem("indexindia_pinned_shortcuts", JSON.stringify(ids));
      } catch (_) {}
    }

    function renderPinnedBar() {
      if (!pinnedContainer) return;

      SHORTCUT_TOOL_BAR_IDS.forEach((toolId) => {
        TopCenterFloatingManager.unregister(`shortcut-${toolId}`);
      });
      document.querySelectorAll(".shortcut-tool-floating-bar").forEach((el) => el.remove());

      const pinnedIds = getPinnedIds();
      pinnedContainer.innerHTML = "";

      pinnedIds.forEach((id) => {
        const item = SHORTCUT_CATALOG.find((c) => c.id === id);
        if (!item) return;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pinned-shortcut-btn icon-btn";
        btn.id = `pinned-shortcut-${item.id}`;
        btn.setAttribute("data-shortcut-id", item.id);
        btn.setAttribute("data-hover-tag", item.tag);
        btn.setAttribute("aria-label", item.title);
        btn.innerHTML = item.icon;

        pinnedContainer.appendChild(btn);

        if (SHORTCUT_TOOL_BAR_IDS.has(item.id)) {
          const toolBar = buildShortcutToolFloatingBar(item);
          const isAnnotationCanvasTool = new Set(["sketch", "highlight", "textbox", "stickynote", "sticker", "select", "eraser"]).has(item.id);
          const isDirectToggleShortcut = new Set(["snap", "darkmode", "gridbg", "font_typewriter"]).has(item.id);
          registerTopFloatingBar({
            id: `shortcut-${item.id}`,
            wrapper: btn,
            btn: btn,
            bar: toolBar,
            closeBtnSelector: ".palette-close-btn",
            bindClick: !isDirectToggleShortcut,
            onPreview: () => {
              syncAllShortcutToolBarsUI();
            },
            onPin: isAnnotationCanvasTool ? ({ fromInteraction }) => {
              activateAnnotationMode({
                fromInteraction,
                tool: item.id,
                suppressPopover: true
              });
            } : () => {
              syncAllShortcutToolBarsUI();
            },
            onClose: isAnnotationCanvasTool ? () => {
              deactivateAnnotationMode();
            } : () => {
              syncAllShortcutToolBarsUI();
            }
          });
          if (isDirectToggleShortcut) {
            btn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (item.id === "snap") toggleSnapToGrid();
              else if (item.id === "darkmode") toggleThemeMode();
              else if (item.id === "gridbg") toggleBackgroundGrid();
              else if (item.id === "font_typewriter") {
                const isType = document.body.classList.contains("font-style-typewriter");
                applyFontStyle(isType ? "reading" : "typewriter");
              }
              syncAllShortcutToolBarsUI();
            });
          }
        } else if (SHORTCUT_NATIVE_PANEL_IDS.has(item.id)) {
          btn.addEventListener("mouseenter", () => {
            TopCenterFloatingManager.showHoverPreview(item.id);
          });
          btn.addEventListener("mouseleave", () => {
            TopCenterFloatingManager.clearSuppressedHover(item.id);
            if (TopCenterFloatingManager.getPinnedId() !== item.id && TopCenterFloatingManager.getHoverId() === item.id) {
              TopCenterFloatingManager.scheduleLeave(item.id);
            }
          });
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            TopCenterFloatingManager.clearSuppressedHover(item.id);
            toggleTopFloatingBar(item.id);
          });
        } else {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            item.action();
            syncAllShortcutToolBarsUI();
          });
        }
      });

      syncAllShortcutToolBarsUI();
    }

    let selectedDropdownIndex = 0;
    let currentFilteredList = [];

    function renderDropdown(filterText = "") {
      const pinnedIds = getPinnedIds();
      const query = (filterText || "").toLowerCase().trim();

      currentFilteredList = SHORTCUT_CATALOG.filter((item) => {
        if (!query) return true;
        return (
          item.title.toLowerCase().includes(query) ||
          item.tag.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
        );
      });

      if (currentFilteredList.length === 0) {
        dropdownEl.innerHTML = `<div style="padding: 10px; font-size: 0.78rem; color: var(--text-tertiary); text-align: center;">No matching shortcuts found</div>`;
        return;
      }

      if (selectedDropdownIndex >= currentFilteredList.length) {
        selectedDropdownIndex = 0;
      }

      dropdownEl.innerHTML = currentFilteredList.map((item, idx) => {
        const isPinned = pinnedIds.includes(item.id);
        const isSelected = idx === selectedDropdownIndex;
        return `
          <div class="customizer-item${isSelected ? ' is-selected' : ''}" data-id="${item.id}" data-index="${idx}">
            <div class="customizer-item-left">
              <span class="customizer-item-icon">${item.icon}</span>
              <span class="customizer-item-title">${item.title}</span>
              <span class="customizer-item-tag">${item.tag}</span>
            </div>
            <span class="customizer-item-status${isPinned ? ' is-pinned' : ''}">
              ${isPinned ? 'PINNED' : '+ PIN'}
            </span>
          </div>
        `;
      }).join("");

      dropdownEl.querySelectorAll(".customizer-item").forEach((el) => {
        el.addEventListener("click", () => {
          const id = el.getAttribute("data-id");
          togglePin(id);
        });
      });
    }

    function togglePin(id) {
      let pinnedIds = getPinnedIds();
      if (pinnedIds.includes(id)) {
        pinnedIds = pinnedIds.filter((p) => p !== id);
      } else {
        pinnedIds.push(id);
      }
      savePinnedIds(pinnedIds);
      renderPinnedBar();
      renderDropdown(inputEl.value);
    }

    function openCustomizer() {
      closeAllTopFloatingBars();
      customizerBar.classList.add("is-visible");
      customizerBar.style.transform = "translateX(-50%) translateY(0)";
      customizerBar.style.left = "50%";
      customizerBar.style.top = "calc(var(--nav-height) + 14px)";
      inputEl.value = "";
      clearBtn.style.display = "none";
      selectedDropdownIndex = 0;
      renderDropdown("");
      setTimeout(() => inputEl.focus(), 60);
    }

    function closeCustomizer() {
      customizerBar.classList.remove("is-visible");
    }

    if (addShortcutBtn) {
      addShortcutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (customizerBar.classList.contains("is-visible")) {
          closeCustomizer();
        } else {
          openCustomizer();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeCustomizer();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        inputEl.value = "";
        clearBtn.style.display = "none";
        selectedDropdownIndex = 0;
        renderDropdown("");
        inputEl.focus();
      });
    }

    inputEl.addEventListener("input", () => {
      clearBtn.style.display = inputEl.value ? "inline-flex" : "none";
      selectedDropdownIndex = 0;
      renderDropdown(inputEl.value);
    });

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (currentFilteredList.length > 0) {
          selectedDropdownIndex = (selectedDropdownIndex + 1) % currentFilteredList.length;
          renderDropdown(inputEl.value);
          const selEl = dropdownEl.querySelector(".customizer-item.is-selected");
          if (selEl) selEl.scrollIntoView({ block: "nearest" });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (currentFilteredList.length > 0) {
          selectedDropdownIndex = (selectedDropdownIndex - 1 + currentFilteredList.length) % currentFilteredList.length;
          renderDropdown(inputEl.value);
          const selEl = dropdownEl.querySelector(".customizer-item.is-selected");
          if (selEl) selEl.scrollIntoView({ block: "nearest" });
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (currentFilteredList.length > 0 && currentFilteredList[selectedDropdownIndex]) {
          togglePin(currentFilteredList[selectedDropdownIndex].id);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeCustomizer();
      }
    });

    // Close when clicking outside
    document.addEventListener("pointerdown", (e) => {
      if (!customizerBar.classList.contains("is-visible")) return;
      const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
      if (!targetEl) return;
      if (customizerBar.contains(targetEl) || addShortcutBtn?.contains(targetEl)) return;
      closeCustomizer();
    });

    // Initial render
    renderPinnedBar();
  }

  /* ==========================================================================
     TOP BAR DRAG & DROP UTILITY REORDERING (With localStorage Persistence)
     ========================================================================== */
  function initTopBarReorder() {
    const navGroup = document.getElementById("nav-icons-group");
    if (!navGroup) return;

    const STORAGE_KEY = "indexindia_topbar_order";

    // 1. Restore saved order on load
    try {
      const savedOrder = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(savedOrder) && savedOrder.length > 0) {
        savedOrder.forEach((id) => {
          const item = document.getElementById(id);
          if (item && item.parentElement === navGroup) {
            navGroup.appendChild(item);
          }
        });
      }
    } catch (err) {
      console.warn("Could not restore top bar order:", err);
    }

    // 2. Enable live drag-and-drop reordering
    let draggedWrapper = null;
    let isDragging = false;
    let dragEndTime = 0;

    function saveOrder() {
      const ids = Array.from(navGroup.children)
        .filter((el) => el.classList.contains("panel-trigger-wrapper") && el.id)
        .map((el) => el.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }

    const items = Array.from(navGroup.querySelectorAll(".panel-trigger-wrapper"));
    items.forEach((item) => {
      item.setAttribute("draggable", "true");

      item.addEventListener("dragstart", (e) => {
        draggedWrapper = item;
        isDragging = true;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
        setTimeout(() => {
          item.classList.add("is-dragging");
        }, 0);

        // Hide hover tag while dragging
        const hoverTag = document.getElementById("system-hover-tag");
        if (hoverTag) hoverTag.classList.remove("is-visible");
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!draggedWrapper || draggedWrapper === item) return;

        const rect = item.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        if (e.clientX < midpoint) {
          if (item.previousElementSibling !== draggedWrapper) {
            navGroup.insertBefore(draggedWrapper, item);
          }
        } else {
          if (item.nextElementSibling !== draggedWrapper) {
            navGroup.insertBefore(draggedWrapper, item.nextSibling);
          }
        }
      });

      item.addEventListener("dragend", () => {
        if (draggedWrapper) {
          draggedWrapper.classList.remove("is-dragging");
        }
        draggedWrapper = null;
        isDragging = false;
        dragEndTime = Date.now();
        saveOrder();
      });

      // Prevent accidental link navigation or popup trigger right after drag drop
      item.addEventListener("click", (e) => {
        if (Date.now() - dragEndTime < 300) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }, true);
    });
  }

  // Initialize hovering tag system, top bar reorder, and shortcut customizer
  initHoverTagSystem();
  initTopBarReorder();
  initShortcutCustomizer();
});
