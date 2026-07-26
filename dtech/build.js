#!/usr/bin/env node
/**
 * Build the Dementia Tech Build OS dashboard from local JSON/JSONL data.
 * Usage from the repository root: node dtech/build.js
 */
const fs = require("fs");
const path = require("path");

const SITE_DIR = __dirname;
const DATA_DIR = SITE_DIR;
const LOG_PATH = path.join(DATA_DIR, "log.jsonl");
const PROJECTS_DIR = path.join(DATA_DIR, "projects");
const CARTS_DIR = path.join(DATA_DIR, "carts");
const OUT_HTML = path.join(SITE_DIR, "index.html");
const ASSETS_DIR = path.join(SITE_DIR, "assets");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.warn(`Skipping invalid JSON file ${filePath}: ${error.message}`);
    return null;
  }
}

function readJsonDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  let names = [];
  try {
    names = fs.readdirSync(dirPath).filter((name) => name.endsWith(".json")).sort();
  } catch (error) {
    console.warn(`Could not read ${dirPath}: ${error.message}`);
    return [];
  }
  return names.map((name) => readJson(path.join(dirPath, name))).filter(Boolean);
}

function readLog(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const entries = [];
  let raw = "";
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.warn(`Could not read ${filePath}: ${error.message}`);
    return entries;
  }
  raw.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      entries.push(JSON.parse(trimmed));
    } catch (error) {
      console.warn(`Skipping invalid JSONL line ${index + 1}: ${error.message}`);
    }
  });
  return entries.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(value) {
  const url = String(value || "").trim();
  return /^(https?:\/\/)/i.test(url) ? url : "";
}

function link(url, label, className = "") {
  const safe = safeUrl(url);
  if (!safe) return esc(label || "Link unavailable");
  return `<a class="${esc(className)}" href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${esc(label || "Open link")} <span aria-hidden="true">↗</span></a>`;
}

function text(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return `<span class="muted">${esc(fallback)}</span>`;
  return esc(value);
}

function list(items, empty = "None recorded") {
  const values = Array.isArray(items) ? items.filter((item) => item !== null && item !== undefined && item !== "") : [];
  if (!values.length) return `<p class="muted">${esc(empty)}</p>`;
  return `<ul class="check-list">${values.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function number(value, fallback = "—") {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : fallback;
}

function money(value, fallback = "—") {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parsed)
    : fallback;
}

function formatDate(value, withTime = false) {
  if (!value) return "Unknown date";
  const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", withTime
    ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", year: "numeric" });
}

function statusLabel(value) {
  const normalized = String(value || "unknown").replace(/[-_]+/g, " ");
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value) {
  return String(value || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function scoreClass(score) {
  const value = Number(score);
  if (value >= 8) return "score-high";
  if (value >= 6) return "score-mid";
  return "score-low";
}

function effortClass(effort) {
  return `effort-${String(effort || "u").toLowerCase()}`;
}

function field(label, value, className = "") {
  return `<div class="field ${esc(className)}"><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
}

function sectionHeader(eyebrow, title, description, id = "") {
  return `<div class="section-heading"${id ? ` id="${esc(id)}"` : ""}>
    <div><p class="eyebrow">${esc(eyebrow)}</p><h2>${esc(title)}</h2></div>
    ${description ? `<p class="section-description">${esc(description)}</p>` : ""}
  </div>`;
}

function emptyState(title, detail) {
  return `<div class="empty-state"><div class="empty-mark" aria-hidden="true">∅</div><div><h3>${esc(title)}</h3><p>${esc(detail)}</p></div></div>`;
}

function renderScoreStrip(scores = {}) {
  const fields = [
    ["Impact", scores.impact],
    ["Feasibility", scores.feasibility],
    ["Profit", scores.profit],
    ["Fit", scores.fit],
  ];
  return `<div class="score-strip">${fields.map(([label, value]) => `<span><b>${esc(number(value))}</b><small>${esc(label)}</small></span>`).join("")}<span class="score-total"><b>${esc(number(scores.total))}</b><small>Total</small></span></div>`;
}

