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

## Install (unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.

## Files

| File | Role |
| --- | --- |
| `manifest.json` | Manifest V3 definition |
| `content.js` | Injects the end-of-page spacer, honors exceptions live |
| `popup.html/css/js` | Toolbar popup for managing site exceptions |
| `icons/` | Extension icons |
