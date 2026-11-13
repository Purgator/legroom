// Regenerates the README screenshots in docs/ from the real extension code:
// content.js runs on a made-up reading blog (test/demo-page.html) and
// popup.html is docked on top of it, with just enough of the chrome.* APIs
// stubbed.
// Usage: node scripts/screenshots.js
// Uses the test suite's puppeteer-core (run `npm install` in test/ once) and
// the same Chrome as test/test.js: set CHROME_PATH to use another one.
// A small static server is started on PORT (default 6802) and stopped at the end.
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.join(__dirname, "..");
const puppeteer = require(require.resolve("puppeteer-core", { paths: [path.join(root, "test")] }));
const docs = path.join(root, "docs");
const PORT = Number(process.env.PORT) || 6802;
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
// A fake hostname (mapped to this machine below) so the popup shows a site
// name instead of "localhost".
const HOST = "slow-pages.example";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const file = path.join(root, pathname === "/" ? "test/demo-page.html" : path.normalize(pathname));
  fs.readFile(file, (err, data) => {
    if (err || !file.startsWith(root)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": `${TYPES[path.extname(file)] || "application/octet-stream"}; charset=utf-8` });
    res.end(data);
  });
});

// Runs in every frame before its own scripts. The page and the popup share
// one in-memory storage (kept on the top window), with change events, so a
// click in the popup reaches the content script like in the real extension.
function stubChrome() {
  const shared = (window.top.__legroom ||= { state: { exceptions: [] }, listeners: [] });
  window.chrome = {
    permissions: {
      contains: () => Promise.resolve(true),
      request: () => Promise.resolve(true),
    },
    storage: {
      sync: {
        get: () => Promise.resolve({ ...shared.state }),
        set: (patch) => {
          const changes = {};
          for (const [k, v] of Object.entries(patch)) {
            changes[k] = { newValue: v, oldValue: shared.state[k] };
            shared.state[k] = v;
          }
          for (const l of shared.listeners) l(changes, "sync");
          return Promise.resolve();
        },
      },
      onChanged: { addListener: (fn) => shared.listeners.push(fn) },
    },
    tabs: {
      query: () => Promise.resolve([{ url: window.top.location.href }]),
    },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  fs.mkdirSync(docs, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-first-run", `--host-resolver-rules=MAP ${HOST} 127.0.0.1`],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1360, height: 780, deviceScaleFactor: 1.5 });
    await page.evaluateOnNewDocument(stubChrome);

    // Loads the demo page, runs the content script on it and scrolls as far
    // down as the page goes.
    const open = async (scheme, exceptions) => {
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
      await page.goto(`http://${HOST}:${PORT}/`);
      await page.evaluate((list) => { window.__legroom.state.exceptions = list; }, exceptions);
      await page.addScriptTag({ url: "/common.js" });
      await page.addScriptTag({ url: "/content.js" });
      await scrollToEnd();
    };
    const scrollToEnd = async () => {
      await sleep(300);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await sleep(300);
    };
    // Docks popup.html at the top right, sized to its content like the
    // browser does.
    const openPopup = async () => {
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            const frame = document.createElement("iframe");
            frame.id = "popup";
            frame.src = "/popup.html";
            frame.style.cssText =
              "position:fixed;top:8px;right:22px;width:308px;height:200px;z-index:99;" +
              "border:1px solid rgba(128,128,128,.45);border-radius:8px;" +
              "box-shadow:0 10px 30px rgba(0,0,0,.3);color-scheme:light dark;background:Canvas;";
            frame.onload = resolve;
            // Outside <body>, so the page layout (and the spacer) is left alone.
            document.documentElement.appendChild(frame);
          })
      );
      await fitPopup();
      return (await page.$("#popup")).contentFrame();
    };
    const fitPopup = async () => {
      await sleep(300);
      await page.evaluate(() => {
        const frame = document.getElementById("popup");
        frame.style.height = `${frame.contentDocument.documentElement.scrollHeight}px`;
      });
      await sleep(200);
    };
    // The popup alone: squared off and cut exactly at its edges, so nothing
    // of the page shows around it.
    const popupClip = async () => {
      await page.$eval("#popup", (frame) => {
        frame.style.border = frame.style.borderRadius = "0";
        window.scrollTo(0, 0); // clips are measured from the top of the page
      });
      const box = await (await page.$("#popup")).boundingBox();
      // Even height: a whole number of device pixels at scale factor 1.5.
      return { ...box, height: Math.floor(box.height / 2) * 2 };
    };
    const others = ["mail.example.com", "maps.example.org"];

    // 1. The end of a page with Legroom, popup open.
    await open("light", others);
    await openPopup();
    await page.screenshot({ path: path.join(docs, "legroom.png") });

    // 2. The popup alone.
    await page.screenshot({ path: path.join(docs, "popup.png"), clip: await popupClip() });

    // 3. The end of the same page, with and without Legroom.
    await open("light", []);
    await page.screenshot({ path: path.join(docs, "end-with.png") });
    await open("light", [HOST]);
    await page.screenshot({ path: path.join(docs, "end-without.png") });

    // 4. The popup alone, dark theme, after turning Legroom off on this site.
    await open("dark", others);
    const popup = await openPopup();
    await popup.click("#toggle-site");
    await fitPopup();
    await page.screenshot({ path: path.join(docs, "popup-site-off.png"), clip: await popupClip() });

    console.log("screenshots written to docs/");
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