function renderProject(project, cartById) {
  const scores = project.scores || {};
  const feasibility = project.feasibility || {};
  const market = project.market || {};
  const costs = project.costs || {};
  const software = project.softwarePlan || {};
  const cart = project.bomCartId ? cartById.get(project.bomCartId) : null;
  const projectId = project.id || project.title || "project";
  const cartAction = cart
    ? `<a class="text-link" href="#cart-${esc(cart.id || project.bomCartId)}">View BOM cart <span aria-hidden="true">↓</span></a>`
    : `<span class="muted">No BOM cart linked</span>`;

  return `<article class="project-card" data-project-card data-status="${esc(String(project.status || "unknown").toLowerCase())}" data-priority="${esc(number(project.priority, "99"))}" data-score="${esc(number(scores.total, "0"))}">
    <div class="project-head">
      <div>
        <div class="project-kicker">Priority ${esc(number(project.priority))} · Updated ${esc(formatDate(project.updated || project.created))}</div>
        <h3>${text(project.title, "Untitled project")}</h3>
      </div>
      <span class="status-badge status-${esc(statusClass(project.status))}">${esc(statusLabel(project.status))}</span>
    </div>
    ${renderScoreStrip(scores)}
    <div class="project-summary">
      ${field("Problem", text(project.problem))}
      ${field("Solution", text(project.solution))}
      ${field("Built for", text(project.targetUser))}
      ${field("George fit", text(project.fitForGeorge))}
    </div>
    <div class="project-grid">
      <section class="mini-panel"><h4>Feasibility</h4><div class="big-metric">${esc(number(feasibility.overall))}<small>/ 10 overall</small></div><p class="muted">Hardware ${esc(number(feasibility.hardware))} · Software ${esc(number(feasibility.software))} · Regulatory ${esc(number(feasibility.regulatory))}</p><p>${text(feasibility.notes)}</p></section>
      <section class="mini-panel"><h4>Market / profit hypothesis</h4><p><b>Need signal:</b> ${text(market.needSignal)}</p><p><b>Willingness to pay:</b> ${text(market.willingnessToPay)}</p><p>${text(market.profitHypothesis)}</p></section>
      <section class="mini-panel"><h4>Cost model</h4><dl class="compact-dl">${field("Prototype BOM", money(costs.prototypeBomUsd))}${field("Unit BOM", money(costs.unitBomUsd))}${field("Target price", money(costs.targetPriceUsd))}${field("Gross margin", costs.grossMarginPct !== undefined ? `${esc(number(costs.grossMarginPct))}%` : `<span class="muted">—</span>`)}</dl></section>
      <section class="mini-panel"><h4>Software plan</h4><p>${text(software.summary)}</p><p class="muted"><b>Stack:</b> ${Array.isArray(software.stack) && software.stack.length ? esc(software.stack.join(" · ")) : "—"}</p></section>
    </div>
    <div class="project-lists">
      <section><h4 class="list-heading solved-heading">Solved / validated</h4>${list(project.solved)}</section>
      <section><h4 class="list-heading open-heading">Unsolved / open questions</h4>${list(project.unsolved)}</section>
      <section><h4 class="list-heading next-heading">Next actions</h4>${list(project.nextActions)}</section>
    </div>
    <div class="project-foot"><span class="muted">${esc(project.notes || "Portfolio record")}</span><span>${cartAction}</span></div>
  </article>`;
}

function renderCart(cart, projectById) {
  const items = Array.isArray(cart.items) ? cart.items : [];
  const project = projectById.get(cart.projectId);
  const rows = items.length
    ? items.map((item) => `<tr>
        <td><strong>${text(item.name, "Unnamed item")}</strong>${item.notes ? `<small>${esc(item.notes)}</small>` : ""}${item.required === false ? `<span class="optional">Optional</span>` : ""}</td>
        <td>${text(item.vendor)}</td><td>${esc(number(item.qty))}</td><td>${money(item.unitUsd)}</td><td><b>${money(item.totalUsd)}</b></td>
        <td>${item.url ? link(item.url, "Open", "table-link") : `<span class="muted">—</span>`}</td>
      </tr>`).join("")
    : `<tr><td colspan="6"><span class="muted">No items recorded in this cart.</span></td></tr>`;
  return `<article class="cart-card" id="cart-${esc(cart.id || cart.projectId || "unknown")}">
    <div class="cart-head"><div><p class="eyebrow">${esc(cart.pricingMode || "cart")}</p><h3>${text(cart.title, "Shopping cart")}</h3><p class="muted">${project ? `For ${esc(project.title)}` : "Unlinked portfolio cart"} · Updated ${esc(formatDate(cart.updated))}</p></div><div class="cart-total"><small>Grand total</small><strong>${money(cart.grandTotalUsd)}</strong></div></div>
    <div class="table-wrap"><table><caption class="sr-only">${esc(cart.title || "Shopping cart")} bill of materials</caption><thead><tr><th scope="col">Item</th><th scope="col">Vendor</th><th scope="col">Qty</th><th scope="col">Unit</th><th scope="col">Total</th><th scope="col">Link</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="cart-summary"><div><span class="label">Subtotal</span><b>${money(cart.subtotalUsd)}</b> <span class="muted">+ shipping ${money(cart.shippingEstimateUsd, "$0.00")} + tax ${money(cart.taxEstimateUsd, "$0.00")}</span></div><div><span class="label">Missing items</span>${list(cart.missingItems, "Nothing flagged")}</div></div>
    ${cart.notes ? `<p class="cart-notes">${esc(cart.notes)}</p>` : ""}
  </article>`;
}

