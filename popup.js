// Must match content_scripts matches in manifest.json. Chrome grants these
// at install; Firefox MV3 treats them as optional, so until the user grants
// them the content script silently never runs.
const HOST_ORIGINS = ["http://*/*", "https://*/*"];

async function renderPermissionBanner() {
  let granted = true;
  try {
    granted = await chrome.permissions.contains({ origins: HOST_ORIGINS });
  } catch {
    // permissions API unavailable — assume granted rather than nag
  }
  const banner = document.getElementById("perm-banner");
  banner.hidden = granted;
  document.getElementById("grant-perms").onclick = async () => {
    const ok = await chrome.permissions.request({ origins: HOST_ORIGINS });
    if (ok) banner.hidden = true;
  };
}

async function getExceptions() {
  const { exceptions = [] } = await chrome.storage.sync.get("exceptions");
  return exceptions;
}

function setExceptions(exceptions) {
  return chrome.storage.sync.set({ exceptions });
}

async function getCurrentHost() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return null;
  try {
    const url = new URL(tab.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.hostname;
  } catch {
    return null;
  }
}

async function render() {
  const [exceptions, host] = await Promise.all([
    getExceptions(),
    getCurrentHost(),
  ]);

  const currentSection = document.getElementById("current-site");
  const toggleBtn = document.getElementById("toggle-site");

  if (host) {
    currentSection.hidden = false;
    document.getElementById("site-name").textContent = host;
    const disabled = exceptions.includes(host);
    toggleBtn.textContent = disabled
      ? "Enable on this site"
      : "Disable on this site";
    toggleBtn.classList.toggle("enable", disabled);
    toggleBtn.onclick = async () => {
      const list = await getExceptions();
      await setExceptions(
        disabled ? list.filter((e) => e !== host) : [...list, host]
      );
      render();
    };
  } else {
    currentSection.hidden = true;
  }

  const listEl = document.getElementById("exception-list");
  listEl.textContent = "";
  document.getElementById("empty-note").hidden = exceptions.length > 0;

  for (const entry of exceptions) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = entry;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = async () => {
      const list = await getExceptions();
      await setExceptions(list.filter((e) => e !== entry));
      render();
    };
    li.append(span, removeBtn);
    listEl.appendChild(li);
  }
}

renderPermissionBanner();
render();
