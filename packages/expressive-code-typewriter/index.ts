import { definePlugin } from "@expressive-code/core";
import { h } from "@expressive-code/core/hast";
import type { Element } from "@expressive-code/core/hast";
import { resolveOptions, resolveBlockOptions, parseLines, generateBlockId } from "./src/utils";
import type { PluginTypewriterOptions } from "./src/types";
export type { PluginTypewriterOptions } from "./src/types";

/**
 * CSS styles for the terminal typing effect
 */
const BASE_STYLES = `
  /* Container for typed code block */
  .ec-typed {
    position: relative;
  }

  /* Each line wrapper */
  .ec-typed .ec-line {
    --ec-typed-chars: 0;
  }

  /* Apply clip-path to the .code element inside, where actual text lives */
  .ec-typed .ec-line .code {
    clip-path: inset(0 calc(100% - var(--ec-typed-chars) * 1ch) 0 0);
  }

  /* Line is fully visible after animation */
  .ec-typed .ec-line.ec-typed-line--complete .code {
    clip-path: none;
  }

  /* Cursor element - positioned absolutely in container */
  .ec-typed-cursor {
    position: absolute;
    top: 0;
    left: 0;
    display: inline-block;
    animation: ec-typed-blink 0.7s step-end infinite;
    color: inherit;
    font-weight: normal;
    font-family: inherit;
    font-size: inherit;
    user-select: none;
    pointer-events: none;
    z-index: 2;
    transition: none;
  }

  .ec-typed-cursor--hidden {
    visibility: hidden;
  }

  .ec-typed-cursor--typing {
    animation: none;
  }

  @keyframes ec-typed-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* Click-to-start overlay */
  .ec-typed-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    z-index: 10;
    transition: opacity 0.2s ease;
    border-radius: inherit;
  }

  .ec-typed-overlay--hidden {
    opacity: 0;
    pointer-events: none;
  }

  .ec-typed-play-icon {
    width: 48px;
    height: 48px;
    fill: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  /* Replay button */
  .ec-typed-replay {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    font-size: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: inherit;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease, background-color 0.2s ease;
    z-index: 5;
  }

  .ec-typed--complete .ec-typed-replay {
    opacity: 1;
  }

  .ec-typed-replay:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .ec-typed-replay:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .ec-typed-replay-icon {
    width: 12px;
    height: 12px;
    fill: currentColor;
  }

  /* Reduced motion: show all content immediately */
  @media (prefers-reduced-motion: reduce) {
    .ec-typed .ec-line {
      clip-path: none !important;
    }
    .ec-typed-cursor {
      animation: none;
      display: none;
    }
    .ec-typed-overlay {
      display: none !important;
    }
    .ec-typed-replay {
      display: none !important;
    }
  }

  /* Light theme adjustments */
  :root[data-theme="light"] .ec-typed-overlay,
  html.light .ec-typed-overlay,
  [data-color-scheme="light"] .ec-typed-overlay {
    background: rgba(0, 0, 0, 0.25);
  }

  :root[data-theme="light"] .ec-typed-replay,
  html.light .ec-typed-replay,
  [data-color-scheme="light"] .ec-typed-replay {
    background: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.15);
  }

  :root[data-theme="light"] .ec-typed-replay:hover,
  html.light .ec-typed-replay:hover,
  [data-color-scheme="light"] .ec-typed-replay:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  /* Loop mode: hide replay button */
  .ec-typed[data-loop="true"] .ec-typed-replay {
    display: none;
  }

  /* Step mode styles */
  .ec-typed[data-step-mode="true"] {
    cursor: pointer;
  }

  .ec-typed[data-step-mode="true"]:focus {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .ec-typed[data-step-mode="true"]:focus:not(:focus-visible) {
    outline: none;
  }

  .ec-typed--paused {
    cursor: pointer;
  }
`;

/**
 * Client-side JavaScript for animation
 */
