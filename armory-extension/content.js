// ── State ──────────────────────────────────────────────
let armoryShadowRoot = null;
let armoryContainer = null;
let queryTimeout = null;
let hideTimeout = null;
let currentAddress = null;

function isSolanaAddress(str) {
  if (!str) return false;
  str = str.trim();
  if (str.length < 32 || str.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(str);
}

// ── UI Logic ───────────────────────────────────────────
function ensureContainer() {
  if (armoryContainer && document.body.contains(armoryContainer)) return;
  
  armoryContainer = document.createElement("div");
  armoryContainer.id = "armory-root-" + Math.random().toString(36).substring(7);
  armoryContainer.style.all = "initial";
  document.body.appendChild(armoryContainer);
  armoryShadowRoot = armoryContainer.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    #card {
      position: fixed; bottom: 24px; right: 24px; width: 300px; z-index: 2147483647;
      font-family: system-ui, -apple-system, sans-serif;
      background: #0A0F1A; border: 1px solid #1A2A3A; border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5); color: #F0F4F8;
      transition: all 0.3s ease; opacity: 0; transform: translateY(10px);
      pointer-events: auto;
    }
    #card.show { opacity: 1; transform: translateY(0); }
    .v { border-left: 4px solid #10B981; }
    .u { border-left: 4px solid #F59E0B; }
    .l { border-left: 4px solid #00A896; }
    .pad { padding: 16px; }
    .title { font-weight: 800; font-size: 11px; color: #00A896; margin-bottom: 8px; }
    .name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .domain { color: #8B949E; font-size: 13px; }
    .addr { font-family: monospace; font-size: 10px; color: #484F58; margin-top: 10px; word-break: break-all; }
    .spinner { width: 16px; height: 16px; border: 2px solid #1A2A3A; border-top-color: #00A896; border-radius: 50%; animation: s 0.8s linear infinite; }
    @keyframes s { to { transform: rotate(360deg); } }
  `;
  armoryShadowRoot.appendChild(style);
}

function updateUI(data) {
  ensureContainer();
  let host = armoryShadowRoot.getElementById("card");
  if (!host) {
    host = document.createElement("div");
    host.id = "card";
    armoryShadowRoot.appendChild(host);
  }

  const { status, address, entityName, domain } = data;
  const trunc = (address || "").slice(0, 8) + "..." + (address || "").slice(-8);

  if (status === "loading") {
    host.className = "l";
    host.innerHTML = `<div class="pad"><div class="spinner"></div><div style="margin-top:8px">Verifying ${trunc}</div></div>`;
  } else if (status === "Verified") {
    host.className = "v";
    host.innerHTML = `<div class="pad"><div class="title">✅ VERIFIED MERCHANT</div><div class="name">${entityName}</div><div class="domain">${domain}</div><div class="addr">${address}</div></div>`;
  } else {
    host.className = "u";
    host.innerHTML = `<div class="pad"><div class="title">⚠️ UNVERIFIED</div><div class="name">Unknown Identity</div><div class="domain">Not in Armory registry</div><div class="addr">${address}</div></div>`;
  }

  setTimeout(() => host.classList.add("show"), 10);
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => host.classList.remove("show"), 20000);
}

// ── Logic ──────────────────────────────────────────────
async function runQuery(address) {
  if (address === currentAddress) return;
  currentAddress = address;
  updateUI({ status: "loading", address });

  try {
    const res = await armoryQueryByAddress(address);
    if (address !== currentAddress) return;
    updateUI({ ...res, address });
  } catch (e) {
    console.error("Armory Extension: RunQuery Error", e);
    currentAddress = null;
  }
}

document.addEventListener("paste", (e) => {
  const text = e.clipboardData?.getData("text")?.trim();
  if (isSolanaAddress(text)) runQuery(text);
}, true);

document.addEventListener("input", (e) => {
  const val = e.target.value?.trim();
  if (isSolanaAddress(val)) {
    clearTimeout(queryTimeout);
    queryTimeout = setTimeout(() => runQuery(val), 600);
  }
}, true);
