# Legroom

A tiny browser extension (Chrome & Firefox) that lets you **scroll past the end of a page**, so the footer (or last paragraph) can sit in the middle of your screen instead of being pinned to the bottom — much easier on the eyes when reading.

## How it works

Legroom appends an invisible 50 vh spacer at the very end of every page, giving you extra scroll room after the real content ends. No layout changes, no visual noise — just breathing room.

## Settings

There is exactly one setting: **per-site exceptions**.

Click the Legroom icon in the toolbar to:

- **Disable on this site** — adds the current site to the exception list (takes effect immediately, subdomains included).
- **Enable on this site** — removes it again.
- View and remove any exception from the list.

Exceptions are synced across your browser profile via `storage.sync`.

Legroom is also permanently off on extension store pages (Chrome Web Store, addons.mozilla.org, Edge Add-ons…). Browsers already block extensions on their own store and on internal pages like `chrome://extensions`; the built-in exceptions cover the other browsers' stores, which are ordinary websites.

## Install

Legroom is not on the extension stores yet; you install it from a release zip.

### Chrome (and Edge, Brave, Opera, Vivaldi…)

1. Download `legroom-vX.Y.Z.zip` from the [latest release](https://github.com/Purgator/legroom/releases/latest) and extract it to a folder you'll keep (Chrome loads the extension from that folder — don't delete it afterwards).
2. Open `chrome://extensions` in your browser.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the extracted folder.
5. That's it — pin the Legroom icon to your toolbar if you want quick access to the per-site toggle.

To update to a newer release, extract the new zip over the same folder and click the reload arrow on the Legroom card in `chrome://extensions`.

### Firefox

Firefox only keeps unsigned extensions until you restart the browser, so the zip installs as a *temporary add-on*:

1. Download `legroom-vX.Y.Z.zip` from the [latest release](https://github.com/Purgator/legroom/releases/latest) (no need to extract it).
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select the zip.
4. Click the Legroom toolbar icon and press **Grant access** in the banner — unlike Chrome, Firefox doesn't grant website access at install time, and Legroom does nothing until you do. Reload any tabs that were already open.

The add-on disappears when Firefox restarts; repeat the steps to load it again. For a permanent install, Firefox requires the extension to be signed by Mozilla — if that's your daily browser, open an issue and we'll look at publishing on [addons.mozilla.org](https://addons.mozilla.org). (On Firefox Developer Edition or Nightly you can instead set `xpinstall.signatures.required` to `false` in `about:config`, rename the zip to `legroom.xpi`, and install it from `about:addons` permanently.)

### Install from source

Clone this repository and follow the Chrome steps 2–4 above, selecting the repository folder (or load `manifest.json` as a temporary add-on in Firefox).

## Files

| File | Role |
| --- | --- |
| `manifest.json` | Manifest V3 definition |
| `content.js` | Injects the end-of-page spacer, honors exceptions live |
| `popup.html/css/js` | Toolbar popup for managing site exceptions |
| `icons/` | Extension icons |
