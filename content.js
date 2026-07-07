// Legroom — adds scrollable space after the end of the page so the footer
// can be brought up to the middle of the screen.

const SPACER_ID = "__legroom_spacer__";
let enabled = false;

function isExcluded(host, exceptions) {
  return exceptions.some(
    (entry) => host === entry || host.endsWith("." + entry)
  );
}

function isTransparent(color) {
  return !color || color === "transparent" || /rgba\(.*,\s*0\)$/.test(color);
}

// Effective background color at the bottom of the page: the last visible
// element in <body> (usually the footer), then its ancestors, then <html>.
function resolveSiteColor() {
  let bottom = null;
  for (let el = document.body.lastElementChild; el; el = el.previousElementSibling) {
    if (el.id === SPACER_ID || el instanceof HTMLScriptElement || el instanceof HTMLStyleElement) continue;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    if (style.position === "fixed" || el.getBoundingClientRect().height === 0) continue;
    bottom = el;
    break;
  }
  for (let el = bottom; el; el = el.parentElement) {
    const color = getComputedStyle(el).backgroundColor;
    if (!isTransparent(color)) return color;
  }
  const htmlColor = getComputedStyle(document.documentElement).backgroundColor;
  return isTransparent(htmlColor) ? "#fff" : htmlColor;
}

function addSpacer() {
  if (document.getElementById(SPACER_ID)) return;
  const spacer = document.createElement("div");
  spacer.id = SPACER_ID;
  // 50vh of dead space lets the very bottom of the page reach mid-screen.
  spacer.style.cssText = [
    "display: block",
    "height: 50vh",
    "width: 100%",
    "flex-shrink: 0",
    "pointer-events: none",
    `background: ${resolveSiteColor()}`,
    "border: 0",
    "margin: 0",
    "padding: 0",
  ].join(" !important;") + " !important;";
  spacer.setAttribute("aria-hidden", "true");
  document.body.appendChild(spacer);
}

function removeSpacer() {
  const spacer = document.getElementById(SPACER_ID);
  if (spacer) spacer.remove();
}

async function apply() {
  const { exceptions = [] } = await chrome.storage.sync.get("exceptions");
  enabled = !isExcluded(location.hostname, exceptions);
  if (enabled) {
    addSpacer();
  } else {
    removeSpacer();
  }
}

// Some sites rebuild <body> content after load; re-add the spacer if it gets
// wiped and keep it as the last element of the page.
const observer = new MutationObserver(() => {
  if (!enabled) return;
  const spacer = document.getElementById(SPACER_ID);
  if (!spacer) {
    addSpacer();
  } else if (spacer !== document.body.lastElementChild) {
    document.body.appendChild(spacer);
    spacer.style.setProperty("background", resolveSiteColor(), "important");
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.exceptions) apply();
});

apply().then(() => {
  observer.observe(document.body, { childList: true });
});