function renderIdea(idea, index) {
  return `<article class="idea-card ${esc(scoreClass(idea.score))}" style="--order:${index}">
    <div class="idea-head"><h3>${text(idea.title, "Untitled idea")}</h3><div class="idea-badges"><span class="score-badge">Score ${esc(number(idea.score))}</span><span class="effort-badge ${esc(effortClass(idea.effort))}">Effort ${esc(idea.effort || "?")}</span></div></div>
    <dl class="idea-details">${field("Problem", text(idea.problem))}${field("Build angle", text(idea.fit))}</dl>
  </article>`;
}

function renderScan(entry, latest = false) {
  const ideas = Array.isArray(entry.ideas) ? entry.ideas.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0)) : [];
  const themes = Array.isArray(entry.postThemes) ? entry.postThemes : [];
  const strong = ideas.filter((idea) => Number(idea.score) >= 7).length;
  return `<article class="scan-card ${latest ? "latest-scan" : "archive-scan"}"${latest ? " id=latest-scan" : ""}>
    <div class="scan-head"><div><p class="eyebrow">${latest ? "Latest daily scan" : "Archived scan"}</p><h3>${esc(formatDate(entry.date))}</h3><div class="meta-row"><span class="status-badge ${entry.accessOk ? "status-access" : "status-failed"}">${entry.accessOk ? "Access OK" : "Access unavailable"}</span><span class="pill">${esc(ideas.length)} ideas</span><span class="pill">${esc(strong)} strong</span>${entry.source ? `<span class="pill muted-pill">${esc(entry.source)}</span>` : ""}</div></div>${entry.group ? link(entry.group, "Open source group", "outline-button") : ""}</div>
    <div class="scan-body"><section class="theme-panel"><h4>Themes surfaced</h4><div class="theme-cloud">${themes.length ? themes.map((theme) => `<span>${esc(theme)}</span>`).join("") : `<span class="muted">No themes recorded.</span>`}</div>${entry.notes ? `<p class="scan-notes">${esc(entry.notes)}</p>` : ""}</section><section class="ideas-panel"><div class="subhead"><h4>Ideas by score</h4><span class="muted">${esc(ideas.length)} opportunities</span></div>${ideas.length ? `<div class="ideas-grid">${ideas.map(renderIdea).join("")}</div>` : emptyState("No ideas in this scan", "Run a daily scan to populate the opportunity queue.")}</section></div>
  </article>`;
}