const CLIENT_SCRIPT = `
(function() {
  'use strict';

  if (window.ecTypedInit) return;
  window.ecTypedInit = true;

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function shouldAnimate() {
    return !prefersReducedMotion.matches;
  }

  class TypedBlock {
    constructor(container) {
      this.container = container;
      this.id = container.id;
      this.trigger = container.dataset.trigger || 'visible';
      this.speed = parseInt(container.dataset.speed, 10) || 50;
      this.lineDelay = parseInt(container.dataset.lineDelay, 10) || 300;
      this.startDelay = parseInt(container.dataset.startDelay, 10) || 500;
      this.cursorChar = container.dataset.cursorChar || '\\u2588';

      // New feature options
      this.outputDelay = parseInt(container.dataset.outputDelay, 10) || 0;
      this.loop = container.dataset.loop === 'true';
      this.loopDelay = parseInt(container.dataset.loopDelay, 10) || 1000;
      this.typingVariance = parseFloat(container.dataset.typingVariance) || 0;
      this.stepMode = container.dataset.stepMode === 'true';

      try {
        this.linesData = JSON.parse(container.dataset.lines || '[]');
      } catch (e) {
        this.linesData = [];
      }

      this.lineElements = container.querySelectorAll('.ec-line');
      this.cursor = container.querySelector('.ec-typed-cursor');
      this.overlay = container.querySelector('.ec-typed-overlay');
      this.replayBtn = container.querySelector('.ec-typed-replay');

      this.isAnimating = false;
      this.isComplete = false;
      this.animationFrame = null;
      this.startTime = null;
      this.timings = [];
      this.loopTimeout = null;

      // Step mode state
      this.isPaused = false;
      this.currentStepLine = 0;
      this.pauseTime = 0;

      // Performance: cache element references and rects
      this._lineCache = [];
      this._containerRect = null;
      this._fontApplied = false;

      this.init();
    }

    init() {
      // If reduced motion, show everything immediately
      if (!shouldAnimate()) {
        this.showAll();
        return;
      }

      // If no lines data or no line elements, show everything
      if (this.linesData.length === 0 || this.lineElements.length === 0) {
        this.showAll();
        return;
      }

      // Hide all content initially
      this.resetAnimation();

      // Set up trigger
      switch (this.trigger) {
        case 'load':
          this.start();
          break;
        case 'click':
          this.setupClickTrigger();
          break;
        case 'visible':
        default:
          this.setupVisibilityTrigger();
          break;
      }

      // Set up replay button
      if (this.replayBtn) {
        this.replayBtn.addEventListener('click', () => this.replay());
      }

      // Set up step mode
      if (this.stepMode) {
        this.setupStepMode();
      }
    }

    setupClickTrigger() {
      if (!this.overlay) return;

      const startHandler = (e) => {
        e.preventDefault();
        this.overlay.classList.add('ec-typed-overlay--hidden');
        this.start();
      };

      this.overlay.addEventListener('click', startHandler);
      this.overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startHandler(e);
        }
      });
    }

    setupVisibilityTrigger() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isAnimating && !this.isComplete) {
            observer.disconnect();
            this.start();
          }
        });
      }, { threshold: 0.1 });

      observer.observe(this.container);
    }

    start() {
      if (this.isAnimating) return;

      this.isAnimating = true;
      this.isComplete = false;
      this.container.classList.remove('ec-typed--complete');

      // Calculate timings for each line
      this.timings = this.calculateTimings();

      // Performance: cache element references and bounding rects
      this.cacheLineData();

      // Show cursor as typing
      if (this.cursor) {
        this.cursor.classList.add('ec-typed-cursor--typing');
        this.cursor.classList.remove('ec-typed-cursor--hidden');

        // Position cursor at start of first input line
        const firstInputTiming = this.timings.find(t => t.isInput);
        if (firstInputTiming) {
          this.positionCursor(firstInputTiming.index, 0);
        }
      }

      // Start animation after initial delay
      setTimeout(() => {
        this.startTime = performance.now();
        this.animate();
      }, this.startDelay);
    }

    cacheLineData() {
      // Cache container rect
      this._containerRect = this.container.getBoundingClientRect();

      // Cache per-line data
      this._lineCache = [];
      this.lineElements.forEach((lineEl, index) => {
        const codeEl = lineEl.querySelector('.code') || lineEl;
        const firstSpan = codeEl.querySelector('span');
        const textEl = firstSpan || codeEl;
        const textRect = textEl.getBoundingClientRect();
        const textStyle = window.getComputedStyle(textEl);

        // Calculate character width using a test element
        const charWidth = this.getCharWidth(textEl, textStyle);
        const lineHeight = parseFloat(textStyle.lineHeight) || parseFloat(textStyle.fontSize) * 1.2;

        // Calculate the left position where text starts (relative to container)
        const leftPos = textRect.left - this._containerRect.left;

        this._lineCache[index] = {
          codeEl,
          firstSpan,
          textEl,
          textRect,
          fontFamily: textStyle.fontFamily,
          fontSize: textStyle.fontSize,
          lineHeight: textStyle.lineHeight,
          lineHeightPx: lineHeight,
          charWidth: charWidth,
          left: leftPos,
          top: textRect.top - this._containerRect.top
        };
      });
    }

    getCharWidth(textEl, textStyle) {
      // Create a temporary element to measure character width
      // Use multiple characters for more accurate measurement
      const measureEl = document.createElement('span');
      measureEl.style.fontFamily = textStyle.fontFamily;
      measureEl.style.fontSize = textStyle.fontSize;
      measureEl.style.visibility = 'hidden';
      measureEl.style.position = 'absolute';
      measureEl.style.whiteSpace = 'pre';
      measureEl.textContent = 'XXXXXXXXXX'; // Measure 10 characters for accuracy
      document.body.appendChild(measureEl);
      const charWidth = measureEl.getBoundingClientRect().width / 10;
      document.body.removeChild(measureEl);
      return charWidth || 8; // Fallback to 8px if measurement fails
    }

    calculateTimings() {
      const timings = [];
      let currentTime = 0;

      this.linesData.forEach((line, index) => {
        if (line.isInput) {
          // Input lines: type character by character
          let duration = line.charCount * this.speed;
          const timing = {
            index,
            startTime: currentTime,
            duration,
            charCount: line.charCount,
            isInput: true,
            charTimings: null,
          };

          // Pre-compute per-character timings when variance > 0
          if (this.typingVariance > 0 && line.charCount > 0) {
            timing.charTimings = [];
            let charTime = 0;
            for (let i = 0; i < line.charCount; i++) {
              // Use squared random for more dramatic variation
              // This creates more noticeable speed differences
              const random = Math.random() * 2 - 1;
              const weightedRandom = random * Math.abs(random);

              // Amplify the variance range (2x effect for more noticeable variation)
              let variance = 1 + weightedRandom * this.typingVariance * 2;

              // Occasionally add a "thinking pause" for realism (~5% chance)
              // These pauses are 2-4x the normal duration
              if (Math.random() < 0.05) {
                variance *= 2 + Math.random() * 2;
              }

              const charDuration = this.speed * Math.max(0.1, variance);
              timing.charTimings.push({ start: charTime, duration: charDuration });
              charTime += charDuration;
            }
            timing.duration = charTime;
            duration = charTime;
          }

          timings.push(timing);
          currentTime += duration + this.lineDelay;
        } else {
          // Output lines: add outputDelay before appearing
          currentTime += this.outputDelay;
          timings.push({
            index,
            startTime: currentTime,
            duration: 0,
            charCount: line.charCount,
            isInput: false,
            charTimings: null,
          });
          currentTime += this.lineDelay;
        }
      });

      this.totalDuration = currentTime;
      return timings;
    }

    animate() {
      // Handle step mode pause
      if (this.isPaused) return;

      const elapsed = performance.now() - this.startTime;

      let allComplete = true;
      let currentTypingLine = -1;
      let currentVisibleChars = 0;
      let lineJustCompleted = -1;

      for (const timing of this.timings) {
        // Performance: skip already completed lines
        if (timing.completed) continue;

        const lineEl = this.lineElements[timing.index];
        if (!lineEl) continue;

        if (elapsed < timing.startTime) {
          // Line hasn't started yet
          allComplete = false;
        } else if (elapsed >= timing.startTime + timing.duration) {
          // Line is complete - mark it so we skip it next frame
          timing.completed = true;
          lineEl.classList.add('ec-typed-line--complete');

          // Position cursor at end of completed line (if it's an input line)
          if (timing.isInput) {
            lineEl.style.setProperty('--ec-typed-chars', timing.charCount.toString());
            currentTypingLine = timing.index;
            currentVisibleChars = timing.charCount;
          }

          // Track if this line just completed (for step mode)
          if (this.stepMode) {
            lineJustCompleted = timing.index;
          }
        } else {
          // Line is currently animating
          allComplete = false;
          if (timing.isInput) {
            const lineElapsed = elapsed - timing.startTime;

            // Use per-character timings if available (typing variance)
            let visibleChars;
            if (timing.charTimings) {
              visibleChars = 0;
              for (const ct of timing.charTimings) {
                if (lineElapsed >= ct.start + ct.duration) {
                  visibleChars++;
                } else {
                  break;
                }
              }
            } else {
              visibleChars = Math.floor(lineElapsed / this.speed);
            }

            // Clamp to prevent cursor from moving past the end
            visibleChars = Math.min(visibleChars, timing.charCount);

            // Use character-based clip position instead of percentage
            lineEl.style.setProperty('--ec-typed-chars', visibleChars.toString());
            currentTypingLine = timing.index;
            currentVisibleChars = visibleChars;
          } else {
            // Output lines appear instantly once started
            timing.completed = true;
            lineEl.classList.add('ec-typed-line--complete');
          }
        }
      }

      // Position cursor on current typing line
      if (currentTypingLine >= 0 && this.cursor) {
        // Refresh container rect to handle scroll changes
        this._containerRect = this.container.getBoundingClientRect();
        this.positionCursor(currentTypingLine, currentVisibleChars);
      }

      // Handle step mode: pause after line completes (except last line)
      if (this.stepMode && lineJustCompleted >= 0 && lineJustCompleted < this.timings.length - 1) {
        this.pauseForStep(elapsed);
        return;
      }

      if (allComplete) {
        this.complete();
      } else {
        this.animationFrame = requestAnimationFrame(() => this.animate());
      }
    }

    positionCursor(lineIndex, visibleChars) {
      if (!this.cursor) return;

      // Use cached data for performance
      const cache = this._lineCache[lineIndex];
      if (!cache) return;

      // Apply font styles once
      if (!this._fontApplied) {
        this.cursor.style.fontFamily = cache.fontFamily;
        this.cursor.style.fontSize = cache.fontSize;
        this.cursor.style.lineHeight = cache.lineHeight;
        this._fontApplied = true;
      }

      // Use Range API to get the actual rendered position of the character
      // This correctly handles wrapped text
      const position = this.getCharacterPosition(cache.codeEl, visibleChars);

      // Add 1ch offset so cursor appears after the last typed character
      const cursorOffset = cache.charWidth || 8;

      if (position) {
        this.cursor.style.top = (position.top - this._containerRect.top) + 'px';
        this.cursor.style.left = (position.left - this._containerRect.left + cursorOffset) + 'px';
        this.cursor.style.transform = 'none';
      } else {
        // Fallback to simple calculation if Range API fails
        this.cursor.style.top = cache.top + 'px';
        this.cursor.style.left = cache.left + 'px';
        this.cursor.style.transform = 'translateX(' + (visibleChars + 1) + 'ch)';
      }
    }

    getCharacterPosition(codeEl, charIndex) {
      try {
        // Walk through text nodes to find the character at charIndex
        const walker = document.createTreeWalker(
          codeEl,
          NodeFilter.SHOW_TEXT,
          null
        );

        let currentIndex = 0;
        let node;

        while ((node = walker.nextNode())) {
          const nodeLength = node.textContent.length;

          if (currentIndex + nodeLength >= charIndex) {
            // The character is in this text node
            const offsetInNode = charIndex - currentIndex;
            const range = document.createRange();

            // Set range to the position after the character
            range.setStart(node, Math.min(offsetInNode, nodeLength));
            range.setEnd(node, Math.min(offsetInNode, nodeLength));

            const rect = range.getBoundingClientRect();
            range.detach();

            return { top: rect.top, left: rect.left };
          }

          currentIndex += nodeLength;
        }

        // If we've exhausted all nodes, position at the end of the last node
        if (currentIndex > 0) {
          const lastNode = walker.currentNode || codeEl.lastChild;
          if (lastNode && lastNode.nodeType === Node.TEXT_NODE) {
            const range = document.createRange();
            range.setStart(lastNode, lastNode.textContent.length);
            range.setEnd(lastNode, lastNode.textContent.length);
            const rect = range.getBoundingClientRect();
            range.detach();
            return { top: rect.top, left: rect.left };
          }
        }

        return null;
      } catch (e) {
        return null;
      }
    }

    complete() {
      this.isAnimating = false;
      this.isComplete = true;
      this.container.classList.add('ec-typed--complete');

      // Stop cursor blinking and hide
      if (this.cursor) {
        this.cursor.classList.remove('ec-typed-cursor--typing');
        this.cursor.classList.add('ec-typed-cursor--hidden');
      }

      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      // Handle loop mode
      if (this.loop && shouldAnimate()) {
        this.loopTimeout = setTimeout(() => {
          this.replay();
        }, this.loopDelay);
      }
    }

    resetAnimation() {
      // Hide all lines
      this.lineElements.forEach((el) => {
        el.style.setProperty('--ec-typed-chars', '0');
        el.classList.remove('ec-typed-line--complete');
      });

      // Reset timing completion flags
      this.timings.forEach(timing => {
        timing.completed = false;
      });

      this.container.classList.remove('ec-typed--complete');
      this.isComplete = false;
      this.isAnimating = false;
      this._fontApplied = false;

      if (this.cursor) {
        this.cursor.classList.remove('ec-typed-cursor--hidden');
        this.cursor.classList.remove('ec-typed-cursor--typing');
      }
    }

    replay() {
      if (this.isAnimating) return;

      // Cancel any pending loop
      if (this.loopTimeout) {
        clearTimeout(this.loopTimeout);
        this.loopTimeout = null;
      }

      // Cancel any pending animation
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      // Reset step mode state
      this.isPaused = false;
      this.currentStepLine = 0;
      this.container.classList.remove('ec-typed--paused');

      this.resetAnimation();
      this.start();
    }

    setupStepMode() {
      const handleStep = (e) => {
        if (!this.isPaused) return;

        // Check if it's a valid trigger
        const isClick = e.type === 'click';
        const isValidKey = e.type === 'keydown' &&
          ['Enter', ' ', 'ArrowRight', 'ArrowDown'].includes(e.key);

        if (isClick || isValidKey) {
          if (e.type === 'keydown') e.preventDefault();
          this.continueStep();
        }
      };

      this.container.addEventListener('click', handleStep);
      this.container.addEventListener('keydown', handleStep);
      this.container.setAttribute('tabindex', '0');
    }

    pauseForStep(elapsed) {
      this.isPaused = true;
      this.pauseTime = elapsed;
      this.container.classList.add('ec-typed--paused');

      // Show cursor blinking to indicate waiting
      if (this.cursor) {
        this.cursor.classList.remove('ec-typed-cursor--typing');
      }
    }

    continueStep() {
      if (!this.isPaused) return;

      this.isPaused = false;
      this.container.classList.remove('ec-typed--paused');

      // Show cursor as typing again
      if (this.cursor) {
        this.cursor.classList.add('ec-typed-cursor--typing');
      }

      // Adjust start time to account for pause
      const pauseDuration = performance.now() - this.startTime - this.pauseTime;
      this.startTime += pauseDuration;

      // Continue animation
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    showAll() {
      // For reduced motion: show everything immediately
      this.lineElements.forEach((el) => {
        el.classList.add('ec-typed-line--complete');
      });

      if (this.cursor) {
        this.cursor.classList.add('ec-typed-cursor--hidden');
      }

      if (this.overlay) {
        this.overlay.classList.add('ec-typed-overlay--hidden');
      }

      this.container.classList.add('ec-typed--complete');
      this.isComplete = true;
    }
  }

  function initTypedBlocks() {
    document.querySelectorAll('.ec-typed').forEach(container => {
      if (container.dataset.initialized) return;
      container.dataset.initialized = 'true';
      new TypedBlock(container);
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypedBlocks);
  } else {
    initTypedBlocks();
  }

  // Handle dynamically added content
  const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  const debouncedInit = debounce(initTypedBlocks, 100);
  new MutationObserver(debouncedInit).observe(document.body, {
    childList: true,
    subtree: true
  });

  // Handle reduced motion preference changes
  prefersReducedMotion.addEventListener('change', () => {
    document.querySelectorAll('.ec-typed').forEach(container => {
      if (prefersReducedMotion.matches && !container.classList.contains('ec-typed--complete')) {
        // Show all content when reduced motion is enabled
        const lineElements = container.querySelectorAll('.ec-line');
        lineElements.forEach(el => {
          el.classList.add('ec-typed-line--complete');
        });
        container.classList.add('ec-typed--complete');
      }
    });
  });
})();
`;

