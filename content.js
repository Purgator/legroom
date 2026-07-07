// Legroom — adds scrollable space after the end of the page so the footer
// can be brought up to the middle of the screen.

const SPACER_ID = "__legroom_spacer__";
let enabled = false;

function isExcluded(host, exceptions) {
  return exceptions.some(
    (entry) => host === entry || host.endsWith("." + entry)
  );
}

function addSpacer() {
  if (document.getElementById(SPACER_ID)) return;
  const spacer = document.createElement("div");
  spacer.id = SPACER_ID;
  // 50vh of dead space lets the very bottom of the page reach mid-screen.
  spacer.style.cssText = [
    "display: block",
    "height: 50vh",
    "width: 1px",
    "flex-shrink: 0",
    "pointer-events: none",
    "background: transparent",
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
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.exceptions) apply();
});

apply().then(() => {
  observer.observe(document.body, { childList: true });
});
