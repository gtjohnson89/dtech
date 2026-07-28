/**
 * Capture mobile screenshots of all three direction demos.
 */
import puppeteer from "/tmp/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const OUT = join(ROOT, "screenshots");
const ARTIFACTS = "/opt/cursor/artifacts/screenshots";

mkdirSync(OUT, { recursive: true });
mkdirSync(ARTIFACTS, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0].split("#")[0]);
  let filePath = join(ROOT, urlPath);
  if (urlPath.endsWith("/")) filePath = join(filePath, "index.html");
  if (!filePath.startsWith(ROOT) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
  res.end(readFileSync(filePath));
});

await new Promise((resolve) => server.listen(8799, "127.0.0.1", resolve));
const base = "http://127.0.0.1:8799";

const demos = [
  {
    id: "care-trials",
    path: "/care-trials/",
    screens: [
      { key: "care-moments-home", hash: "#home" },
      { key: "problem-portrait", hash: "#portrait" },
      { key: "trial-plan", hash: "#trial" },
      { key: "quick-checkin", hash: "#checkin" },
      { key: "what-families-learned", hash: "#learned" },
      { key: "georges-workbench", hash: "#workbench" },
    ],
  },
  {
    id: "this-week-at-home",
    path: "/this-week-at-home/",
    screens: [
      { key: "home", hash: "#home" },
      { key: "problem", hash: "#problem" },
      { key: "checkin", hash: "#checkin" },
      { key: "decision", hash: "#decision" },
      { key: "journey", hash: "#journey" },
      { key: "household", hash: "#household" },
    ],
  },
  {
    id: "care-build-foundry",
    path: "/care-build-foundry/",
    screens: [
      { key: "build-control", screenId: "build-control" },
      { key: "problem-brief", screenId: "problem-brief" },
      { key: "variant-tree", screenId: "variant-tree" },
      { key: "proposal-review", screenId: "proposal-review" },
      { key: "build-kit", screenId: "build-kit" },
      { key: "field-trial", screenId: "field-trial" },
    ],
  },
];

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

for (const demo of demos) {
  for (const screen of demo.screens) {
    const url = `${base}${demo.path}${screen.hash || ""}`;
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    if (screen.screenId) {
      await page.evaluate((id) => {
        const btn = document.querySelector(`[data-nav="${id}"]`);
        if (btn) btn.click();
        else if (typeof window.goTo === "function") window.goTo(id);
        else {
          document.querySelectorAll("[data-screen]").forEach((el) => {
            const match = el.getAttribute("data-screen") === id;
            el.classList.toggle("is-active", match);
            if (match) el.removeAttribute("hidden");
            else el.setAttribute("hidden", "");
          });
        }
      }, screen.screenId);
      await new Promise((r) => setTimeout(r, 450));
    } else {
      await new Promise((r) => setTimeout(r, 500));
    }

    // Prefer full page for content-heavy screens; clip hero to viewport for first screens
    const name = `${demo.id}__${screen.key}.png`;
    const dest = join(OUT, name);
    const art = join(ARTIFACTS, name);
    await page.screenshot({ path: dest, fullPage: true });
    await page.screenshot({ path: art, fullPage: true });
    console.log("captured", name);
  }
}

await browser.close();
server.close();
console.log("done");