/**
 * Recursively find the <code> element inside the figure
 */
function findCodeElement(node: Element): Element | null {
  if (node.type === "element" && node.tagName === "code") {
    return node;
  }
  if (node.children) {
    for (const child of node.children) {
      if (child.type === "element") {
        const found = findCodeElement(child as Element);
        if (found) return found;
      }
    }
  }
  return null;
}

/**
 * Find all .ec-line elements in the code block
 */
function findLineElements(node: Element): Element[] {
  const lines: Element[] = [];

  function traverse(el: Element) {
    if (el.type === "element") {
      const classes = el.properties?.className;
      const classArray = Array.isArray(classes) ? classes : [classes];
      if (classArray.some((c) => c === "ec-line")) {
        lines.push(el);
      }
      if (el.children) {
        for (const child of el.children) {
          if (child.type === "element") {
            traverse(child as Element);
          }
        }
      }
    }
  }

  traverse(node);
  return lines;
}

/**
 * Create SVG play icon for click overlay
 */
function createPlayIcon() {
  return h(
    "svg",
    {
      class: "ec-typed-play-icon",
      viewBox: "0 0 24 24",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": "true",
    },
    [h("path", { d: "M8 5v14l11-7z" })]
  );
}

/**
 * Create SVG replay icon
 */