function buildHtml({ entries, projects, carts }) {
  const latest = entries[0] || null;
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const cartById = new Map(carts.map((cart) => [cart.id, cart]));
  const groupUrl = safeUrl(latest && latest.group) || "https://www.facebook.com/groups/397162319426193";
  const groupName = latest && latest.groupName ? latest.groupName : "Technology and aids for dementia";
  const projectStatuses = [...new Set(projects.map((project) => String(project.status || "unknown").toLowerCase()))].sort();
  const totalIdeas = entries.reduce((total, entry) => total + (Array.isArray(entry.ideas) ? entry.ideas.length : 0), 0);
  const strongIdeas = entries.reduce((total, entry) => total + (Array.isArray(entry.ideas) ? entry.ideas.filter((idea) => Number(idea.score) >= 7).length : 0), 0);
  const cartTotal = carts.reduce((total, cart) => total + (Number(cart.grandTotalUsd) || 0), 0);
  const generatedAt = new Date().toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" });
  const statusStats = projectStatuses.length ? projectStatuses.map((status) => `<span><b>${projects.filter((project) => String(project.status || "unknown").toLowerCase() === status).length}</b><small>${esc(statusLabel(status))}</small></span>`).join("") : `<span><b>0</b><small>No projects</small></span>`;

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#10252b"><title>Dementia Tech Build OS</title><link rel="stylesheet" href="assets/styles.css"></head>
<body>
  <div class="ambient ambient-one" aria-hidden="true"></div><div class="ambient ambient-two" aria-hidden="true"></div>
  <header class="hero"><div class="shell">
    <nav class="topbar" aria-label="Dashboard navigation"><a class="brand" href="#top"><span class="brand-mark">D</span><span><b>Build OS</b><small>George's dementia tech lab</small></span></a><div class="top-links"><a href="#projects">Projects</a><a href="#carts">Carts</a><a href="#scans">Scans</a></div></nav>
  <div class="hero-grid" id="top"><div><p class="eyebrow amber">Last updated · ${esc(formatDate(latest && latest.date))}</p><h1>Dementia Tech<br><em>Build OS</em></h1><p class="hero-copy">A working view of caregiver pain points, build hypotheses, prototype costs, and the next concrete move. Designed to turn a daily scan into a shippable aid.</p><div class="hero-actions">${link(groupUrl, "Open source group", "primary-button")}<a class="outline-button" href="#projects">Review pipeline <span aria-hidden="true">↓</span></a></div></div><aside class="hero-note"><span class="signal-dot"></span><div><b>System status</b><p>${latest ? `Last scan ${esc(formatDate(latest.date))} · ${latest.accessOk ? "source access confirmed" : "source access needs attention"}` : "No daily scan has been loaded yet."}</p></div><hr><p><b>Rebuild hint</b><br><code>node dtech/build.js</code></p><p class="muted">Generated ${esc(generatedAt)} CT</p></aside></div>
  </div></header>
  <main class="shell">
    <section class="overview" aria-labelledby="overview-title">${sectionHeader("01 · Pipeline overview", "Know what is moving", "A compact read on portfolio health, evidence, and spend.", "overview-title")}<div class="overview-grid"><article class="overview-card status-card"><div class="card-icon">↗</div><h3>Project pipeline</h3><div class="status-stats">${statusStats}</div><p class="muted">${esc(projects.length)} portfolio record${projects.length === 1 ? "" : "s"} loaded</p></article><article class="overview-card"><div class="card-icon teal">✦</div><h3>Evidence queue</h3><strong class="overview-number">${esc(strongIdeas)}</strong><p>strong ideas across ${esc(entries.length)} daily scan${entries.length === 1 ? "" : "s"}</p><div class="meter"><span style="width:${totalIdeas ? Math.min(100, Math.round((strongIdeas / totalIdeas) * 100)) : 0}%"></span></div></article><article class="overview-card"><div class="card-icon amber-icon">$</div><h3>Prototype spend</h3><strong class="overview-number">${esc(money(cartTotal))}</strong><p>across ${esc(carts.length)} BOM cart${carts.length === 1 ? "" : "s"}</p><p class="muted">Cart totals are estimates unless marked browser-research.</p></article><article class="overview-card access-card"><div class="card-icon ${latest && latest.accessOk ? "teal" : "amber-icon"}">${latest && latest.accessOk ? "✓" : "!"}</div><h3>Source access</h3><strong class="overview-number">${latest ? (latest.accessOk ? "Ready" : "Check") : "Waiting"}</strong><p>${latest ? (latest.accessOk ? "Latest group scan completed." : "Latest scan reported an access problem.") : "No scan status yet."}</p><a class="text-link" href="#latest-scan">View latest scan <span aria-hidden="true">↓</span></a></article></div></section>
    <section id="projects" class="projects-section" aria-labelledby="projects-title">${sectionHeader("02 · Portfolio", "Active projects", "Every project has a next move. Filter the queue, then sort by urgency or score.", "projects-title")}<div class="toolbar"><div class="filter-group" role="group" aria-label="Filter projects by status"><button class="filter-button active" type="button" data-status-filter="all">All <span>${esc(projects.length)}</span></button>${projectStatuses.map((status) => `<button class="filter-button" type="button" data-status-filter="${esc(status)}">${esc(statusLabel(status))} <span>${projects.filter((project) => String(project.status || "unknown").toLowerCase() === status).length}</span></button>`).join("")}</div><label class="sort-control" for="project-sort">Sort <select id="project-sort"><option value="priority">Priority first</option><option value="score">Score first</option><option value="title">Title A–Z</option></select></label></div><div class="project-grid-list" data-project-list>${projects.length ? projects.map((project) => renderProject(project, cartById)).join("") : emptyState("No projects loaded", "Add project JSON files to ./projects and rebuild the dashboard.")}</div><p class="filter-empty" data-filter-empty hidden>No projects match this filter.</p></section>
    <section id="carts" class="carts-section" aria-labelledby="carts-title">${sectionHeader("03 · Prototype spend", "Shopping carts / BOM", "The parts list behind the portfolio, including what is still missing.", "carts-title")}${carts.length ? `<div class="cart-list">${carts.map((cart) => renderCart(cart, projectById)).join("")}</div>` : emptyState("No carts loaded", "Add BOM JSON files to ./carts and rebuild the dashboard.")}</section>
    <section id="scans" class="scans-section" aria-labelledby="scans-title">${sectionHeader("04 · Daily signal", "Latest daily scan", "Fresh caregiver themes and opportunities from the source group.", "scans-title")}${latest ? renderScan(latest, true) : emptyState("No daily scan yet", "Append a JSON object to ./log.jsonl, then rebuild the dashboard.")}<div class="archive-heading"><div><p class="eyebrow">05 · Archive</p><h2>Scan history</h2></div><p class="section-description">A durable trail of what was heard, when it was heard, and what made the cut.</p></div><div class="archive-list">${entries.length > 1 ? entries.slice(1).map((entry) => renderScan(entry)).join("") : emptyState("No older scans", "Future daily scans will appear here automatically.")}</div></section>
  </main>
  <footer class="shell footer"><p><b>Dementia Tech Build OS</b> · local static dashboard</p><p>Sources: <code>./log.jsonl</code> · <code>./projects/*.json</code> · <code>./carts/*.json</code> · rebuild with <code>node dtech/build.js</code></p></footer>
  <script src="assets/app.js"></script>
</body></html>`;
}

const CSS = `:root {
  --slate-950: #0b171b; --slate-900: #10252b; --slate-850: #153139; --slate-800: #1a3a42;
  --line: rgba(196, 226, 218, .14); --line-strong: rgba(196, 226, 218, .24);
  --ink: #ecf4ee; --muted: #a4bbb7; --teal: #55d6b2; --teal-soft: #b9f3dd;
  --amber: #f4b94f; --amber-soft: #ffe2a7; --red: #ff8a79; --shadow: 0 24px 70px rgba(0,0,0,.24);
  --radius: 18px; --font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; } html { scroll-behavior: smooth; } body { margin: 0; color: var(--ink); background: var(--slate-950); font: 15px/1.55 var(--font); min-width: 320px; }
body::before { content: ""; position: fixed; inset: 0; z-index: -2; background: linear-gradient(145deg, #0b171b 0%, #10252b 47%, #0c1c20 100%); }
.ambient { position: fixed; z-index: -1; width: 40vw; height: 40vw; border-radius: 50%; filter: blur(80px); opacity: .14; pointer-events: none; }.ambient-one { background: var(--teal); top: -18vw; left: -12vw; }.ambient-two { background: var(--amber); top: 32vw; right: -24vw; }
a { color: var(--teal-soft); text-decoration: none; } a:hover { color: #fff; text-decoration: underline; } button, select { font: inherit; }
.shell { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }.hero { padding: 24px 0 38px; border-bottom: 1px solid var(--line); }.topbar { display:flex; align-items:center; justify-content:space-between; gap: 20px; padding-bottom: 54px; }.brand { display:flex; align-items:center; gap: 11px; color: var(--ink); }.brand:hover { text-decoration:none; }.brand-mark { display:grid; place-items:center; width:36px; height:36px; background:var(--amber); color:var(--slate-950); border-radius:11px; font-weight:900; font-size:20px; }.brand b, .brand small { display:block; }.brand small { color:var(--muted); font-size:11px; letter-spacing:.08em; text-transform:uppercase; }.top-links { display:flex; gap: 22px; font-size:13px; }.top-links a { color:var(--muted); }.top-links a:hover { color:var(--ink); }
.hero-grid { display:grid; grid-template-columns: minmax(0, 1.35fr) minmax(260px, .65fr); gap: 70px; align-items:end; }.eyebrow { margin:0 0 8px; color:var(--teal); text-transform:uppercase; font-size:11px; font-weight:800; letter-spacing:.15em; }.eyebrow.amber { color:var(--amber); } h1, h2, h3, h4, p { margin-top:0; } h1 { margin-bottom: 22px; font-size: clamp(42px, 7vw, 78px); line-height:.98; letter-spacing:-.06em; font-weight:800; } h1 em { color:var(--amber); font-style:normal; }.hero-copy { max-width: 640px; color:var(--muted); font-size:17px; }.hero-actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:28px; }.primary-button, .outline-button { display:inline-flex; align-items:center; gap:7px; border-radius:10px; padding:10px 14px; font-weight:800; font-size:13px; }.primary-button { color:var(--slate-950); background:var(--amber); }.primary-button:hover { color:var(--slate-950); background:#ffd17b; text-decoration:none; }.outline-button { color:var(--ink); border:1px solid var(--line-strong); background:rgba(255,255,255,.03); }.outline-button:hover { background:rgba(255,255,255,.08); text-decoration:none; }.hero-note { padding:18px; border:1px solid var(--line); border-radius:var(--radius); background:rgba(16,37,43,.72); box-shadow:var(--shadow); color:var(--muted); }.hero-note b { color:var(--ink); }.hero-note p { margin:5px 0; font-size:13px; }.hero-note hr { border:0; border-top:1px solid var(--line); margin:16px 0; }.signal-dot { display:inline-block; width:8px; height:8px; margin-right:7px; border-radius:50%; background:var(--teal); box-shadow:0 0 0 5px rgba(85,214,178,.12); }code { padding:2px 5px; border:1px solid var(--line); border-radius:5px; color:var(--amber-soft); background:rgba(0,0,0,.16); font:12px ui-monospace, SFMono-Regular, Menlo, monospace; }.muted { color:var(--muted); }.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
main { padding: 58px 0 90px; }.section-heading, .archive-heading { display:flex; align-items:end; justify-content:space-between; gap:28px; margin:0 0 20px; }.section-heading h2, .archive-heading h2 { margin:0; font-size:clamp(26px, 3vw, 38px); letter-spacing:-.04em; }.section-description { max-width:430px; margin:0 0 4px; color:var(--muted); text-align:right; }.overview { margin-bottom: 64px; }.overview-grid { display:grid; grid-template-columns:1.35fr repeat(3, 1fr); gap:12px; }.overview-card { min-height:172px; padding:19px; border:1px solid var(--line); border-radius:var(--radius); background:rgba(21,49,57,.58); }.overview-card h3 { margin:0 0 12px; font-size:14px; }.card-icon { display:grid; place-items:center; width:31px; height:31px; margin-bottom:14px; border-radius:9px; color:var(--slate-950); background:var(--amber); font-weight:900; }.card-icon.teal { background:var(--teal); }.card-icon.amber-icon { background:var(--amber); }.overview-number { display:block; margin:2px 0 4px; font-size:32px; letter-spacing:-.05em; }.overview-card p { margin:0; color:var(--muted); font-size:12px; }.status-stats { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:13px; }.status-stats span, .score-strip span { display:flex; flex-direction:column; }.status-stats b { font-size:22px; color:var(--amber); line-height:1; }.status-stats small, .score-strip small { color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.08em; }.meter { height:4px; margin-top:15px; border-radius:4px; background:rgba(255,255,255,.08); overflow:hidden; }.meter span { display:block; height:100%; border-radius:inherit; background:var(--teal); }
.projects-section, .carts-section { margin-bottom:70px; }.toolbar { display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-bottom:16px; padding:10px; border:1px solid var(--line); border-radius:13px; background:rgba(16,37,43,.6); }.filter-group { display:flex; flex-wrap:wrap; gap:5px; }.filter-button { cursor:pointer; border:1px solid transparent; border-radius:8px; padding:7px 9px; color:var(--muted); background:transparent; font-size:12px; }.filter-button span { margin-left:3px; color:var(--teal); }.filter-button:hover, .filter-button.active { border-color:var(--line-strong); color:var(--ink); background:rgba(255,255,255,.06); }.sort-control { display:flex; align-items:center; gap:8px; color:var(--muted); font-size:12px; }.sort-control select { border:1px solid var(--line); border-radius:8px; padding:7px 9px; color:var(--ink); background:var(--slate-850); }.project-grid-list { display:grid; gap:15px; }.project-card, .cart-card, .scan-card { border:1px solid var(--line); border-radius:var(--radius); background:rgba(21,49,57,.62); box-shadow:var(--shadow); }.project-card { padding:20px; }.project-head, .cart-head, .scan-head { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; }.project-kicker { margin-bottom:6px; color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.08em; }.project-head h3, .cart-head h3, .scan-head h3 { margin:0; font-size:23px; letter-spacing:-.03em; }.status-badge, .pill, .score-badge, .effort-badge, .optional { display:inline-flex; align-items:center; white-space:nowrap; border-radius:999px; padding:4px 8px; border:1px solid var(--line); font-size:10px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; }.status-badge { color:var(--amber-soft); border-color:rgba(244,185,79,.3); background:rgba(244,185,79,.1); }.status-research { color:var(--teal-soft); border-color:rgba(85,214,178,.3); background:rgba(85,214,178,.1); }.status-planning { color:var(--amber-soft); }.status-access { color:var(--slate-950); border-color:transparent; background:var(--teal); }.status-failed { color:#2a0f0b; border-color:transparent; background:var(--red); }.score-strip { display:flex; gap:18px; margin:18px 0; padding:12px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }.score-strip b { color:var(--teal-soft); font-size:19px; line-height:1; }.score-strip .score-total { margin-left:auto; padding-left:18px; border-left:1px solid var(--line); }.score-strip .score-total b { color:var(--amber); }.project-summary { display:grid; grid-template-columns:repeat(2, 1fr); gap:14px 22px; }.field dt, .label { margin-bottom:3px; color:var(--muted); font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.1em; }.field dd { margin:0; color:#dbe8e3; }.project-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; margin-top:18px; }.mini-panel { min-width:0; padding:14px; border:1px solid var(--line); border-radius:12px; background:rgba(11,23,27,.32); }.mini-panel h4, .project-lists h4, .theme-panel h4, .ideas-panel h4 { margin:0 0 10px; color:var(--teal-soft); font-size:11px; text-transform:uppercase; letter-spacing:.1em; }.mini-panel p { margin:0 0 7px; color:#c3d3cd; font-size:13px; }.mini-panel p:last-child { margin-bottom:0; }.big-metric { margin-bottom:5px; color:var(--amber); font-size:28px; font-weight:800; letter-spacing:-.05em; }.big-metric small { color:var(--muted); font-size:11px; letter-spacing:0; }.compact-dl { display:grid; gap:5px; }.compact-dl .field { display:flex; justify-content:space-between; gap:10px; border-bottom:1px solid rgba(196,226,218,.08); padding-bottom:4px; }.compact-dl dd { color:var(--amber-soft); }.project-lists { display:grid; grid-template-columns:repeat(3, 1fr); gap:18px; margin-top:20px; padding-top:17px; border-top:1px solid var(--line); }.list-heading { padding-left:10px; border-left:2px solid var(--teal); }.solved-heading { border-color:var(--teal); }.open-heading { border-color:var(--amber); }.next-heading { border-color:var(--red); }.check-list { margin:0; padding:0; list-style:none; }.check-list li { position:relative; margin:7px 0; padding-left:16px; color:#c5d5d0; font-size:13px; }.check-list li::before { content:""; position:absolute; top:.62em; left:0; width:5px; height:5px; border-radius:50%; background:var(--teal); }.project-foot { display:flex; justify-content:space-between; gap:18px; align-items:center; margin-top:18px; padding-top:14px; border-top:1px solid var(--line); font-size:12px; }.project-foot > .muted { max-width:75%; }.text-link { color:var(--amber-soft); font-weight:800; white-space:nowrap; }.filter-empty { margin:20px 0; color:var(--muted); text-align:center; }.empty-state { display:flex; align-items:center; gap:14px; padding:26px; border:1px dashed var(--line-strong); border-radius:var(--radius); color:var(--muted); }.empty-state h3 { margin:0 0 3px; color:var(--ink); font-size:16px; }.empty-state p { margin:0; }.empty-mark { display:grid; place-items:center; flex:0 0 auto; width:38px; height:38px; border-radius:12px; color:var(--amber); background:rgba(244,185,79,.1); font-size:23px; }
.cart-list { display:grid; gap:15px; }.cart-card { overflow:hidden; }.cart-head { padding:20px 20px 15px; }.cart-head h3 { font-size:20px; }.cart-head p { margin:5px 0 0; font-size:12px; }.cart-total { text-align:right; }.cart-total small { display:block; color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.1em; }.cart-total strong { display:block; color:var(--amber); font-size:27px; letter-spacing:-.05em; }.table-wrap { overflow-x:auto; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }.table-wrap table { width:100%; min-width:720px; border-collapse:collapse; }.table-wrap th { padding:10px 12px; color:var(--muted); background:rgba(11,23,27,.35); font-size:10px; text-align:left; text-transform:uppercase; letter-spacing:.1em; }.table-wrap td { padding:12px; border-top:1px solid rgba(196,226,218,.08); color:#d5e2dd; vertical-align:top; font-size:13px; }.table-wrap td small { display:block; max-width:350px; margin-top:3px; color:var(--muted); font-size:11px; }.table-link { color:var(--amber-soft); font-weight:800; }.optional { display:block; width:max-content; margin-top:6px; padding:2px 5px; color:var(--amber-soft); font-size:9px; }.cart-summary { display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:16px 20px 0; }.cart-summary .label { display:block; }.cart-summary b { color:var(--amber-soft); }.cart-summary .check-list { margin-top:6px; }.cart-notes { margin:16px 20px 20px; color:var(--muted); font-size:12px; }.scans-section { margin-top:10px; }.scan-card { margin-bottom:16px; overflow:hidden; }.scan-head { padding:20px; }.scan-head h3 { font-size:24px; }.meta-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }.pill { color:var(--muted); font-weight:700; text-transform:none; letter-spacing:0; }.muted-pill { border-color:transparent; padding-left:0; }.scan-head .outline-button { margin-top:3px; }.scan-body { display:grid; grid-template-columns:.65fr 1.35fr; gap:0; border-top:1px solid var(--line); }.theme-panel, .ideas-panel { padding:20px; }.theme-panel { border-right:1px solid var(--line); background:rgba(11,23,27,.22); }.theme-cloud { display:flex; flex-wrap:wrap; gap:6px; }.theme-cloud span { padding:6px 8px; color:var(--teal-soft); border:1px solid rgba(85,214,178,.2); border-radius:8px; background:rgba(85,214,178,.06); font-size:12px; }.scan-notes { margin:18px 0 0; padding-top:15px; border-top:1px solid var(--line); color:var(--muted); font-size:12px; }.subhead { display:flex; justify-content:space-between; align-items:baseline; gap:15px; }.ideas-grid { display:grid; gap:9px; }.idea-card { order:var(--order); padding:13px; border:1px solid var(--line); border-radius:12px; background:rgba(255,255,255,.025); }.idea-card.score-high { border-color:rgba(85,214,178,.35); }.idea-card.score-mid { border-color:rgba(244,185,79,.3); }.idea-card.score-low { border-color:rgba(255,138,121,.25); }.idea-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }.idea-head h3 { margin:0; font-size:15px; }.idea-badges { display:flex; flex-wrap:wrap; gap:5px; }.score-badge { color:var(--teal-soft); border-color:rgba(85,214,178,.25); }.effort-s { color:var(--teal-soft); }.effort-m { color:var(--amber-soft); }.effort-l { color:var(--red); }.idea-details { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:11px 0 0; }.idea-details .field dd { font-size:12px; }.archive-heading { margin-top:58px; }.archive-list { display:grid; gap:12px; }.archive-scan .scan-head { padding:16px 18px; }.archive-scan .scan-head h3 { font-size:18px; }.archive-scan .scan-body { display:none; }.footer { display:flex; justify-content:space-between; gap:20px; padding:20px 0 35px; border-top:1px solid var(--line); color:var(--muted); font-size:11px; }.footer p { margin:0; }
@media (max-width:900px) { .overview-grid { grid-template-columns:repeat(2, 1fr); }.project-grid { grid-template-columns:repeat(2, 1fr); }.hero-grid { gap:35px; }.scan-body { grid-template-columns:1fr; }.theme-panel { border-right:0; border-bottom:1px solid var(--line); } }
@media (max-width:640px) { .shell { width:min(100% - 28px, 1180px); }.hero { padding-top:16px; }.topbar { padding-bottom:40px; }.top-links { display:none; }.hero-grid { grid-template-columns:1fr; gap:25px; }.hero-copy { font-size:15px; } main { padding-top:40px; }.section-heading, .archive-heading { display:block; }.section-description { margin-top:8px; text-align:left; }.overview-grid { grid-template-columns:1fr 1fr; gap:8px; }.overview-card { min-height:150px; padding:14px; }.overview-card h3 { font-size:12px; }.status-stats { gap:10px; }.status-stats b { font-size:19px; }.toolbar { align-items:stretch; }.filter-group { overflow-x:auto; flex-wrap:nowrap; padding-bottom:2px; }.sort-control { justify-content:space-between; }.sort-control select { flex:1; }.project-card, .cart-head, .scan-head { padding:16px; }.project-head, .cart-head, .scan-head { flex-direction:column; gap:12px; }.project-head .status-badge { align-self:flex-start; }.project-head h3 { font-size:21px; }.project-summary, .project-grid, .project-lists, .cart-summary, .idea-details { grid-template-columns:1fr; }.score-strip { gap:12px; }.score-strip .score-total { padding-left:12px; }.project-foot, .footer { align-items:flex-start; flex-direction:column; }.project-foot > .muted { max-width:100%; }.cart-total { text-align:left; }.cart-total strong { font-size:24px; }.theme-panel, .ideas-panel { padding:16px; }.idea-head { flex-direction:column; }.footer { gap:8px; } }
`;

const JS = `document.addEventListener("DOMContentLoaded", function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-project-card]"));
  var list = document.querySelector("[data-project-list]");
  var empty = document.querySelector("[data-filter-empty]");
  var filterButtons = document.querySelectorAll("[data-status-filter]");
  var sort = document.getElementById("project-sort");
  var activeStatus = "all";

  function refresh() {
    var mode = sort ? sort.value : "priority";
    var visible = cards.filter(function (card) {
      return activeStatus === "all" || card.getAttribute("data-status") === activeStatus;
    });
    cards.forEach(function (card) { card.hidden = visible.indexOf(card) === -1; });
    visible.sort(function (a, b) {
      if (mode === "title") return a.querySelector("h3").textContent.localeCompare(b.querySelector("h3").textContent);
      var key = mode === "score" ? "data-score" : "data-priority";
      var first = Number(a.getAttribute(key) || 0), second = Number(b.getAttribute(key) || 0);
      return mode === "priority" ? first - second : second - first;
    });
    visible.forEach(function (card) { list.appendChild(card); });
    if (empty) empty.hidden = visible.length !== 0;
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeStatus = button.getAttribute("data-status-filter") || "all";
      filterButtons.forEach(function (item) { item.classList.toggle("active", item === button); });
      refresh();
    });
  });
  if (sort) sort.addEventListener("change", refresh);
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      var target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      event.preventDefault(); target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  refresh();
});
`;

function writeAssets() {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.writeFileSync(path.join(ASSETS_DIR, "styles.css"), CSS);
  fs.writeFileSync(path.join(ASSETS_DIR, "app.js"), JS);
}

function main() {
  const entries = readLog(LOG_PATH);
  const projects = readJsonDirectory(PROJECTS_DIR).sort((a, b) => (Number(a.priority) || 99) - (Number(b.priority) || 99));
  const carts = readJsonDirectory(CARTS_DIR).sort((a, b) => String(a.title || a.id || "").localeCompare(String(b.title || b.id || "")));
  writeAssets();
  fs.writeFileSync(OUT_HTML, buildHtml({ entries, projects, carts }));
  console.log(`Built ${OUT_HTML}`);
  console.log(`Scans: ${entries.length} · Projects: ${projects.length} · Carts: ${carts.length}`);
}

main();
