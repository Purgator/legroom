# Legroom

A tiny Chrome extension that lets you **scroll past the end of a page**, so the footer (or last paragraph) can sit in the middle of your screen instead of being pinned to the bottom — much easier on the eyes when reading.

## How it works

Legroom appends an invisible 50 vh spacer at the very end of every page, giving you extra scroll room after the real content ends. No layout changes, no visual noise — just breathing room.

## Settings

There is exactly one setting: **per-site exceptions**.

Click the Legroom icon in the toolbar to:

- **Disable on this site** — adds the current site to the exception list (takes effect immediately, subdomains included).
- **Enable on this site** — removes it again.
- View and remove any exception from the list.

Exceptions are synced across your Chrome profile via `chrome.storage.sync`.

## Install

Legroom is not on the Chrome Web Store; you install it as an unpacked extension. It works in Chrome and any Chromium-based browser (Edge, Brave, Opera, Vivaldi…).

1. Download `legroom-vX.Y.Z.zip` from the [latest release](https://github.com/Purgator/legroom/releases/latest) and extract it to a folder you'll keep (Chrome loads the extension from that folder — don't delete it afterwards).
2. Open `chrome://extensions` in your browser.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the extracted folder.
5. That's it — pin the Legroom icon to your toolbar if you want quick access to the per-site toggle.

To update to a newer release, extract the new zip over the same folder and click the reload arrow on the Legroom card in `chrome://extensions`.

### Install from source

Clone this repository and follow steps 2–4 above, selecting the repository folder.

## Files

| File | Role |
| --- | --- |
| `manifest.json` | Manifest V3 definition |
| `content.js` | Injects the end-of-page spacer, honors exceptions live |
| `popup.html/css/js` | Toolbar popup for managing site exceptions |
| `icons/` | Extension icons |