function createReplayIcon() {
  return h(
    "svg",
    {
      class: "ec-typed-replay-icon",
      viewBox: "0 0 24 24",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": "true",
    },
    [
      h("path", {
        d: "M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z",
      }),
    ]
  );
}

/**
 * Typewriter Plugin
 *
 * Animates terminal/shell code blocks to simulate real-time typing.
 * Commands appear character-by-character with a blinking cursor,
 * then output appears instantly.
 */
export function pluginTypewriter(options: PluginTypewriterOptions = {}) {
  const config = resolveOptions(options);

  return definePlugin({
    name: "Terminal Typing Effect",
    baseStyles: BASE_STYLES,
    hooks: {
      preprocessMetadata: ({ codeBlock }) => {
        // Enable word wrap for typed blocks to keep cursor within bounds
        // Check if 'typed' is in the meta string
        const hasTyped = codeBlock.meta.match(/\btyped\b/);
        if (hasTyped) {
          // Set wrap prop directly if not explicitly disabled
          const wrapValue = codeBlock.metaOptions.getBoolean('wrap');
          if (wrapValue === undefined) {
            // User hasn't specified wrap, so enable it by default for typed blocks
            codeBlock.props.wrap = true;
            // Use preserveIndent=false for terminal-style output (wrapped lines at column 1)
            codeBlock.props.preserveIndent = false;
          }
        }
      },
      postprocessRenderedBlock: async (context) => {
        // Check if block has "typed" meta option
        const blockOptions = resolveBlockOptions(context.codeBlock.metaOptions, config);
        if (!blockOptions) return;

        // Generate unique block ID
        const blockId = generateBlockId();

        // Parse lines from code
        const code = context.codeBlock.code;
        const lines = parseLines(code, blockOptions.prompt);

        // Access the block AST
        const ast = context.renderData.blockAst;

        // Find the figure element (after plugin-frames runs)
        let figureElement: Element | null = null;
        let isAstTheFigure = false;

        if (ast.type === "element" && ast.tagName === "figure") {
          figureElement = ast;
          isAstTheFigure = true;
        } else if (ast.children) {
          const found = ast.children.find(
            (child) => child.type === "element" && child.tagName === "figure"
          );
          if (found && found.type === "element") {
            figureElement = found as Element;
          }
        }

        if (!figureElement || figureElement.type !== "element") return;

        // Find the <code> element
        const codeElement = findCodeElement(figureElement);
        if (!codeElement) return;

        // Find all .line elements
        const lineElements = findLineElements(codeElement);

        // Add data attributes to each line for animation
        lineElements.forEach((lineEl, index) => {
          if (index < lines.length) {
            const lineData = lines[index];
            if (!lineEl.properties) lineEl.properties = {};
            lineEl.properties["data-line-index"] = index.toString();
            lineEl.properties["data-char-count"] = lineData.charCount.toString();
            lineEl.properties["data-is-input"] = lineData.isInput.toString();
            lineEl.properties.style = "--ec-typed-chars: 0;";
          }
        });

        // Create cursor element (will be positioned absolutely in container)
        const cursor = h(
          "span",
          {
            class: "ec-typed-cursor",
            "aria-hidden": "true",
          },
          [config.cursorChar]
        );

        // Create click overlay (for trigger="click" mode)
        const playIcon = createPlayIcon();
        const overlay = h(
          "div",
          {
            class:
              blockOptions.trigger === "click"
                ? "ec-typed-overlay"
                : "ec-typed-overlay ec-typed-overlay--hidden",
            role: "button",
            tabindex: "0",
            "aria-label": "Click to start typing animation",
          },
          [playIcon]
        );

        // Create replay button
        const replayIcon = createReplayIcon();
        const replayButton = config.showReplayButton
          ? h(
              "button",
              {
                class: "ec-typed-replay",
                type: "button",
                "aria-label": config.replayButtonText,
              },
              [replayIcon, config.replayButtonText]
            )
          : null;

        // Prepare lines data for JS (minimal info needed for animation)
        const linesData = lines.map((l) => ({
          isInput: l.isInput,
          charCount: l.charCount,
        }));

        // Wrap figure in typed container
        const typedContainer = h(
          "div",
          {
            class: "ec-typed",
            id: blockId,
            "data-trigger": blockOptions.trigger,
            "data-speed": blockOptions.speed.toString(),
            "data-line-delay": blockOptions.lineDelay.toString(),
            "data-start-delay": blockOptions.startDelay.toString(),
            "data-cursor-char": config.cursorChar,
            "data-lines": JSON.stringify(linesData),
            "data-output-delay": blockOptions.outputDelay.toString(),
            "data-loop": blockOptions.loop.toString(),
            "data-loop-delay": blockOptions.loopDelay.toString(),
            "data-typing-variance": blockOptions.typingVariance.toString(),
            "data-step-mode": blockOptions.stepMode.toString(),
            role: "region",
            "aria-label": "Animated terminal code block",
          },
          [figureElement, overlay, cursor, ...(replayButton ? [replayButton] : [])]
        );

        // Replace in AST
        if (isAstTheFigure) {
          context.renderData.blockAst = typedContainer;
        } else if (ast.children) {
          const figureIndex = ast.children.indexOf(figureElement);
          if (figureIndex !== -1) {
            ast.children[figureIndex] = typedContainer;
          }
        }
      },
    },
    jsModules: [CLIENT_SCRIPT],
  });
}

export default pluginTypewriter;
