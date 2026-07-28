/**
 * This Week at Home — SPA navigation & interactions
 */
(function () {
  "use strict";

  const SCREENS = ["home", "problem", "checkin", "decision", "journey", "household"];
  const CONCEPTS = {
    doorway: {
      title: "Doorway sensor",
      meta: "64% of households leaned this way so far · quieter nights without asking Mum to wear anything",
    },
    wearable: {
      title: "Wearable alert",
      meta: "36% lean · better if Mum already leaves more than one room at night",
    },
  };

  const app = document.getElementById("app");
  const topbar = document.getElementById("topbar");
  const screens = Array.from(document.querySelectorAll("[data-screen]"));
  const checkinForm = document.getElementById("checkin-form");
  const checkinThanks = document.getElementById("checkin-thanks");
  const noteField = document.getElementById("checkin-note");
  const noteCount = document.getElementById("note-count");
  const householdCount = document.getElementById("household-count");
  const updatedCount = document.getElementById("updated-count");
  const conceptGrid = document.getElementById("concept-grid");
  const decisionResult = document.getElementById("decision-result");
  const decisionChoice = document.getElementById("decision-choice");
  const decisionMeta = document.getElementById("decision-meta");

  let householdTotal = 327;
  let checkinSubmitted = false;

  function syncCheckinView() {
    if (!checkinForm || !checkinThanks) return;
    if (checkinSubmitted) {
      checkinForm.hidden = true;
      checkinThanks.hidden = false;
    } else {
      checkinForm.hidden = false;
      checkinThanks.hidden = true;
    }
  }

  function showScreen(name) {
    if (!SCREENS.includes(name)) return;

    screens.forEach((screen) => {
      const match = screen.getAttribute("data-screen") === name;
      screen.classList.toggle("is-active", match);
      if (match) {
        screen.removeAttribute("hidden");
      } else {
        screen.setAttribute("hidden", "");
      }
    });

    if (topbar) {
      if (name === "home") {
        topbar.setAttribute("hidden", "");
      } else {
        topbar.removeAttribute("hidden");
      }
    }

    if (name === "checkin") {
      syncCheckinView();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState({ screen: name }, "", "#" + name);

    if (app) {
      app.dataset.current = name;
    }
  }

  function navigateFromHash() {
    const hash = (location.hash || "#home").slice(1);
    showScreen(SCREENS.includes(hash) ? hash : "home");
  }

  document.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-nav]");
    if (!nav) return;
    event.preventDefault();
    showScreen(nav.getAttribute("data-nav"));
  });

  window.addEventListener("hashchange", navigateFromHash);

  if (noteField && noteCount) {
    noteField.addEventListener("input", () => {
      noteCount.textContent = String(noteField.value.length);
    });
  }

  if (checkinForm) {
    checkinForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!checkinSubmitted) {
        checkinSubmitted = true;
        householdTotal += 1;
        if (householdCount) {
          householdCount.textContent = String(householdTotal);
          householdCount.classList.remove("is-bump");
          void householdCount.offsetWidth;
          householdCount.classList.add("is-bump");
        }
        if (updatedCount) {
          updatedCount.textContent = String(householdTotal);
        }
      }

      syncCheckinView();
    });
  }

  if (conceptGrid) {
    conceptGrid.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-concept]");
      if (!btn) return;

      const concept = btn.getAttribute("data-concept");
      if (!CONCEPTS[concept]) return;

      conceptGrid.querySelectorAll("[data-concept]").forEach((el) => {
        const on = el === btn;
        el.classList.toggle("is-selected", on);
        el.setAttribute("aria-pressed", on ? "true" : "false");
        const label = el.querySelector(".concept__select-label");
        if (label) {
          label.textContent = on ? "Selected" : "Select this";
        }
      });

      if (decisionChoice) decisionChoice.textContent = CONCEPTS[concept].title;
      if (decisionMeta) decisionMeta.textContent = CONCEPTS[concept].meta;
      if (decisionResult) {
        decisionResult.classList.remove("is-updating");
        void decisionResult.offsetWidth;
        decisionResult.classList.add("is-updating");
      }
    });
  }

  navigateFromHash();
})();
