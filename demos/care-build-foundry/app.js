(function () {
  "use strict";

  const variants = {
    "voice-first": {
      label: "Voice-first",
      missionLabel: "Voice-first · v0.4 bench unit",
      cost: 47.2,
      readiness: { level: "amber", text: "Parts staged · firmware unapproved" },
      kitReadiness: "Amber — firmware pending",
      proposal: "Wake-word + volume ceiling for night use",
      steps: [
        "Flash ESP32 with TV Companion base firmware (bench cable).",
        "Seat mic board on header; verify I2S orientation mark facing out.",
        "Wire IR LED to GPIO 4 via 100Ω; heat-shrink tip.",
        "Fit enclosure; leave mute button travel clear.",
        "Pair against living-room box; run channel ± and mute smoke test.",
      ],
      bom: [
        { id: "esp", part: "ESP32-S3 DevKit", supplier: "DigiKey", state: "in-stock", cost: 12.5, subs: [{ label: "ESP32-S3 DevKit", cost: 12.5 }, { label: "ESP32-WROOM module", cost: 9.8 }] },
        { id: "mic", part: "INMP441 mic board", supplier: "Mouser", state: "in-stock", cost: 6.4, subs: [{ label: "INMP441 mic board", cost: 6.4 }, { label: "SPH0645LM4H breakout", cost: 7.2 }] },
        { id: "ir", part: "IR LED + driver", supplier: "Adafruit", state: "ordered", cost: 3.1, subs: [{ label: "IR LED + driver", cost: 3.1 }, { label: "TSAL6200 discrete kit", cost: 2.4 }] },
        { id: "btn", part: "Oversized mute button", supplier: "SparkFun", state: "in-stock", cost: 2.8, subs: [{ label: "Oversized mute button", cost: 2.8 }] },
        { id: "case", part: "3D-printed enclosure", supplier: "Shop print", state: "in-stock", cost: 8.0, subs: [{ label: "3D-printed enclosure", cost: 8.0 }, { label: "Hammond ABS box", cost: 11.5 }] },
        { id: "psu", part: "5V USB-C supply", supplier: "Amazon", state: "in-stock", cost: 7.0, subs: [{ label: "5V USB-C supply", cost: 7.0 }, { label: "Bench barrel supply", cost: 5.5 }] },
        { id: "wire", part: "Wire / heat-shrink / fasteners", supplier: "Bin stock", state: "in-stock", cost: 4.2, subs: [{ label: "Wire / heat-shrink / fasteners", cost: 4.2 }] },
        { id: "misc", part: "PCB proto + headers", supplier: "DigiKey", state: "in-stock", cost: 3.2, subs: [{ label: "PCB proto + headers", cost: 3.2 }] },
      ],
    },
    "one-button": {
      label: "One-button remote",
      missionLabel: "One-button remote · draft kit",
      cost: 28.4,
      readiness: { level: "green", text: "Parts ready · no firmware gate" },
      kitReadiness: "Green — parts verified",
      proposal: "Preset cycle map for news / weather / church",
      steps: [
        "Solder oversized toggle to breakout; debounce capacitor on board.",
        "Flash one-button cycle firmware; set three IR macros.",
        "Mount in palm enclosure; label presets with high-contrast tape.",
        "Aim IR; verify cycle order with caregiver present.",
      ],
      bom: [
        { id: "esp", part: "ESP32-C3 mini", supplier: "DigiKey", state: "in-stock", cost: 8.2, subs: [{ label: "ESP32-C3 mini", cost: 8.2 }, { label: "ATTiny85 IR kit", cost: 6.5 }] },
        { id: "btn", part: "Arcade-size toggle", supplier: "SparkFun", state: "in-stock", cost: 4.5, subs: [{ label: "Arcade-size toggle", cost: 4.5 }] },
        { id: "ir", part: "IR LED module", supplier: "Adafruit", state: "in-stock", cost: 2.9, subs: [{ label: "IR LED module", cost: 2.9 }] },
        { id: "case", part: "Palm enclosure print", supplier: "Shop print", state: "in-stock", cost: 6.0, subs: [{ label: "Palm enclosure print", cost: 6.0 }, { label: "Project box cut", cost: 7.5 }] },
        { id: "batt", part: "CR2032 holder + cells", supplier: "Mouser", state: "in-stock", cost: 3.8, subs: [{ label: "CR2032 holder + cells", cost: 3.8 }] },
        { id: "wire", part: "Wire / fasteners", supplier: "Bin stock", state: "in-stock", cost: 3.0, subs: [{ label: "Wire / fasteners", cost: 3.0 }] },
      ],
    },
    "auto-schedule": {
      label: "Automatic schedule",
      missionLabel: "Automatic schedule · concept bench",
      cost: 36.1,
      readiness: { level: "amber", text: "Needs caregiver schedule confirm" },
      kitReadiness: "Amber — schedule unconfirmed",
      proposal: "Favorite-slot clock with manual override latch",
      steps: [
        "Flash schedule firmware; set RTC from laptop once.",
        "Load three favorite IR macros into slot table.",
        "Mount clock face + override latch on shelf enclosure.",
        "Dry-run next three timed switches before leaving home.",
      ],
      bom: [
        { id: "esp", part: "ESP32 + RTC module", supplier: "DigiKey", state: "ordered", cost: 14.0, subs: [{ label: "ESP32 + RTC module", cost: 14.0 }, { label: "Pi Pico W + DS3231", cost: 12.2 }] },
        { id: "ir", part: "IR blaster board", supplier: "Adafruit", state: "in-stock", cost: 5.5, subs: [{ label: "IR blaster board", cost: 5.5 }] },
        { id: "latch", part: "Override latch switch", supplier: "SparkFun", state: "in-stock", cost: 3.2, subs: [{ label: "Override latch switch", cost: 3.2 }] },
        { id: "case", part: "Shelf enclosure", supplier: "Shop print", state: "sub", cost: 7.0, subs: [{ label: "Shelf enclosure", cost: 7.0 }, { label: "IKEA hack plate", cost: 4.5 }] },
        { id: "psu", part: "5V wall wart", supplier: "Amazon", state: "in-stock", cost: 4.4, subs: [{ label: "5V wall wart", cost: 4.4 }] },
        { id: "wire", part: "Wire / fasteners", supplier: "Bin stock", state: "in-stock", cost: 2.0, subs: [{ label: "Wire / fasteners", cost: 2.0 }] },
      ],
    },
  };

  const teasers = {
    "auto-answer": "Auto-Answer Calls — Rank #2. Shared wake-audio path with TV Companion. Kit draft; not the active mission.",
    "church-radio": "Church Radio — Rank #4. In field trial with two households. Separate BOM from TV Companion.",
    "scam-safe": "Scam-Safe Launcher — Rank #3. Proposal stage: lock launcher to approved apps only. Shares remote UX lessons.",
    "night-light": "Night Wandering Light — Rank #5. BOM on hold pending hallway sensor choice.",
  };

  const state = {
    screen: "build-control",
    variant: "voice-first",
    decision: "pending",
    promoted: false,
    bomSelections: {},
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function money(n) {
    return "$" + n.toFixed(2);
  }

  function goTo(screenId) {
    const screens = $$("[data-screen]");
    screens.forEach((el) => {
      const active = el.getAttribute("data-screen") === screenId;
      el.classList.toggle("is-active", active);
      if (active) {
        el.removeAttribute("hidden");
      } else {
        el.setAttribute("hidden", "");
      }
    });
    $$("[data-nav]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-nav") === screenId);
    });
    state.screen = screenId;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function syncMission() {
    const v = variants[state.variant];
    $("#mission-variant").textContent = v.missionLabel;
    $("#mission-cost").textContent = money(currentKitTotal());
    $("#mission-proposal").textContent = v.proposal;
    $("#proposal-title").textContent = v.proposal;

    const readiness = $("#mission-readiness");
    const r = effectiveReadiness(v);
    readiness.textContent = r.text;
    readiness.setAttribute("data-level", r.level);

    const status = $("#mission-status");
    const blockers = $("#mission-blockers");
    if (state.decision === "approved") {
      status.textContent = "Change approved · kit unlocked";
      status.setAttribute("data-state", "approved");
      blockers.textContent = state.promoted ? "None — baseline promoted" : "Open field failure: night false wake";
    } else if (state.decision === "rejected") {
      status.textContent = "Proposal rejected · awaiting new Grok draft";
      status.setAttribute("data-state", "rejected");
      blockers.textContent = "No approved night-volume change";
    } else if (state.decision === "revise") {
      status.textContent = "Revision requested · Grok rework queued";
      status.setAttribute("data-state", "revise");
      blockers.textContent = "Ceiling % and wake threshold under revision";
    } else {
      status.textContent = "Proposal awaiting approval";
      status.setAttribute("data-state", "pending");
      blockers.textContent = "Pending decision on night-volume ceiling";
    }

    $("#kit-variant-label").textContent = v.label;
    $("#promote-variant").textContent = v.label;
    $("#kit-readiness").textContent =
      state.decision === "approved" && state.variant === "voice-first"
        ? "Green — firmware change approved"
        : v.kitReadiness;

    const feedback = $("#variant-feedback");
    if (feedback) {
      feedback.textContent = v.label + " is the active prototype path.";
    }
  }

  function effectiveReadiness(v) {
    if (state.decision === "approved" && state.variant === "voice-first") {
      return { level: "green", text: "Parts staged · firmware approved" };
    }
    if (state.decision === "rejected") {
      return { level: "red", text: "Parts staged · change blocked" };
    }
    return v.readiness;
  }

  function currentKitTotal() {
    const v = variants[state.variant];
    return v.bom.reduce((sum, row) => {
      const sel = state.bomSelections[row.id];
      const idx = typeof sel === "number" ? sel : 0;
      return sum + row.subs[idx].cost;
    }, 0);
  }

  function renderBom() {
    const v = variants[state.variant];
    const body = $("#bom-body");
    body.innerHTML = "";

    v.bom.forEach((row) => {
      if (state.bomSelections[row.id] == null) state.bomSelections[row.id] = 0;
      const idx = state.bomSelections[row.id];
      const sub = row.subs[idx];
      const tr = document.createElement("tr");
      const stateLabel = idx > 0 ? "sub" : row.state;
      const stateText = idx > 0 ? "substituted" : row.state.replace("-", " ");

      tr.innerHTML =
        "<td>" +
        row.part +
        "</td>" +
        "<td>" +
        row.supplier +
        "</td>" +
        '<td><span class="state-pill" data-state="' +
        stateLabel +
        '">' +
        stateText +
        "</span></td>" +
        "<td></td>" +
        '<td class="num">' +
        money(sub.cost) +
        "</td>";

      const subCell = tr.children[3];
      if (row.subs.length > 1) {
        const select = document.createElement("select");
        select.setAttribute("aria-label", "Substitute " + row.part);
        row.subs.forEach((option, i) => {
          const opt = document.createElement("option");
          opt.value = String(i);
          opt.textContent = option.label + " · " + money(option.cost);
          if (i === idx) opt.selected = true;
          select.appendChild(opt);
        });
        select.addEventListener("change", function () {
          state.bomSelections[row.id] = Number(select.value);
          renderBom();
          syncMission();
        });
        subCell.appendChild(select);
      } else {
        subCell.textContent = "—";
      }

      body.appendChild(tr);
    });

    const total = currentKitTotal();
    $("#kit-total").textContent = money(total);
    $("#mission-cost").textContent = money(total);

    const steps = $("#assembly-steps");
    steps.innerHTML = "";
    v.steps.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      steps.appendChild(li);
    });
  }

  function selectVariant(id) {
    if (!variants[id]) return;
    state.variant = id;
    state.bomSelections = {};
    state.promoted = false;
    $("#promote-feedback").textContent = "";
    $("#promote-panel").classList.remove("is-promoted");
    $("#promote-btn").disabled = false;

    $$(".branch").forEach((btn) => {
      const on = btn.getAttribute("data-variant") === id;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });

    renderBom();
    syncMission();
  }

  function applyDecision(decision) {
    state.decision = decision;
    const panel = $("#proposal-panel");
    const status = $("#proposal-status");
    const feedback = $("#proposal-feedback");
    panel.setAttribute("data-decision", decision);

    const messages = {
      approve: {
        status: "Approved by George · change queued into kit firmware",
        feedback: "Proposal accepted. Build readiness updated — night ceiling may ship to field trial.",
      },
      revise: {
        status: "Revision requested · labeled as Grok rework, not silent change",
        feedback: "Ask Grok to tighten wake threshold and confirm 35% cap with caregiver.",
      },
      reject: {
        status: "Rejected · kit stays on prior behavior",
        feedback: "Proposal discarded. TV Companion keeps current night behavior until a new proposal.",
      },
    };

    status.textContent = messages[decision].status;
    feedback.textContent = messages[decision].feedback;

    if (decision === "approve") {
      panel.classList.remove("is-flash");
      void panel.offsetWidth;
      panel.classList.add("is-flash");
    }

    syncMission();
  }

  function bind() {
    $$("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", function () {
        goTo(btn.getAttribute("data-nav"));
      });
    });

    $$("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", function () {
        goTo(btn.getAttribute("data-goto"));
      });
    });

    $$(".branch").forEach((btn) => {
      btn.addEventListener("click", function () {
        selectVariant(btn.getAttribute("data-variant"));
      });
    });

    $$("[data-decision]").forEach((btn) => {
      btn.addEventListener("click", function () {
        applyDecision(btn.getAttribute("data-decision"));
      });
    });

    $$("[data-teaser]").forEach((btn) => {
      btn.addEventListener("click", function () {
        const key = btn.getAttribute("data-teaser");
        const note = $("#teaser-note");
        if (!note) return;
        note.hidden = false;
        note.textContent = teasers[key] || "";
        if (state.screen !== "build-control") goTo("build-control");
        note.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });

    $("#promote-btn").addEventListener("click", function () {
      const feedback = $("#promote-feedback");
      const panel = $("#promote-panel");
      if (state.decision !== "approve" && state.variant === "voice-first") {
        feedback.style.color = "var(--orange-deep)";
        feedback.textContent =
          "Cannot promote Voice-first baseline while the night-volume Grok proposal is still open.";
        return;
      }
      state.promoted = true;
      feedback.style.color = "var(--green)";
      feedback.textContent =
        variants[state.variant].label + " promoted to household baseline. Prior variant archived in family tree.";
      panel.classList.add("is-promoted");
      $("#promote-btn").disabled = true;
      syncMission();
    });
  }

  bind();
  selectVariant("voice-first");
  goTo("build-control");
})();
