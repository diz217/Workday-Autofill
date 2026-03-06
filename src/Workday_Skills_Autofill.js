// ==UserScript==
// @name         Workday Skills Autofill (stable)
// @namespace    https://example.local/
// @version      0.2
// @description  Autofill Workday skill entries from a predefined list
// @match        *://*.myworkdayjobs.com/*
// @match        *://*.myworkday.com/*
// @match        *://*.workday.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

const SKILLS = [
    "<fill the skills>"
    ]
  const USE_LAST_OPTION = [
    "<fill the skills not in the workday auto-fills>"
  ];
  const TYPE_DELAY_MS = 100;
  const BETWEEN_SKILLS_MS = 1200;

  let STOP = false;
  let capturedInput = null;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function log(...args) {
    console.log("[WD-Autofill]", ...args);
  }

  function setStatus(text) {
    const el = document.getElementById("wd-status");
    if (el) el.textContent = text;
  }

  function isUsableInput(el) {
    if (!el) return false;
    if (el.tagName === "INPUT" && (el.type === "text" || el.type === "search" || el.type === "")) return true;
    if (el.getAttribute("role") === "combobox") return true;
    if (el.getAttribute("contenteditable") === "true") return true;
    return false;
  }

  function getElementHint(el) {
    if (!el) return "none";
    return [
      el.tagName,
      el.id ? `#${el.id}` : "",
      el.className ? `.${String(el.className).replace(/\s+/g, ".")}` : "",
      el.getAttribute("aria-label") ? `[aria-label="${el.getAttribute("aria-label")}"]` : "",
      el.getAttribute("placeholder") ? `[placeholder="${el.getAttribute("placeholder")}"]` : ""
    ].join("");
  }

  function dispatchInputEvents(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setElementValue(el, value) {
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      if (nativeSetter) {
        nativeSetter.call(el, value);
      } else {
        el.value = value;
      }
      dispatchInputEvents(el);
      return;
    }

    if (el.getAttribute("contenteditable") === "true") {
      el.textContent = value;
      dispatchInputEvents(el);
      return;
    }

    try {
      el.value = value;
      dispatchInputEvents(el);
    } catch (e) {
      log("setElementValue failed:", e);
    }
  }

  async function clearAndType(el, text) {
    el.focus();
    await sleep(100);

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      setElementValue(el, "");
      await sleep(50);

      for (const ch of text) {
        const current = el.value || "";
        setElementValue(el, current + ch);
        await sleep(TYPE_DELAY_MS);
      }
      return;
    }

    if (el.getAttribute("contenteditable") === "true") {
      el.textContent = "";
      dispatchInputEvents(el);
      await sleep(50);

      let current = "";
      for (const ch of text) {
        current += ch;
        el.textContent = current;
        dispatchInputEvents(el);
        await sleep(TYPE_DELAY_MS);
      }
      return;
    }

    setElementValue(el, text);
  }

  function pressKey(el, key) {
  const keyCodeMap = {
    Enter: 13,
    ArrowDown: 40,
    Tab: 9
  };

  const keyCode = keyCodeMap[key] || 0;

  const eventInit = {
    key,
    code: key,
    keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true
  };

  el.dispatchEvent(new KeyboardEvent("keydown", eventInit));
  el.dispatchEvent(new KeyboardEvent("keypress", eventInit));
  el.dispatchEvent(new KeyboardEvent("keyup", eventInit));
}
function findDropdownOptions() {
  const found = [...document.querySelectorAll('[data-automation-id="menuItem"]')].filter(el => {
    const txt = (el.innerText || "").trim();
    const rect = el.getBoundingClientRect();
    const visible = txt && rect.width > 0 && rect.height > 0 && !el.closest('#wd-skill-autofill-panel');
    const hasCheckbox = !!el.querySelector('input[type="checkbox"]');
    return visible && hasCheckbox;
  });
  return found;
}
async function waitForDropdownOptions(timeoutMs = 2500, pollMs = 120) {
  const start = Date.now();
  let lastSignature = "";
  let lastCount = -1;
  let stableHits = 0;
  let lastOptions = [];

  while (Date.now() - start < timeoutMs) {
    const options = findDropdownOptions();

    // create a signature for each skill to make sure it is current
    const signature = options
      .map(x => (x.innerText || "").trim())
      .join(" || ");

    if (options.length > 0 && signature === lastSignature) {
      stableHits += 1;
      lastOptions = options;

      if (stableHits >= 2) {
        return lastOptions;
      }
    } else {
      stableHits = 0;
      lastSignature = signature;
      lastOptions = options;
    }
    await sleep(pollMs);
  }

  return lastOptions;
}
async function chooseSuggestionOrCommit(el, skill) {
  pressKey(el, "Enter");
  await sleep(1500);

  let options = await waitForDropdownOptions(3000, 120);

  if (!options.length) {
    pressKey(el, "Enter");
    await sleep(800);

    options = await waitForDropdownOptions(2000, 120);

    if (!options.length) {
      return "double-enter-fallback-no-options";
    }
  }

  console.log("[MODEL] skill =", skill);
  console.log("[MODEL] options.length =", options.length);

  let candidates = options;

  console.log("[MODEL] candidates.length =", candidates.length);
  console.log("[MODEL] candidates text =", candidates.map(x => (x.innerText || "").trim()));

  if (!candidates.length) {
    return "no-candidates";
  }

  let index = 0;
  if (USE_LAST_OPTION.includes(skill) && candidates.length > 1) {
    index = candidates.length - 1;
  }

  const target = candidates[index];

  console.log("[MODEL] chosen candidate index =", index);
  console.log("[MODEL] chosen candidate text =", target ? (target.innerText || "").trim() : null);

  if (!target) {
    return "no-target";
  }
  target.scrollIntoView({ block: "center" });
  await sleep(150);

  const checkboxInput = target.querySelector('input[type="checkbox"]');
  console.log("[MODEL] has checkboxInput =", !!checkboxInput);

  if (!checkboxInput) {
    return "no-checkbox-input";
  }

  checkboxInput.click();
  await sleep(900);

  console.log("[MODEL] after checkbox click options.length =", findDropdownOptions().length);

  return (USE_LAST_OPTION.includes(skill) && candidates.length > 1)
    ? "clicked-last-candidate"
    : "clicked-first-candidate";
}
  function installPanel() {
    if (document.getElementById("wd-skill-autofill-panel")) return;

    const panel = document.createElement("div");
    panel.id = "wd-skill-autofill-panel";
    panel.style.cssText = `
      position: fixed;
      right: 14px;
      bottom: 14px;
      z-index: 2147483647;
      background: rgba(20,20,20,0.94);
      color: #fff;
      padding: 12px;
      border-radius: 12px;
      width: 280px;
      font-family: system-ui, sans-serif;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    `;

    panel.innerHTML = `
      <div style="font-weight:700; margin-bottom:8px;">Workday Skills Autofill</div>
      <div style="font-size:12px; line-height:1.4; opacity:0.9; margin-bottom:8px;">
        To use, hit the skill fill-in。<br>
        And then hit Fill, or use <b>Ctrl+Shift+S</b>。
      </div>
      <button id="wd-fill-btn" style="
        width:100%; padding:10px; border:none; border-radius:10px;
        background:#4f8cff; color:#fff; font-weight:700; cursor:pointer;
      ">Fill Skills</button>
      <button id="wd-stop-btn" style="
        width:100%; margin-top:8px; padding:8px; border-radius:10px;
        border:1px solid rgba(255,255,255,0.25); background:transparent; color:#fff;
        cursor:pointer;
      ">Stop</button>
      <div id="wd-captured" style="margin-top:10px; font-size:12px; opacity:0.9;">Captured input: none</div>
      <div id="wd-status" style="margin-top:6px; font-size:12px; opacity:0.9;">Ready.</div>
    `;

    document.body.appendChild(panel);

    document.getElementById("wd-fill-btn").addEventListener("click", fillSkills);
    document.getElementById("wd-stop-btn").addEventListener("click", () => {
      STOP = true;
      setStatus("Stopping...");
    });
  }

  function updateCapturedUI() {
    const el = document.getElementById("wd-captured");
    if (!el) return;
    el.textContent = `Captured input: ${capturedInput ? getElementHint(capturedInput) : "none"}`;
  }

  function tryCaptureFromEventTarget(target) {
    let el = target;
    while (el && el !== document.body) {
      if (isUsableInput(el)) {
        capturedInput = el;
        updateCapturedUI();
        setStatus("Input captured.");
        log("Captured input:", el, getElementHint(el));
        return;
      }
      el = el.parentElement;
    }
  }

  document.addEventListener("focusin", (e) => {
    tryCaptureFromEventTarget(e.target);
  }, true);

  document.addEventListener("click", (e) => {
    tryCaptureFromEventTarget(e.target);
  }, true);

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      fillSkills();
    }
  });

  async function fillSkills() {
    STOP = false;

    if (!capturedInput || !document.contains(capturedInput)) {
      setStatus("没抓到输入框。先点击 skills 输入框一次。");
      return;
    }

    setStatus("Starting...");
    log("Using captured input:", getElementHint(capturedInput));

    for (let i = 0; i < SKILLS.length; i++) {
      if (STOP) {
        setStatus("⏹️ Stopped.");
        return;
      }

      const skill = SKILLS[i];
      setStatus(`(${i + 1}/${SKILLS.length}) ${skill}`);

      await clearAndType(capturedInput, skill);
      const action = await chooseSuggestionOrCommit(capturedInput,skill);
        log(`Skill "${skill}" -> ${action}`);

        if (action === "no-option-found") {
            setStatus(` No option found for: ${skill}`);
            STOP = true;
            return;
        }

        await sleep(BETWEEN_SKILLS_MS);
    }

    setStatus(" Done.");
  }

  setTimeout(() => {
    installPanel();
    updateCapturedUI();
    log("Panel installed.");
  }, 1200);
})();
