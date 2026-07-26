document.addEventListener("DOMContentLoaded", function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-project-card]"));
  var list = document.querySelector("[data-project-list]");
  var empty = document.querySelector("[data-filter-empty]");
  var filterButtons = document.querySelectorAll("[data-status-filter]");
  var sort = document.getElementById("project-sort");
  var problemCards = Array.prototype.slice.call(document.querySelectorAll("[data-problem-card]"));
  var problemList = document.querySelector("[data-problem-list]");
  var problemSort = document.getElementById("problem-sort");
  var activeStatus = "all";

  function refresh() {
    var mode = sort ? sort.value : "priority";
    var visible = cards.filter(function (card) {
      return activeStatus === "all" || card.getAttribute("data-status") === activeStatus;
    });
    cards.forEach(function (card) { card.hidden = visible.indexOf(card) === -1; });
    visible.sort(function (a, b) {
      if (mode === "title") return a.querySelector(".project-title").textContent.localeCompare(b.querySelector(".project-title").textContent);
      var key = mode === "score" ? "data-score" : "data-priority";
      var first = Number(a.getAttribute(key) || 0), second = Number(b.getAttribute(key) || 0);
      return mode === "priority" ? first - second : second - first;
    });
    visible.forEach(function (card) { list.appendChild(card); });
    if (empty) empty.hidden = visible.length !== 0;
  }

  function refreshProblems() {
    if (!problemList) return;
    var mode = problemSort ? problemSort.value : "need";
    problemCards.sort(function (a, b) {
      return Number(b.getAttribute("data-" + mode) || 0) - Number(a.getAttribute("data-" + mode) || 0);
    });
    problemCards.forEach(function (card) { problemList.appendChild(card); });
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeStatus = button.getAttribute("data-status-filter") || "all";
      filterButtons.forEach(function (item) { item.classList.toggle("active", item === button); });
      refresh();
    });
  });
  document.querySelectorAll(".project-toggle").forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      var details = document.getElementById(toggle.getAttribute("aria-controls"));
      if (details) details.hidden = expanded;
    });
  });
  document.querySelectorAll(".problem-toggle").forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      var details = document.getElementById(toggle.getAttribute("aria-controls"));
      if (details) details.hidden = expanded;
    });
  });
  document.querySelectorAll(".disclosure-toggle").forEach(function (toggle) {
    toggle.addEventListener("click", function (event) {
      if (event.target.closest("a")) return;
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      var details = document.getElementById(toggle.getAttribute("aria-controls"));
      if (details) details.hidden = expanded;
    });
  });
  document.querySelectorAll("[data-open-section]").forEach(function (control) {
    control.addEventListener("click", function () {
      var section = document.getElementById(control.getAttribute("data-open-section"));
      if (section && section.tagName === "DETAILS") section.open = true;
    });
  });
  function openProject(id) {
    var projects = document.getElementById("projects");
    var card = document.getElementById("project-" + id);
    if (projects && projects.tagName === "DETAILS") projects.open = true;
    if (!card) return;
    var toggle = card.querySelector(".project-toggle");
    var details = toggle && document.getElementById(toggle.getAttribute("aria-controls"));
    if (toggle && details && toggle.getAttribute("aria-expanded") !== "true") {
      toggle.setAttribute("aria-expanded", "true");
      details.hidden = false;
    }
  }
  function openProblem(id) {
    var research = document.getElementById("research");
    var card = document.getElementById("problem-" + id);
    if (research && research.tagName === "DETAILS") research.open = true;
    if (!card) return;
    var toggle = card.querySelector(".problem-toggle");
    var details = toggle && document.getElementById(toggle.getAttribute("aria-controls"));
    if (toggle && details && toggle.getAttribute("aria-expanded") !== "true") {
      toggle.setAttribute("aria-expanded", "true");
      details.hidden = false;
    }
  }
  document.querySelectorAll("[data-open-project]").forEach(function (control) {
    control.addEventListener("click", function () { openProject(control.getAttribute("data-open-project")); });
  });
  document.querySelectorAll("[data-open-problem]").forEach(function (control) {
    control.addEventListener("click", function () { openProblem(control.getAttribute("data-open-problem")); });
  });
  if (window.location.hash) {
    var linkedSection = document.querySelector(window.location.hash);
    if (linkedSection && linkedSection.tagName === "DETAILS") linkedSection.open = true;
    if (window.location.hash.indexOf("#project-") === 0) openProject(window.location.hash.slice(9));
    if (window.location.hash.indexOf("#problem-") === 0) openProblem(window.location.hash.slice(9));
  }
  if (sort) sort.addEventListener("change", refresh);
  if (problemSort) problemSort.addEventListener("change", refreshProblems);
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      var target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      event.preventDefault(); target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  refresh();
  refreshProblems();
});
