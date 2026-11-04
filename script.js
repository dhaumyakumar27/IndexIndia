/**
 * IndexIndia (Firm D) — Core Institutional Interactions
 * Zero-bloat, lightweight vanilla JS across all modular pages.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ================= 1. PAGE CONTEXT & VIEW DETECTION =================
  const pathname = window.location.pathname.toLowerCase();
  const currentFile = pathname.split("/").pop() || "index.html";
  const isGuideSuite = pathname.includes("guide");
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
  let toggleAnnotationPanel = function() {};
  let openAnnotationPanel = function() {};
  let closeAnnotationPanel = function() {};
  let isAnnotationPanelActive = function() { return false; };
  let toggleTopBar = function() {};
  let hideTopBar = function() {};
  let showTopBar = function() {};
  let isTopBarHidden = function() { return false; };

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

    // Helper for tree branch guides: ├──, │  ├──, └──
    function getTreeGuide(level, isLastInBranch) {
      if (level === 1) {
        return isLastInBranch ? "└──" : "├──";
      } else if (level === 2) {
        return isLastInBranch ? "│&nbsp;&nbsp;└──" : "│&nbsp;&nbsp;├──";
      } else if (level === 3) {
        return isLastInBranch ? "│&nbsp;&nbsp;│&nbsp;&nbsp;└──" : "│&nbsp;&nbsp;│&nbsp;&nbsp;├──";
      } else {
        return isLastInBranch ? "│&nbsp;&nbsp;│&nbsp;&nbsp;│&nbsp;&nbsp;└──" : "│&nbsp;&nbsp;│&nbsp;&nbsp;│&nbsp;&nbsp;├──";
      }
    }

    // Build the HTML for the Directory Tree
    let treeHtml = "";
    let nodeCounter = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type === "module") {
        treeHtml += `<div class="tree-section-header">${item.title}</div>\n`;
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
        const badge = String(idx + 1).padStart(2, "0");
        const activeClass = idx === currentSubIndex ? " active" : "";

        treeHtml += `<a href="#${item.id}" class="tree-node${activeClass}" data-index="${idx}" data-level="${item.level}">
  <span class="tree-guide font-mono">${guide}</span>
  <span class="tree-name font-mono">${item.displayName}</span>
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

    const navTreeBtn = document.getElementById("nav-tree-toggle-btn");
    if (navTreeBtn) navTreeBtn.classList.add("is-active");

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

    const navTreeBtn = document.getElementById("nav-tree-toggle-btn");
    if (navTreeBtn) navTreeBtn.classList.remove("is-active");

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
    const navTreeBtn = document.getElementById("nav-tree-toggle-btn");
    if (navTreeBtn) navTreeBtn.classList.add("is-active");
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
        const navTreeBtn = document.getElementById("nav-tree-toggle-btn");
        if (navTreeBtn) navTreeBtn.classList.remove("is-active");
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

  // Close Directory Tree when clicking outside
  document.addEventListener("mousedown", (e) => {
    if (!isTreeCurrentlyOpen()) return;
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

  // ================= 3. TOP RIGHT SHORTCUTS, UPGRADE, ACCOUNT & SETTINGS PANELS =================
  const shortcutsWrapper = document.getElementById("shortcuts-wrapper");
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  const accountWrapper = document.getElementById("account-wrapper");
  const accountBtn = document.getElementById("account-btn");
  const settingsWrapper = document.getElementById("settings-wrapper");
  const settingsBtn = document.getElementById("settings-btn");
  const upgradeNavWrapper = document.getElementById("upgrade-nav-wrapper");
  const upgradeNavBtn = document.getElementById("upgrade-nav-btn");

  const flyoutPanels = [
    {
      wrapper: shortcutsWrapper,
      btn: shortcutsBtn,
      onOpen: null
    },
    {
      wrapper: upgradeNavWrapper,
      btn: upgradeNavBtn,
      onOpen: async () => {
        const sb = window.IndexIndiaSupabase;
        if (sb && typeof sb.getUserMembership === "function") {
          try {
            const m = await sb.getUserMembership();
            updateNavUpgradePanel(m);
          } catch (e) {}
        }
      }
    },
    {
      wrapper: accountWrapper,
      btn: accountBtn,
      onOpen: () => {
        if (typeof renderAccountPanel === "function") {
          renderAccountPanel();
        }
      }
    },
    {
      wrapper: settingsWrapper,
      btn: settingsBtn,
      onOpen: null
    }
  ];

  flyoutPanels.forEach((item) => {
    if (!item.wrapper) return;
    let leaveTimer = null;

    // Hover bridge: entering opens the panel and refreshes live stats
    item.wrapper.addEventListener("mouseenter", () => {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      flyoutPanels.forEach((other) => {
        if (other.wrapper && other.wrapper !== item.wrapper) {
          other.wrapper.classList.remove("is-open");
        }
      });
      item.wrapper.classList.add("is-open");
      if (typeof item.onOpen === "function") {
        item.onOpen();
      }
    });

    // 280ms grace timeout before closing on mouseleave so moving from button to panel never drops
    item.wrapper.addEventListener("mouseleave", () => {
      leaveTimer = setTimeout(() => {
        item.wrapper.classList.remove("is-open");
      }, 280);
    });

    // Also support click toggle
    if (item.btn) {
      item.btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = !item.wrapper.classList.contains("is-open");
        flyoutPanels.forEach((other) => {
          if (other.wrapper && other.wrapper !== item.wrapper) {
            other.wrapper.classList.remove("is-open");
          }
        });
        if (willOpen) {
          item.wrapper.classList.add("is-open");
          if (typeof item.onOpen === "function") {
            item.onOpen();
          }
        } else {
          item.wrapper.classList.remove("is-open");
        }
      });
    }
  });

  document.addEventListener("click", (e) => {
    flyoutPanels.forEach((item) => {
      if (item.wrapper && !item.wrapper.contains(e.target)) {
        item.wrapper.classList.remove("is-open");
      }
    });
  });

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

      if (badge) {
        badge.style.display = "inline-flex";
        badge.textContent = `${(membership.plan_type || "PRO").toUpperCase()} PASS`;
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
      ["lifetime", "annual", "monthly"].includes(membership.plan_type)
    );

    // 1. Section 1 (Unincorporated Entities): "sole proprietorship is best for start up"
    const unincorporatedSec = document.getElementById("sec-unincorporated");
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
      const ch2Children = document.querySelectorAll(".tree-ch2-child .tree-guide");
      if (ch2Guide) ch2Guide.innerHTML = "&#9500;&#9472;&#9472;";
      ch2Children.forEach((g, i) => {
        g.innerHTML = (i === ch2Children.length - 1) ? "│&nbsp;&nbsp;└──" : "│&nbsp;&nbsp;├──";
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
            <span class="tree-guide font-mono">&#9500;&#9472;&#9472;</span>
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
      const ch2Children = document.querySelectorAll(".tree-ch2-child .tree-guide");
      if (ch2Guide) ch2Guide.innerHTML = "&#9492;&#9472;&#9472;";
      ch2Children.forEach((g, i) => {
        g.innerHTML = (i === ch2Children.length - 1) ? "&nbsp;&nbsp;&nbsp;&nbsp;└──" : "&nbsp;&nbsp;&nbsp;&nbsp;├──";
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

      accountPanel.innerHTML = `
        <div class="panel-header">
          <div class="panel-user-meta">
            ${hasPaidPlan ? `<span class="user-role-badge" style="background: #FF3B00; color: #fff;">${membership.plan_type.toUpperCase()} PASS</span>` : ""}
            <span class="user-id">ACCOUNT DOSSIER</span>
          </div>
        </div>

        <div class="account-user-card">
          <div class="account-field-label">Authenticated Identity</div>
          <div class="account-user-email" title="${email}">${email}</div>
        </div>

        <div class="panel-section" style="padding-top: 0;">
          <div class="panel-metric-row">
            <span class="metric-label">Access Clearance</span>
            <span class="metric-value font-mono ${hasPaidPlan ? 'status-verified' : ''}">${planStatusText}</span>
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

        <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px;">
          ${!hasPaidPlan ? `
            <a href="membership.html" class="account-btn-action" style="background-color: var(--accent); color: #FFFFFF !important; text-decoration: none; text-align: center; justify-content: center; font-weight: 700;">
              Upgrade to Sovereign Pass
            </a>
          ` : `
            <a href="membership.html" style="font-size: 0.72rem; color: var(--accent); text-align: center; text-decoration: none; font-family: var(--font-mono); padding: 4px 0;">
              Manage Membership / Clearance &rarr;
            </a>
          `}
          <button type="button" class="account-btn-action" id="btn-account-sync-now" style="margin-top: 0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            Sync Telemetry Now
          </button>
          <button type="button" class="account-btn-secondary" id="btn-account-signout">
            Sign Out
          </button>
        </div>

        <div class="panel-footer" style="margin-top: 10px;">
          <div class="panel-sub-note">IndexIndia Cross-Device Cloud Sync</div>
        </div>
      `;

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
      accountPanel.innerHTML = `
        <div class="panel-header">
          <div class="panel-user-meta">
            <span class="user-id">GUEST / LOCAL</span>
          </div>
          <div class="active-pulse-indicator" style="color: var(--text-tertiary);" title="Local storage only">
            <span class="pulse-dot" style="background: var(--text-tertiary);"></span> Local
          </div>
        </div>

        <div style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.45;">
          Connect your <strong>Supabase</strong> project to automatically sync your annotations &amp; AI questions across all your devices.
        </div>

        <div class="account-status-msg" id="account-status-msg"></div>

        <div class="account-config-box" style="margin-top: 0;">
          <label class="account-field-label">Supabase Project URL</label>
          <input type="text" class="account-input" id="cfg-supabase-url" placeholder="https://xyzcompany.supabase.co" autocomplete="off" spellcheck="false" />

          <label class="account-field-label">Supabase Anon Public Key</label>
          <input type="password" class="account-input" id="cfg-supabase-key" placeholder="eyJhbGciOiJIUzI1NiIsIn..." autocomplete="off" spellcheck="false" />

          <button type="button" class="account-btn-action" id="btn-save-supabase-cfg">
            Connect Cloud Sync
          </button>
        </div>

        <div class="panel-footer" style="margin-top: 10px;">
          <div class="panel-sub-note">Free at supabase.com &bull; Keys stored in browser</div>
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
    const config = sb.getConfig();
    accountPanel.innerHTML = `
      <div class="panel-header">
        <div class="panel-user-meta">
          <span class="user-id">CLOUD READY</span>
        </div>
        <div class="active-pulse-indicator" style="color: var(--status-optimal);" title="Ready to sign in">
          <span class="pulse-dot" style="background: var(--status-optimal);"></span> Online
        </div>
      </div>

      <div class="account-auth-tabs">
        <button type="button" class="account-auth-tab ${accountActiveTab === "signin" ? "active" : ""}" id="tab-auth-signin">Sign In</button>
        <button type="button" class="account-auth-tab ${accountActiveTab === "signup" ? "active" : ""}" id="tab-auth-signup">Sign Up</button>
        <button type="button" class="account-auth-tab ${accountActiveTab === "magic" ? "active" : ""}" id="tab-auth-magic">Magic Link</button>
      </div>

      <button type="button" class="account-btn-action account-google-btn" id="btn-auth-google">
        <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
        Sign in with Google
      </button>

      <div class="account-divider-row">
        <span>OR EMAIL</span>
      </div>

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

      ${isConfigBoxVisible ? `
        <div class="account-config-box">
          <label class="account-field-label">Supabase URL</label>
          <input type="text" class="account-input" id="cfg-supabase-url" value="${config.url || ''}" />
          <label class="account-field-label">Anon Key</label>
          <input type="password" class="account-input" id="cfg-supabase-key" value="${config.anonKey || ''}" />
          <button type="button" class="account-btn-action" id="btn-save-supabase-cfg">Update Keys</button>
        </div>
      ` : ''}

      <button type="button" class="account-config-toggle" id="btn-toggle-cfg">
        ${isConfigBoxVisible ? "Hide Supabase Settings" : "⚙ Supabase Settings"}
      </button>

      <div class="panel-footer" style="margin-top: 10px;">
        <div class="panel-sub-note">Local-First Storage &bull; End-to-End Encrypted</div>
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
          msg.innerHTML = `<strong>Google Sign-in:</strong><br>${err.message || "Google sign-in could not be completed."}`;
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
  // Uses integer pixel rounding (Math.trunc) to eliminate subpixel font rasterization jumping.
  let smoothScrollRaf = null;
  let activeArrowDirection = 0; // +1 = down, -1 = up, 0 = idle
  let smoothVelocity = 0;
  let isArrowHeld = false;
  let isFastScroll = false;
  let lastFrameTime = 0;
  let subPixelAccumulator = 0;

  const NORMAL_CRUISE_SPEED = 9.5; // pixels per frame at 60fps (~570px/sec cruising speed)
  const NORMAL_TAP_VELOCITY = 3.8; // gentle initial impulse on tap (~26-30px total displacement)
  const NORMAL_ACCEL = 0.42; // smooth ramp-up to cruising speed while held (~250ms)

  const FAST_CRUISE_SPEED = 28.0; // accelerated cruising speed (~1680px/sec, ~2.9x faster)
  const FAST_TAP_VELOCITY = 10.0; // crisp initial impulse for fast scroll
  const FAST_ACCEL = 1.35; // smooth ramp-up to fast cruise speed (~250ms)

  const FRICTION = 0.84; // silky ~120ms ease-out on key release

  function cancelSmoothScrollImmediately() {
    isArrowHeld = false;
    isFastScroll = false;
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

    const targetMax = isFastScroll ? FAST_CRUISE_SPEED : NORMAL_CRUISE_SPEED;
    const targetAccel = isFastScroll ? FAST_ACCEL : NORMAL_ACCEL;

    if (isArrowHeld) {
      if (smoothVelocity < targetMax) {
        smoothVelocity = Math.min(targetMax, smoothVelocity + targetAccel * timeScale);
      } else if (smoothVelocity > targetMax) {
        smoothVelocity = Math.max(targetMax, smoothVelocity * Math.pow(FRICTION, timeScale));
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

  function startSmoothScroll(direction, fast = false) {
    activeArrowDirection = direction;
    isArrowHeld = true;
    isFastScroll = !!fast;
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

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

    // Helper: strictly true if NO modifier key (Ctrl, Shift, Alt, Meta) is pressed
    const noModifiers = !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;

    // 1. Tab: strictly alone (no Ctrl, Shift, Alt, Meta) - simple tab press switches between Guide <=> Index
    if (e.key === "Tab") {
      if (!noModifiers) return;
      e.preventDefault();
      if (e.repeat) return;
      window.location.href = targetOtherSuiteUrl;
      return;
    }

    // 2. Shortcut Panel: Ctrl + \ (or ?)
    if (((e.ctrlKey || e.metaKey) && (e.key === "\\" || e.code === "Backslash")) ||
        ((e.key === "?" || (e.shiftKey && e.key === "/")) && !e.ctrlKey && !e.altKey && !e.metaKey)) {
      e.preventDefault();
      if (accountWrapper) accountWrapper.classList.remove("is-open");
      if (settingsWrapper) settingsWrapper.classList.remove("is-open");
      if (shortcutsWrapper) shortcutsWrapper.classList.toggle("is-open");
      return;
    }

    // 3. Directory Tree Drawer: Ctrl + ,
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === "," || e.code === "Comma")) {
      e.preventDefault();
      toggleTree();
      return;
    }

    // 4. Universal Search & Commands: Ctrl + / (or / alone)
    if (((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === "/" || e.code === "Slash")) || (e.key === "/" && noModifiers)) {
      e.preventDefault();
      focusNavSearchBar();
      return;
    }

    // 5. Gemini AI Doubt Solver: Ctrl + .
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === "." || e.code === "Period")) {
      e.preventDefault();
      toggleDoubtSolver();
      return;
    }

    // 6. In-Page Edit & Annotation Panel: Ctrl + ;
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === ";" || e.code === "Semicolon")) {
      e.preventDefault();
      toggleAnnotationPanel();
      return;
    }

    // 7. Full Screen (Toggle Top Bar): Ctrl + '
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === "'" || e.code === "Quote")) {
      e.preventDefault();
      toggleTopBar();
      return;
    }

    // 7b. Toggle Background Grid: Ctrl + [
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === "[" || e.code === "BracketLeft")) {
      e.preventDefault();
      const gridTog = document.getElementById("grid-toggle");
      const isNoGrid = document.body.classList.toggle("no-grid");
      if (gridTog) gridTog.checked = !isNoGrid;
      try {
        localStorage.setItem("indexindia_grid", isNoGrid ? "off" : "on");
      } catch (e) {}
      return;
    }

    // 7c. Toggle Dark/Light Mode Theme: Ctrl + ]
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === "]" || e.code === "BracketRight")) {
      e.preventDefault();
      const contrastTog = document.getElementById("contrast-toggle");
      const isDark = document.body.classList.contains("theme-dark");
      if (isDark) {
        document.body.classList.remove("theme-dark");
        document.body.classList.add("theme-light");
        if (contrastTog) contrastTog.checked = false;
        localStorage.setItem("indexindia_theme", "light");
      } else {
        document.body.classList.add("theme-dark");
        document.body.classList.remove("theme-light");
        if (contrastTog) contrastTog.checked = true;
        localStorage.setItem("indexindia_theme", "dark");
      }
      return;
    }

    // 8. Alt + Arrow Up / Down: Move strictly between Main Chapters & Comments
    if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      closeTreeExplicitly();

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

        if (e.key === "ArrowDown") {
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

      // Fallback for pages without in-page tree
      const mainSections = Array.from(document.querySelectorAll(".chapter-anchor, #sec-chapter-1, #sec-chapter-2, #forum-section, #sec-footer, .institutional-forum-section"));
      if (mainSections.length > 0) {
        const scrollPos = window.scrollY + 120;
        let currentIdx = 0;
        for (let i = 0; i < mainSections.length; i++) {
          if (mainSections[i].offsetTop <= scrollPos) {
            currentIdx = i;
          }
        }
        const direction = e.key === "ArrowDown" ? 1 : -1;
        const targetIdx = Math.max(0, Math.min(mainSections.length - 1, currentIdx + direction));
        mainSections[targetIdx].scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    // 9. Ctrl + Arrow Up / Down: Move through ALL chapter-sections, subsections, comments, and footer
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      closeTreeExplicitly();

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

      const allSections = Array.from(document.querySelectorAll(".page-directory-section, .doc-section, .story-node-section, .institutional-forum-section, #sec-footer"));
      if (allSections.length > 0) {
        const scrollPos = window.scrollY + 120;
        let currentIdx = 0;
        for (let i = 0; i < allSections.length; i++) {
          if (allSections[i].offsetTop <= scrollPos) {
            currentIdx = i;
          }
        }
        const direction = e.key === "ArrowDown" ? 1 : -1;
        const targetIdx = Math.max(0, Math.min(allSections.length - 1, currentIdx + direction));
        allSections[targetIdx].scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    // 10. Normal Arrow Up / Down: Scroll Page Smoothly (strictly alone, no modifiers)
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && noModifiers) {
      e.preventDefault();
      startSmoothScroll(e.key === "ArrowDown" ? 1 : -1, false);
      return;
    }

    // 10a. Shift + Arrow Up / Down: Fast Scroll Page Smoothly (accelerated cruising speed, zero flicker)
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      startSmoothScroll(e.key === "ArrowDown" ? 1 : -1, true);
      return;
    }

    // 11. Enter inside open tree navigates to current node (strictly alone)
    if (e.key === "Enter" && noModifiers && isTreeCurrentlyOpen()) {
      e.preventDefault();
      navigateToNode(currentSubIndex);
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

    // 11. Escape closes all open panels, menus, directory tree, Doubt Solver, Command Palette, Finder, and Annotation Palette
    if (e.key === "Escape" && noModifiers) {
      if (shortcutsWrapper) shortcutsWrapper.classList.remove("is-open");
      if (accountWrapper) accountWrapper.classList.remove("is-open");
      if (settingsWrapper) settingsWrapper.classList.remove("is-open");
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
    } else if (e.key === "Shift" && isArrowHeld) {
      isFastScroll = false;
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

  // Create UI elements
  const doubtPill = document.createElement("div");
  doubtPill.className = "doubt-selection-pill";
  doubtPill.id = "doubt-selection-pill";
  doubtPill.title = "Doubt Solver (Shortcut: M)";
  doubtPill.innerHTML = `
    <span class="doubt-pill-spark">💬</span>
    <span>Ask Doubt</span>
    <span class="doubt-pill-key">M</span>
  `;
  document.body.appendChild(doubtPill);

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
        <button type="button" class="doubt-tile-close" id="doubt-tile-close" title="Close (Esc)">&times;</button>
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


  openDoubtSolver = function(contextOverride) {
    try {
      if (window.innerWidth <= 1280 && typeof closeTreeExplicitly === "function") {
        closeTreeExplicitly();
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
      if (doubtNavBtn) doubtNavBtn.classList.add("is-active");

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
      document.body.classList.remove("doubt-solver-open");
      if (doubtTile) doubtTile.classList.remove("is-open");
      if (doubtPill) doubtPill.classList.remove("is-visible");
      if (doubtTextInput) doubtTextInput.blur();

      const doubtNavBtn = document.getElementById("doubt-nav-btn");
      if (doubtNavBtn) doubtNavBtn.classList.remove("is-active");

    } catch (err) {
      console.error("[DoubtSolver] closeDoubtSolver error:", err);
    }
  };

  toggleDoubtSolver = function() {
    if (doubtTile && doubtTile.classList.contains("is-open")) {
      closeDoubtSolver();
    } else {
      const hoveredSec = lastHoveredSection || document.querySelector(".doc-section:hover, .doc-subsection:hover, .doc-subsubsection:hover, .story-node-section:hover, .page-directory-section:hover, .forum-directory-section:hover, .institutional-forum-section:hover, .content-area > section:hover");
      if (hoveredSec) {
        setDoubtContext(getSectionContext(hoveredSec));
      } else {
        // User pressed 'M' without hover selecting a section: send pre-given page summary context!
        setDoubtContext(getPageSummaryContext());
      }
      openDoubtSolver(currentDoubtContext);
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
    if (!doubtTile.classList.contains("is-open")) return;
    if (!doubtTile.contains(e.target) && !doubtPill.contains(e.target) && !e.target.closest(".section-doubt-btn") && !e.target.closest("#doubt-nav-btn")) {
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

  function closeDoubtOnCursorLeave(delay = 220) {
    if (doubtLeaveTimer) clearTimeout(doubtLeaveTimer);
    doubtLeaveTimer = setTimeout(() => {
      const isTileHovered = doubtTile && doubtTile.matches(":hover");
      if (!isTileHovered && doubtTile && doubtTile.classList.contains("is-open")) {
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

    // If Doubt Solver is open: close when cursor leaves panel to the left
    if (doubtTile && doubtTile.classList.contains("is-open")) {
      if (clientX < winWidth - 440) {
        closeDoubtOnCursorLeave(200);
      }
    }
  }, { passive: true });

  // When user enters doubtTile, cancel leave timer; when user cursor leaves doubtTile, close it!
  if (doubtTile) {
    doubtTile.addEventListener("mouseenter", () => {
      if (doubtLeaveTimer) clearTimeout(doubtLeaveTimer);
    });
    doubtTile.addEventListener("mouseleave", () => {
      closeDoubtOnCursorLeave(200);
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
    origToggleDoubt();
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
          <input type="text" class="nav-search-input" id="nav-search-input" placeholder="search (/)" autocomplete="off" spellcheck="false" />
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
      localStorage.setItem("indexindia_theme", "dark");
      if (contrastToggle) contrastToggle.checked = true;
    } else {
      document.body.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
      localStorage.setItem("indexindia_theme", "light");
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
    localStorage.setItem("indexindia_font_size", size);
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
    localStorage.setItem("indexindia_font_style", style);
    if (fontStyleLabel) fontStyleLabel.textContent = style === "reading" ? "Reading" : "Typewriter";
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
        title: "Switch Guide <=> Index Suite",
        subtitle: "Switch between Guide matrix and Index terminal",
        badge: "Tab",
        keywords: "switch suite guide index tab toggle landing shortcut binding",
        action: () => {
          window.location.href = targetOtherSuiteUrl;
        }
      },
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
        title: "Shortcuts Cheatsheet",
        subtitle: "Open the complete institutional keyboard shortcuts reference",
        badge: "Ctrl + \\",
        keywords: "shortcuts panel cheatsheet keyboard reference help backslash shortcut binding",
        action: () => {
          if (shortcutsWrapper) {
            shortcutsWrapper.classList.toggle("is-open");
          }
        }
      },
      {
        category: "KEYBOARD SHORTCUTS",
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
      },
      {
        category: "NAVIGATION & PANELS",
        icon: "🔀",
        title: isIndexSuite ? "Switch to Guide Suite (Matrix)" : "Switch to Index Suite (Market Hub)",
        subtitle: isIndexSuite ? "Jump to Guide Landing" : "Jump to Index Landing",
        badge: "Tab",
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
      { title: "Guide Landing — Chapter 1: Entities & Chapter 2: Payment Gateways", file: "guide.html", sub: "Definitive statutory index of all business structures & payment gateway directory", kw: "guide entities registration matrix payment gateways razorpay cosmofeed stripe aggregator neobanking" },
      { title: "Index Landing — Sovereign Governance Index Terminal", file: "index.html", sub: "Indian equity markets overview & forensic governance index", kw: "index market marketcap valuation multiples forensic" },
      { title: "Statutory & Privacy Dossier — Legal Disclosures & AI Telemetry", file: "statutory-privacy.html", sub: "SEBI non-advisory mandate, Gemini AI telemetry, privacy policy", kw: "statutory privacy legal sebi disclaimer gemini terms compliance refund cosmofeed razorpay" },
      { title: "Sovereign Clearance & Memberships", file: "membership.html", sub: "Institutional access tiers & forensic models", kw: "membership pricing upgrade clearance access plan" }
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

  focusNavSearchBar = function() {
    if (navSearchInput) {
      navSearchInput.dataset.originalPlaceholder = navSearchInput.placeholder || "search (/)";
      navSearchInput.placeholder = "";
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
      if (!navSearchInput.value) {
        navSearchInput.placeholder = navSearchInput.dataset.originalPlaceholder || "search (/)";
      }
      navSearchInput.blur();
    }
    paletteCurrentItems = [];
    paletteSelectedIndex = -1;
  };

  window.focusNavSearchBar = focusNavSearchBar;
  window.closeNavSearchResults = closeNavSearchResults;

  if (navSearchInput) {
    navSearchInput.addEventListener("focus", () => {
      navSearchInput.dataset.originalPlaceholder = navSearchInput.placeholder || "search (/)";
      navSearchInput.placeholder = "";
      if (navSearchInput.value.length > 0) {
        navSearchInput.select();
        renderSearchResults(navSearchInput.value);
      }
    });

    navSearchInput.addEventListener("click", () => {
      navSearchInput.dataset.originalPlaceholder = navSearchInput.placeholder || "search (/)";
      navSearchInput.placeholder = "";
      if (navSearchInput.value.length > 0) {
        navSearchInput.select();
        renderSearchResults(navSearchInput.value);
      }
    });

    navSearchInput.addEventListener("mouseup", (e) => {
      if (navSearchInput.value.length > 0) {
        if (navSearchInput.selectionStart === navSearchInput.selectionEnd) {
          navSearchInput.select();
        }
      }
    });

    navSearchInput.addEventListener("blur", () => {
      if (!navSearchInput.value) {
        navSearchInput.placeholder = navSearchInput.dataset.originalPlaceholder || "search (/)";
      }
    });

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

  let annotationState = {
    isOpen: false,
    activeTool: "sketch", // select | sketch | highlight | textbox | stickynote | sticker | eraser
    activeColor: "#FFE066",
    activeSize: 4,
    currentFocusIdx: -1,
    activeSticker: { type: "tag", variant: "danger", label: "⚠️ HIGH RISK" },
    selectedElementIds: new Set()
  };

  function hexToRgba(hex, alpha) {
    let c = (hex || "#FFE066").replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Check if click/pointer event is within top-nav or side navigation drawers
  function isInsideNavigationPanels(e) {
    const topNav = document.getElementById("top-nav");
    const topNavH = (topNav && !document.body.classList.contains("top-bar-hidden")) ? topNav.offsetHeight : 0;
    if (e.clientY < topNavH) return true;
    if (
      e.target.closest(".top-nav") ||
      e.target.closest(".rail-navigator") ||
      e.target.closest("#doubt-solver-tile") ||
      e.target.closest(".edit-annotation-bar") ||
      e.target.closest(".sticker-popover") ||
      e.target.closest(".nav-restore-float-btn")
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
        <button type="button" class="palette-tool-btn" data-tool="select" title="Select & Move (V)">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
          </span>
          <span class="palette-tool-label">Select</span>
        </button>
        <button type="button" class="palette-tool-btn active" data-tool="sketch" title="Pencil Sketch (P)">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </span>
          <span class="palette-tool-label">Sketch</span>
        </button>
        <button type="button" class="palette-tool-btn" data-tool="highlight" title="Text Highlight (H)">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 7-4.5-4.5-8.5 8.5 4.5 4.5L22 7z"/></svg>
          </span>
          <span class="palette-tool-label">Highlight</span>
        </button>
        <button type="button" class="palette-tool-btn" data-tool="textbox" title="Free Drag-to-Select Text Box (T)">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          </span>
          <span class="palette-tool-label">Box</span>
        </button>
        <button type="button" class="palette-tool-btn" data-tool="stickynote" title="Click-to-Place & Drag Sticky Note (S)">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><polyline points="15 3 21 9 15 9 15 3"/></svg>
          </span>
          <span class="palette-tool-label">Note</span>
        </button>
        <button type="button" class="palette-tool-btn" data-tool="sticker" id="palette-btn-sticker" title="Stickers Palette (K)">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </span>
          <span class="palette-tool-label">Stickers</span>
        </button>
        <button type="button" class="palette-tool-btn" data-tool="eraser" title="Eraser / Click item to delete (X)">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/></svg>
          </span>
          <span class="palette-tool-label">Eraser</span>
        </button>
      </div>
      <span class="palette-sep">|</span>
      <div class="palette-color-group">
        <button type="button" class="palette-color-btn active" data-color="#FFE066" style="--swatch-color: #FFE066;" title="Sun Yellow"></button>
        <button type="button" class="palette-color-btn" data-color="#FF6B35" style="--swatch-color: #FF6B35;" title="Accent Orange"></button>
        <button type="button" class="palette-color-btn" data-color="#38BDF8" style="--swatch-color: #38BDF8;" title="Cyan Blue"></button>
        <button type="button" class="palette-color-btn" data-color="#34D399" style="--swatch-color: #34D399;" title="Mint Green"></button>
      </div>
      <span class="palette-sep">|</span>
      <div class="palette-size-group">
        <button type="button" class="palette-size-btn" data-size="2" title="Fine Stroke (2px)">
          <span class="palette-size-dot" style="width: 3px; height: 3px;"></span>
        </button>
        <button type="button" class="palette-size-btn active" data-size="4" title="Standard Stroke (4px)">
          <span class="palette-size-dot" style="width: 6px; height: 6px;"></span>
        </button>
        <button type="button" class="palette-size-btn" data-size="8" title="Bold Stroke (8px)">
          <span class="palette-size-dot" style="width: 10px; height: 10px;"></span>
        </button>
        <button type="button" class="palette-size-btn" data-size="14" title="Marker Stroke (14px)">
          <span class="palette-size-dot" style="width: 14px; height: 14px;"></span>
        </button>
      </div>
      <span class="palette-sep">|</span>
      <div class="palette-nav-group">
        <span class="palette-counter font-mono" id="annotation-counter">0 notes</span>
        <div class="finder-nav-btns">
          <button type="button" class="finder-btn" id="annotation-btn-prev" title="Previous Annotation (▲)">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </button>
          <button type="button" class="finder-btn" id="annotation-btn-next" title="Next Annotation (▼)">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>
      </div>
      <span class="palette-sep">|</span>
      <div class="palette-action-group">
        <button type="button" class="palette-btn" id="annotation-btn-undo" title="Undo Last Annotation (Ctrl+Z)">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </span>
          <span class="palette-tool-label">Undo</span>
        </button>
        <button type="button" class="palette-btn" id="annotation-btn-clear" title="Clear All Annotations">
          <span class="palette-tool-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </span>
          <span class="palette-tool-label">Clear</span>
        </button>
      </div>
      <button type="button" class="palette-close-btn" id="annotation-btn-close" title="Close Palette (Esc)">
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
  const annotationBtnUndo = editAnnotationBar.querySelector("#annotation-btn-undo");
  const annotationBtnClear = editAnnotationBar.querySelector("#annotation-btn-clear");
  const annotationBtnClose = editAnnotationBar.querySelector("#annotation-btn-close");
  const paletteDragHandle = editAnnotationBar.querySelector(".palette-drag-handle");
  const btnQuickHighlight = selectionTooltip?.querySelector("#btn-quick-highlight");
  const btnCloseStickers = stickerPopover.querySelector("#btn-close-stickers");

  function syncAnnotationCanvasDimensions() {
    if (!annotationSvgCanvas) return;
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
    if (annotationState.activeTool === "eraser") {
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
      <div class="textbox-header">
        <span class="textbox-handle">:: TEXT BOX</span>
        <button type="button" class="textbox-delete-btn" title="Delete Box">&times;</button>
      </div>
      <div class="textbox-content" contenteditable="true" placeholder="Type text here...">${tb.text || ""}</div>
      <div class="textbox-resize-handle" title="Drag to resize"></div>
    `;

    const header = el.querySelector(".textbox-header");
    const content = el.querySelector(".textbox-content");
    const delBtn = el.querySelector(".textbox-delete-btn");
    const resizeHandle = el.querySelector(".textbox-resize-handle");

    // Draggable header & select-mode move
    let isMoving = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    function startBoxDrag(e) {
      if (e.target === delBtn || e.target === resizeHandle) return;
      isMoving = true;
      startX = e.pageX;
      startY = e.pageY;
      initialLeft = parseInt(el.style.left, 10) || tb.left;
      initialTop = parseInt(el.style.top, 10) || tb.top;
      header.setPointerCapture(e.pointerId);
      e.stopPropagation();
    }

    header.addEventListener("pointerdown", startBoxDrag);

    header.addEventListener("pointermove", (e) => {
      if (!isMoving) return;
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      const newL = Math.max(0, initialLeft + dx);
      const newT = Math.max(0, initialTop + dy);
      el.style.left = `${newL}px`;
      el.style.top = `${newT}px`;
    });

    const stopMove = () => {
      if (!isMoving) return;
      isMoving = false;
      tb.left = parseInt(el.style.left, 10);
      tb.top = parseInt(el.style.top, 10);
      saveAnnotations();
    };
    header.addEventListener("pointerup", stopMove);
    header.addEventListener("pointercancel", stopMove);

    // Explicit interactive resize handle
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
        resizeHandle.setPointerCapture(e.pointerId);
      });
      resizeHandle.addEventListener("pointermove", (e) => {
        if (!isResizing) return;
        const newW = Math.max(120, rStartW + (e.pageX - rStartX));
        const newH = Math.max(60, rStartH + (e.pageY - rStartY));
        el.style.width = `${newW}px`;
        el.style.height = `${newH}px`;
      });
      const stopResize = () => {
        if (!isResizing) return;
        isResizing = false;
        tb.width = el.offsetWidth;
        tb.height = el.offsetHeight;
        saveAnnotations();
      };
      resizeHandle.addEventListener("pointerup", stopResize);
      resizeHandle.addEventListener("pointercancel", stopResize);
    }

    // Save text changes
    content.addEventListener("input", () => {
      tb.text = content.innerText;
      saveAnnotations();
    });

    // Detect resizing via mouseup
    el.addEventListener("mouseup", () => {
      const curW = el.offsetWidth;
      const curH = el.offsetHeight;
      if (curW !== tb.width || curH !== tb.height) {
        tb.width = curW;
        tb.height = curH;
        saveAnnotations();
      }
    });

    // Delete box
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteAnnotationItem(tb.id, "textbox");
    });

    el.addEventListener("click", (e) => {
      if (annotationState.activeTool === "eraser") {
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
      <button type="button" class="sticky-note-pin" title="Click to edit, Drag to move location">📌</button>
      <div class="sticky-note-card">
        <div class="sticky-note-header">
          <span class="sticky-note-time">NOTE • ${sn.time || "IST"} (DRAG)</span>
          <button type="button" class="sticky-note-del-btn" title="Delete Note">&times;</button>
        </div>
        <textarea class="sticky-note-textarea" placeholder="Write sticky note here...">${sn.text || ""}</textarea>
        <div class="sticky-note-resize-handle" title="Drag to resize"></div>
        <span class="sticky-note-click-hint">Hover to expand • Click to edit • Drag to move</span>
      </div>
    `;

    const pin = el.querySelector(".sticky-note-pin");
    const card = el.querySelector(".sticky-note-card");
    const header = el.querySelector(".sticky-note-header");
    const textarea = el.querySelector(".sticky-note-textarea");
    const delBtn = el.querySelector(".sticky-note-del-btn");
    const snResize = el.querySelector(".sticky-note-resize-handle");

    // Load saved or remembered width and height
    const rememberedW = sn.width || parseInt(localStorage.getItem("indexindia_stickynote_width"), 10) || 260;
    const rememberedH = sn.height || parseInt(localStorage.getItem("indexindia_stickynote_height"), 10) || 160;
    if (card) {
      card.style.width = `${rememberedW}px`;
      card.style.height = `${rememberedH}px`;
    }

    // Sticky Note Resizing Logic
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
        snResize.setPointerCapture(e.pointerId);
      });
      snResize.addEventListener("pointermove", (e) => {
        if (!isResizingSn) return;
        const newW = Math.max(200, snStartW + (e.pageX - snStartX));
        const newH = Math.max(120, snStartH + (e.pageY - snStartY));
        card.style.width = `${newW}px`;
        card.style.height = `${newH}px`;
      });
      const stopSnResize = () => {
        if (!isResizingSn) return;
        isResizingSn = false;
        sn.width = card.offsetWidth;
        sn.height = card.offsetHeight;
        try {
          localStorage.setItem("indexindia_stickynote_width", sn.width);
          localStorage.setItem("indexindia_stickynote_height", sn.height);
        } catch (e) {}
        saveAnnotations();
      };
      snResize.addEventListener("pointerup", stopSnResize);
      snResize.addEventListener("pointercancel", stopSnResize);

      card.addEventListener("mouseup", () => {
        const curW = card.offsetWidth;
        const curH = card.offsetHeight;
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

    function setupDrag(dragTarget) {
      let isDragging = false;
      let startX = 0, startY = 0, initLeft = 0, initTop = 0;
      let hasMoved = false;

      dragTarget.addEventListener("pointerdown", (e) => {
        if (e.target === delBtn || e.target === snResize) return;
        isDragging = true;
        hasMoved = false;
        startX = e.pageX;
        startY = e.pageY;
        initLeft = parseInt(el.style.left, 10) || sn.left;
        initTop = parseInt(el.style.top, 10) || sn.top;
        dragTarget.setPointerCapture(e.pointerId);
        e.stopPropagation();
      });

      dragTarget.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        const dx = e.pageX - startX;
        const dy = e.pageY - startY;
        if (Math.hypot(dx, dy) > 4) {
          hasMoved = true;
          el.style.left = `${Math.max(0, initLeft + dx)}px`;
          el.style.top = `${Math.max(0, initTop + dy)}px`;
        }
      });

      const stopDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        if (hasMoved) {
          sn.left = parseInt(el.style.left, 10);
          sn.top = parseInt(el.style.top, 10);
          saveAnnotations();
        } else if (dragTarget === pin) {
          if (annotationState.activeTool === "eraser") {
            deleteAnnotationItem(sn.id, "stickynote");
            return;
          }
          el.classList.toggle("is-editing");
          if (el.classList.contains("is-editing")) {
            textarea.focus();
          }
        }
      };

      dragTarget.addEventListener("pointerup", stopDrag);
      dragTarget.addEventListener("pointercancel", stopDrag);
    }

    setupDrag(pin);
    setupDrag(header);

    textarea.addEventListener("input", () => {
      sn.text = textarea.value;
      saveAnnotations();
    });

    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteAnnotationItem(sn.id, "stickynote");
    });

    el.addEventListener("click", (e) => {
      if (annotationState.activeTool === "eraser") {
        e.stopPropagation();
        deleteAnnotationItem(sn.id, "stickynote");
      }
    });

    annotationHtmlElements.appendChild(el);
    return el;
  }

  // Close open sticky notes editing mode when clicking outside
  document.addEventListener("mousedown", (e) => {
    if (!e.target.closest(".user-annotation-stickynote")) {
      document.querySelectorAll(".user-annotation-stickynote.is-editing").forEach((n) => {
        n.classList.remove("is-editing");
      });
    }
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
      isDragging = true;
      hasMoved = false;
      startX = e.pageX;
      startY = e.pageY;
      initLeft = parseInt(el.style.left, 10) || stk.left;
      initTop = parseInt(el.style.top, 10) || stk.top;
      el.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });

    el.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      if (Math.hypot(dx, dy) > 4) {
        hasMoved = true;
        el.style.left = `${Math.max(0, initLeft + dx)}px`;
        el.style.top = `${Math.max(0, initTop + dy)}px`;
      }
    });

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      if (hasMoved) {
        stk.left = parseInt(el.style.left, 10);
        stk.top = parseInt(el.style.top, 10);
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
      if (annotationState.activeTool === "eraser") {
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
    if (e.target.closest(".user-annotation-textbox") || e.target.closest(".user-annotation-stickynote") || e.target.closest(".user-annotation-sticker")) {
      return;
    }
    isBoxDragging = true;
    boxStartX = e.pageX;
    boxStartY = e.pageY;
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
    const minX = Math.min(boxStartX, e.pageX);
    const minY = Math.min(boxStartY, e.pageY);
    const w = Math.abs(e.pageX - boxStartX);
    const h = Math.abs(e.pageY - boxStartY);
    annotationDragPreview.style.left = `${minX}px`;
    annotationDragPreview.style.top = `${minY}px`;
    annotationDragPreview.style.width = `${w}px`;
    annotationDragPreview.style.height = `${h}px`;
  });

  document.addEventListener("pointerup", (e) => {
    if (!isBoxDragging) return;
    isBoxDragging = false;
    if (annotationDragPreview) {
      annotationDragPreview.style.display = "none";
    }
    let minX = Math.min(boxStartX, e.pageX);
    let minY = Math.min(boxStartY, e.pageY);
    let w = Math.abs(e.pageX - boxStartX);
    let h = Math.abs(e.pageY - boxStartY);

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
      initialText = sel.toString().trim();
      sel.removeAllRanges();
    } else {
      if (w < 20 && h < 20) {
        w = 200;
        h = 80;
      } else {
        w = Math.max(120, w);
        h = Math.max(60, h);
      }
    }

    const newTb = {
      id: `tb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      left: Math.round(minX),
      top: Math.round(minY),
      width: Math.round(w),
      height: Math.round(h),
      text: initialText,
      color: annotationState.activeColor
    };
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
    if (e.target.closest(".user-annotation-textbox") || e.target.closest(".user-annotation-stickynote") || e.target.closest(".user-annotation-sticker")) {
      return;
    }
    const posX = Math.max(10, e.pageX - 14);
    const posY = Math.max(10, e.pageY - 14);
    const timeStr = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const newNote = {
      id: `sn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      left: Math.round(posX),
      top: Math.round(posY),
      text: "",
      color: annotationState.activeColor,
      time: timeStr
    };
    annotationsData.stickynotes.push(newNote);
    saveAnnotations();
    const noteEl = renderStickyNoteDOM(newNote);
    updateAnnotationCounter();
    if (noteEl) {
      noteEl.classList.add("is-editing");
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
    if (e.target.closest(".user-annotation-textbox") || e.target.closest(".user-annotation-stickynote") || e.target.closest(".user-annotation-sticker")) {
      return;
    }
    const posX = Math.max(10, e.pageX - 20);
    const posY = Math.max(10, e.pageY - 12);
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

  function pointsToSvgPath(pts) {
    if (!pts || pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y + 0.1}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      d += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
    }
    d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
    return d;
  }

  if (annotationSvgCanvas) {
    annotationSvgCanvas.addEventListener("pointerdown", (e) => {
      if (!annotationState.isOpen || annotationState.activeTool !== "sketch") return;
      if (isInsideNavigationPanels(e)) return;
      if (e.button !== 0) return;
      isDrawing = true;
      annotationSvgCanvas.setPointerCapture(e.pointerId);
      currentStrokePoints = [{ x: e.pageX, y: e.pageY }];

      currentPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      currentPathEl.setAttribute("class", "annotation-stroke");
      currentPathEl.setAttribute("data-id", `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      currentPathEl.setAttribute("stroke", annotationState.activeColor);
      currentPathEl.setAttribute("stroke-width", annotationState.activeSize);
      currentPathEl.setAttribute("fill", "none");
      currentPathEl.setAttribute("stroke-linecap", "round");
      currentPathEl.setAttribute("stroke-linejoin", "round");
      currentPathEl.setAttribute("d", pointsToSvgPath(currentStrokePoints));
      annotationSvgCanvas.appendChild(currentPathEl);
      e.preventDefault();
    });

    annotationSvgCanvas.addEventListener("pointermove", (e) => {
      if (!isDrawing || !currentPathEl) return;
      currentStrokePoints.push({ x: e.pageX, y: e.pageY });
      currentPathEl.setAttribute("d", pointsToSvgPath(currentStrokePoints));
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
          d: currentPathEl.getAttribute("d"),
          y: currentStrokePoints[0].y,
          points: currentStrokePoints.map((p) => ({ x: p.x, y: p.y }))
        };
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
        deleteAnnotationItem(strokeObj.id, "stroke");
        return;
      }
      if (annotationState.activeTool !== "select") return;
      isMovingStroke = true;
      startX = e.pageX;
      startY = e.pageY;
      initialPoints = (strokeObj.points || []).map((p) => ({ x: p.x, y: p.y }));
      pathEl.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });

    pathEl.addEventListener("pointermove", (e) => {
      if (!isMovingStroke || !initialPoints.length) return;
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      const updatedPts = initialPoints.map((p) => ({ x: p.x + dx, y: p.y + dy }));
      strokeObj.points = updatedPts;
      const newD = pointsToSvgPath(updatedPts);
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
    const selectedText = sel.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    const id = `hl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const color = annotationState.activeColor;

    try {
      const mark = document.createElement("mark");
      mark.className = "user-annotation-highlight";
      mark.setAttribute("data-id", id);
      mark.style.backgroundColor = hexToRgba(color, 0.35);
      mark.style.borderBottom = `2px solid ${color}`;
      range.surroundContents(mark);

      const markY = mark.offsetTop || (mark.getBoundingClientRect().top + window.scrollY);
      annotationsData.highlights.push({
        id,
        text: selectedText,
        color,
        y: Math.round(markY)
      });
      mark.addEventListener("click", (e) => {
        if (annotationState.activeTool === "eraser") {
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
      if (e.target.closest(".edit-annotation-bar") || e.target.closest("#selection-highlight-tooltip")) return;
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
        mark.style.backgroundColor = hexToRgba(color, 0.35);
        mark.style.borderBottom = `2px solid ${color}`;
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

  function renderAllSavedAnnotations() {
    // 1. Strokes
    if (annotationSvgCanvas) {
      annotationSvgCanvas.innerHTML = "";
      annotationsData.strokes.forEach((stroke) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "annotation-stroke");
        path.setAttribute("data-id", stroke.id);
        path.setAttribute("d", stroke.d);
        path.setAttribute("stroke", stroke.color || "#FFE066");
        path.setAttribute("stroke-width", stroke.size || 4);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        setupStrokeMoveListener(path, stroke);
        annotationSvgCanvas.appendChild(path);
      });
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

  // Undo button
  if (annotationBtnUndo) {
    annotationBtnUndo.addEventListener("click", () => {
      const allItems = [
        ...annotationsData.strokes.map((s) => ({ ...s, type: "stroke" })),
        ...annotationsData.textboxes.map((tb) => ({ ...tb, type: "textbox" })),
        ...annotationsData.stickynotes.map((sn) => ({ ...sn, type: "stickynote" })),
        ...(annotationsData.stickers || []).map((stk) => ({ ...stk, type: "sticker" })),
        ...annotationsData.highlights.map((hl) => ({ ...hl, type: "highlight" }))
      ];
      if (allItems.length === 0) return;
      allItems.sort((a, b) => (b.id || "").localeCompare(a.id || ""));
      const latest = allItems[0];
      deleteAnnotationItem(latest.id, latest.type);
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
      paletteDragHandle.setPointerCapture(e.pointerId);
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
    };
    paletteDragHandle.addEventListener("pointerup", stopPaletteDrag);
    paletteDragHandle.addEventListener("pointercancel", stopPaletteDrag);
  }

  // --- 13. TOOL / COLOR / SIZE BUTTON EVENT BINDINGS ---
  function setAnnotationTool(tool) {
    annotationState.activeTool = tool;
    editAnnotationBar.querySelectorAll(".palette-tool-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-tool") === tool);
    });
    document.body.classList.toggle("annotation-mode-sketch", tool === "sketch");
    document.body.classList.toggle("annotation-mode-eraser", tool === "eraser");
    document.body.classList.toggle("annotation-mode-select", tool === "select");
    if (annotationSvgCanvas) {
      annotationSvgCanvas.classList.toggle("is-drawing", tool === "sketch");
    }

    if (tool === "sticker") {
      const rect = editAnnotationBar.getBoundingClientRect();
      stickerPopover.style.left = `${rect.left + rect.width / 2}px`;
      stickerPopover.style.top = `${rect.bottom + 8}px`;
      stickerPopover.classList.toggle("is-open");
    } else {
      stickerPopover.classList.remove("is-open");
    }
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
    });
  });

  editAnnotationBar.querySelectorAll(".palette-size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const size = parseInt(btn.getAttribute("data-size"), 10) || 4;
      annotationState.activeSize = size;
      editAnnotationBar.querySelectorAll(".palette-size-btn").forEach((b) => {
        b.classList.toggle("active", parseInt(b.getAttribute("data-size"), 10) === size);
      });
    });
  });

  // --- 14. OPEN / CLOSE PALETTE CONTROLS ---
  openAnnotationPanel = function() {
    annotationState.isOpen = true;
    document.body.classList.add("is-annotating");
    if (editAnnotationBar) editAnnotationBar.classList.add("is-visible");
    if (editNavBtn) editNavBtn.classList.add("is-active");
    syncAnnotationCanvasDimensions();
    setAnnotationTool(annotationState.activeTool || "sketch");
    updateAnnotationCounter();
  };

  closeAnnotationPanel = function() {
    annotationState.isOpen = false;
    document.body.classList.remove("is-annotating");
    if (editAnnotationBar) editAnnotationBar.classList.remove("is-visible");
    if (editNavBtn) editNavBtn.classList.remove("is-active");
    if (stickerPopover) stickerPopover.classList.remove("is-open");
    document.body.classList.remove("annotation-mode-sketch", "annotation-mode-eraser", "annotation-mode-select");
    if (annotationSvgCanvas) annotationSvgCanvas.classList.remove("is-drawing");
    if (selectionTooltip) selectionTooltip.style.display = "none";
    document.querySelectorAll(".user-annotation-stickynote.is-editing").forEach((n) => n.classList.remove("is-editing"));
    document.querySelectorAll(".annotation-selected").forEach((el) => el.classList.remove("annotation-selected"));
  };

  toggleAnnotationPanel = function() {
    if (annotationState.isOpen) {
      closeAnnotationPanel();
    } else {
      openAnnotationPanel();
    }
  };

  isAnnotationPanelActive = function() {
    return Boolean(annotationState.isOpen);
  };

  if (editNavBtn) {
    editNavBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleAnnotationPanel();
    });
  }

  if (annotationBtnClose) {
    annotationBtnClose.addEventListener("click", (e) => {
      e.preventDefault();
      closeAnnotationPanel();
    });
  }

  // Keyboard shortcuts when annotation panel is open (V: select, P: sketch, H: highlight, T: textbox, S: note, K: sticker, X: eraser)
  document.addEventListener("keydown", (e) => {
    if (!isAnnotationPanelActive()) return;
    if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
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
    } else if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "z") {
      e.preventDefault();
      if (annotationBtnUndo) annotationBtnUndo.click();
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
    }
  });

  // Global Eraser Action (Click or Drag over any stroke, highlight, box, note, or sticker)
  function handleEraserAction(e) {
    if (!annotationState.isOpen || annotationState.activeTool !== "eraser") return;
    const target = e.target;
    if (target) {
      const stroke = target.closest(".annotation-stroke");
      if (stroke) {
        deleteAnnotationItem(stroke.getAttribute("data-id"), "stroke");
        return;
      }
      const tb = target.closest(".user-annotation-textbox");
      if (tb) {
        deleteAnnotationItem(tb.getAttribute("data-id"), "textbox");
        return;
      }
      const sn = target.closest(".user-annotation-stickynote");
      if (sn) {
        deleteAnnotationItem(sn.getAttribute("data-id"), "stickynote");
        return;
      }
      const stk = target.closest(".user-annotation-sticker");
      if (stk) {
        deleteAnnotationItem(stk.getAttribute("data-id"), "sticker");
        return;
      }
      const hl = target.closest("mark.user-annotation-highlight");
      if (hl) {
        deleteAnnotationItem(hl.getAttribute("data-id"), "highlight");
        return;
      }
    }

    // Proximity check on SVG strokes
    const x = e.pageX;
    const y = e.pageY;
    if (annotationsData.strokes && annotationsData.strokes.length > 0) {
      for (const stroke of annotationsData.strokes) {
        if (stroke.points && stroke.points.some((p) => Math.hypot(p.x - x, p.y - y) <= 22)) {
          deleteAnnotationItem(stroke.id, "stroke");
          return;
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

    // Find all sections on the page, excluding comment box & forum containers
    const sections = Array.from(document.querySelectorAll(
      ".doc-section, .doc-subsection, .doc-subsubsection, .story-node-section, .page-directory-section, .content-area > section"
    )).filter((sec) => {
      if (sec.id === "forum-section" || sec.closest("#forum-section, .institutional-forum-section, .forum-directory-section, .compact-forum-composer, .forum-messages-container")) {
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

        // 2. Permanent Gemini Icon Button (right - top most side)
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

        cluster.appendChild(dotBtn);
        cluster.appendChild(geminiBtn);
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
});
