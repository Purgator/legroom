// Shared between the content script and the popup.

// Hosts where Legroom is always off: extension store pages. Browsers block
// extensions on their own store and internal pages, but the other browsers'
// stores are ordinary websites — keep hands off there too.
const LEGROOM_BUILTIN_EXCEPTIONS = [
  "chromewebstore.google.com",
  "chrome.google.com",
  "addons.mozilla.org",
  "addons.thunderbird.net",
  "microsoftedge.microsoft.com",
];

function legroomHostMatches(host, entries) {
  return entries.some((entry) => host === entry || host.endsWith("." + entry));
}
