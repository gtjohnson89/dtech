/**
 * Care Trials — SPA navigation + interactive check-in / workbench
 */
(function () {
  "use strict";

  const SCREENS = {
    home: "screen-home",
    portrait: "screen-portrait",
    trial: "screen-trial",
    checkin: "screen-checkin",
    learned: "screen-learned",
    workbench: "screen-workbench",
  };

  const FLOW = ["home", "portrait", "trial", "checkin", "learned", "workbench"];

  const MOMENT_COPY = {
    phone: {
      title: "Unknown callers upset Mum.",
      lede: "When the phone rings from a number she doesn’t know, she freezes, answers in a panic, or spends the afternoon unsettled — even if the call was harmless.",
    },
    tv: {
      title: "The remote turns the evening into a maze.",
      lede: "Too many buttons and menus leave her stuck on the wrong channel — or giving up on the television she used to enjoy.",
    },
    voices: {
      title: "She misses familiar voices.",
      lede: "Quiet stretches between visits feel longer. A scheduled call helps — but only when it sounds like someone she knows.",
    },
    falls: {
      title: "Night hallways raise the falls worry.",
      lede: "Getting to the bathroom after dark feels risky. You both stay half-awake listening for a thud.",
    },
    evenings: {
      title: "Evenings get harder.",
      lede: "As the light fades, restlessness rises — pacing, repeated questions, and a house that no longer feels settled.",
    },
  };

  const OUTCOME_LABELS = {
    helped: "Helped",
    same: "No difference",
    harder: "Made things harder",
  };

  const DECISION_LABELS = {
    refine: "Refine",
    branch: "Branch",
    stop: "Stop",
  };

  const state = {
    screen: "home",
    moment: "phone",
    checkinOutcome: null,
    checkinNote: "",
    checkinSaved: false,
    decision: null,
    decisionConfirmed: false,
  };

  const topbar = document.getElementById("topbar");
  const backBtn = document.getElementById("back-btn");
  const checkinOptions = document.getElementById("checkin-options");
  const checkinNoteWrap = document.getElementById("checkin-note-wrap");
  const checkinNote = document.getElementById("checkin-note");
  const checkinStatus = document.getElementById("checkin-status");
  const saveCheckin = document.getElementById("save-checkin");
  const evidenceSummary = document.getElementById("evidence-summary");
  const decideOptions = document.getElementById("decide-options");
  const decisionStatus = document.getElementById("decision-status");
  const confirmDecision = document.getElementById("confirm-decision");

  function screenEl(id) {
    return document.getElementById(SCREENS[id]);
  }

  function parseHash() {
    const raw = (location.hash || "#home").replace(/^#/, "");
    const [name] = raw.split("/");
    if (name === "moments") return "home";
    return SCREENS[name] ? name : "home";
  }

  function setHash(name) {
    const next = "#" + name;
    if (location.hash !== next) {
      location.hash = name;
    } else {
      showScreen(name);
    }
  }

  function showScreen(name, options) {
    const opts = options || {};
    const next = SCREENS[name] ? name : "home";
    const prev = state.screen;
    const prevEl = screenEl(prev);
    const nextEl = screenEl(next);

    if (!nextEl) return;

    if (prev !== next && prevEl && prevEl.classList.contains("is-active") && !opts.instant) {
      prevEl.classList.add("is-leaving");
      prevEl.classList.remove("is-active");
      window.setTimeout(function () {
        prevEl.hidden = true;
        prevEl.classList.remove("is-leaving");
      }, 200);
    } else if (prevEl && prevEl !== nextEl) {
      prevEl.classList.remove("is-active", "is-leaving");
      prevEl.hidden = true;
    }

    nextEl.hidden = false;
    // Force reflow so enter animation replays
    void nextEl.offsetWidth;
    nextEl.classList.add("is-active");

    state.screen = next;
    topbar.hidden = next === "home";

    if (next === "portrait") applyPortraitCopy();
    if (next === "workbench") refreshEvidenceSummary();

    if (next === "home" && location.hash === "#moments") {
      window.requestAnimationFrame(function () {
        const moments = document.getElementById("moments");
        if (moments) moments.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else if (next === "home") {
      window.scrollTo({ top: 0, behavior: opts.instant ? "auto" : "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: opts.instant ? "auto" : "smooth" });
    }
  }

  function applyPortraitCopy() {
    const copy = MOMENT_COPY[state.moment] || MOMENT_COPY.phone;
    const title = document.querySelector("#screen-portrait .screen-title");
    const lede = document.querySelector("#screen-portrait .screen-lede");
    if (title) title.textContent = copy.title;
    if (lede) lede.textContent = copy.lede;
  }

  function refreshEvidenceSummary() {
    if (!evidenceSummary) return;
    if (!state.checkinSaved) {
      evidenceSummary.textContent =
        "No check-in saved yet — using the collective pattern: mostly helped, with a branch for community callers.";
      return;
    }
    const label = OUTCOME_LABELS[state.checkinOutcome] || "Logged";
    const note = (state.checkinNote || "").trim();
    let text = "Your check-in: " + label + ".";
    if (note) text += " Note: “" + note + "”";
    if (state.checkinOutcome === "helped") {
      text += " Signal supports keeping Trusted Calls Only and refining setup.";
    } else if (state.checkinOutcome === "harder") {
      text += " Signal leans toward Branch (Church & Family) or Stop if harm persists.";
    } else {
      text += " Weak signal — refine the allow-list size or Branch for community callers.";
    }
    evidenceSummary.textContent = text;
  }

  function goBack() {
    const idx = FLOW.indexOf(state.screen);
    if (idx <= 0) {
      setHash("home");
      return;
    }
    setHash(FLOW[idx - 1]);
  }

  // ——— Navigation ———
  document.addEventListener("click", function (e) {
    const nav = e.target.closest("[data-nav]");
    if (!nav) return;
    e.preventDefault();
    const target = nav.getAttribute("data-nav");
    if (nav.hasAttribute("data-moment")) {
      state.moment = nav.getAttribute("data-moment");
    }
    if (target === "home") {
      setHash("home");
      return;
    }
    setHash(target);
  });

  document.querySelectorAll('a[href="#moments"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      if (state.screen !== "home") {
        location.hash = "moments";
        showScreen("home");
      } else {
        location.hash = "moments";
        const moments = document.getElementById("moments");
        if (moments) moments.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  backBtn.addEventListener("click", goBack);

  window.addEventListener("hashchange", function () {
    const name = parseHash();
    showScreen(name);
  });

  // ——— Check-in ———
  checkinOptions.addEventListener("click", function (e) {
    const btn = e.target.closest(".checkin-option");
    if (!btn) return;
    const outcome = btn.getAttribute("data-outcome");
    state.checkinOutcome = outcome;
    state.checkinSaved = false;

    checkinOptions.querySelectorAll(".checkin-option").forEach(function (el) {
      el.setAttribute("aria-pressed", el === btn ? "true" : "false");
    });

    checkinNoteWrap.hidden = false;
    saveCheckin.disabled = false;
    checkinStatus.hidden = true;
    checkinStatus.textContent = "";
    checkinStatus.classList.remove("is-harder", "is-same");
  });

  saveCheckin.addEventListener("click", function () {
    if (!state.checkinOutcome) return;
    state.checkinNote = checkinNote.value;
    state.checkinSaved = true;

    const label = OUTCOME_LABELS[state.checkinOutcome];
    checkinStatus.hidden = false;
    checkinStatus.classList.remove("is-harder", "is-same");
    if (state.checkinOutcome === "harder") checkinStatus.classList.add("is-harder");
    if (state.checkinOutcome === "same") checkinStatus.classList.add("is-same");

    checkinStatus.textContent = "Saved: " + label + ". Thanks — this updates the workbench.";
    saveCheckin.textContent = "Saved";

    window.setTimeout(function () {
      setHash("learned");
      saveCheckin.textContent = "Save check-in";
    }, 700);
  });

  // ——— Workbench decisions ———
  decideOptions.addEventListener("click", function (e) {
    const btn = e.target.closest(".decide-option");
    if (!btn) return;
    state.decision = btn.getAttribute("data-decision");
    state.decisionConfirmed = false;

    decideOptions.querySelectorAll(".decide-option").forEach(function (el) {
      el.setAttribute("aria-pressed", el === btn ? "true" : "false");
    });

    confirmDecision.disabled = false;
    decisionStatus.hidden = true;
  });

  confirmDecision.addEventListener("click", function () {
    if (!state.decision) return;
    state.decisionConfirmed = true;
    const label = DECISION_LABELS[state.decision];
    decisionStatus.hidden = false;
    decisionStatus.textContent =
      "Logged: " + label + ". Care Trials will carry this into the next product variant.";
    confirmDecision.textContent = "Confirmed";
    confirmDecision.disabled = true;
  });

  // ——— Boot ———
  showScreen(parseHash(), { instant: true });
})();
