const http = require("http");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const EXT_PATH = path.join(__dirname, "..");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SPACER_ID = "__legroom_spacer__";

const server = http.createServer((req, res) => {
  const file = path.join(__dirname, req.url === "/" ? "app.html" : req.url);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async () => {
  await new Promise((r) => server.listen(8123, r));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    enableExtensions: true,
    args: [
      "--no-first-run",
      "--window-size=1280,800",
      // Lets the built-in-exception test reach the local server under a
      // store hostname
      "--host-resolver-rules=MAP chromewebstore.google.com 127.0.0.1",
    ],
  });
  await browser.installExtension(EXT_PATH);

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  let failures = 0;

  // --- App-style page (Azure DevOps layout) ---
  await page.goto("http://localhost:8123/app.html");
  await sleep(1500); // let the fake SPA render burst + observer run
  const app = await page.evaluate((id) => ({
    spacer: !!document.getElementById(id),
    mainHeight: document.querySelector("main").getBoundingClientRect().height,
    headerVisible: document.querySelector("header").getBoundingClientRect().height,
    docScrollable: document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight,
  }), SPACER_ID);
  console.log("app.html:", JSON.stringify(app));
  if (app.spacer) { console.log("FAIL: spacer injected on app-style page"); failures++; }
  if (app.mainHeight < 600) { console.log("FAIL: app content squashed to " + app.mainHeight + "px"); failures++; }
  if (app.docScrollable) { console.log("FAIL: document became scrollable on app-style page"); failures++; }

  // --- Normal article page ---
  await page.goto("http://localhost:8123/article.html");
  await sleep(1500);
  const article = await page.evaluate((id) => {
    const spacer = document.getElementById(id);
    return {
      spacer: !!spacer,
      spacerHeight: spacer ? spacer.offsetHeight : 0,
      spacerBg: spacer ? getComputedStyle(spacer).backgroundColor : null,
      isLast: spacer ? spacer === document.body.lastElementChild : false,
    };
  }, SPACER_ID);
  console.log("article.html:", JSON.stringify(article));
  if (!article.spacer) { console.log("FAIL: no spacer on normal article page"); failures++; }
  if (article.spacer && Math.abs(article.spacerHeight - 400) > 5) { console.log("FAIL: spacer height " + article.spacerHeight + ", expected ~400 (50vh of 800)"); failures++; }
  if (article.spacer && article.spacerBg !== "rgb(20, 30, 40)") { console.log("FAIL: spacer bg " + article.spacerBg + ", expected footer color rgb(20, 30, 40)"); failures++; }

  // --- Built-in exception: extension store hostname ---
  await page.goto("http://chromewebstore.google.com:8123/article.html");
  await sleep(1500);
  const store = await page.evaluate((id) => !!document.getElementById(id), SPACER_ID);
  console.log("store hostname:", JSON.stringify({ spacer: store }));
  if (store) { console.log("FAIL: spacer injected on extension store hostname"); failures++; }

  await browser.close();
  server.close();
  console.log(failures === 0 ? "ALL TESTS PASSED" : failures + " FAILURE(S)");
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
