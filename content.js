// Legroom — adds scrollable space after the end of the page so the footer
// can be brought up to the middle of the screen.

const SPACER_ID = "__legroom_spacer__";
let enabled = false;


// App-style pages (Azure DevOps, Gmail…) size their layout to the viewport
// and scroll in inner containers; injecting a 50vh child there breaks the
// layout (fixed-height flex/grid shells squash or overlay the app) and is
// useless anyway since the document never scrolls. Only add legroom when
// document scrolling isn't disabled AND the page content is actually taller
// than the viewport — the one case where a footer needs lifting.
function pageNeedsLegroom() {
  const hidden = (v) => v === "hidden" || v === "clip";
  if (
    hidden(getComputedStyle(document.documentElement).overflowY) ||
    hidden(getComputedStyle(document.body).overflowY)
  ) {
    return false;
  }
  const spacer = document.getElementById(SPACER_ID);
  const spacerHeight = spacer ? spacer.offsetHeight : 0;
  const scroller = document.scrollingElement || document.documentElement;
  return scroller.scrollHeight - spacerHeight > scroller.clientHeight + 1;
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
  enabled =
    !legroomHostMatches(location.hostname, LEGROOM_BUILTIN_EXCEPTIONS) &&
    !legroomHostMatches(location.hostname, exceptions);
  if (enabled && pageNeedsLegroom()) {
    addSpacer();
  } else {
    removeSpacer();
  }
}

function syncSpacer() {
  if (!enabled) return;
  if (!pageNeedsLegroom()) {
    removeSpacer();
    return;
  }
  const spacer = document.getElementById(SPACER_ID);
  if (!spacer) {
    addSpacer();
  } else if (spacer !== document.body.lastElementChild) {
    document.body.appendChild(spacer);
    spacer.style.setProperty("background", resolveSiteColor(), "important");
  }
}

// Some sites rebuild <body> content after load; re-add the spacer if it gets
// wiped and keep it as the last element of the page. SPAs may also switch
// document scrolling off after load — pull the spacer back out then.
// Throttled to one check per animation frame: syncSpacer reads computed
// styles and scrollHeight, and busy SPAs (Discord…) mutate the DOM
// constantly — checking on every mutation would force layout each time.
let checkScheduled = false;
const observer = new MutationObserver(() => {
  if (!enabled || checkScheduled) return;
  checkScheduled = true;
  requestAnimationFrame(() => {
    checkScheduled = false;
    syncSpacer();
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.exceptions) apply();
});

if (document.body) {
  apply().then(() => {
    observer.observe(document.body, {
      childList: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  });
}
