// ── State ──────────────────────────────────────────────
let armoryShadowRoot = null;
let armoryContainer = null;
let queryTimeout = null; // Separate timeout for debouncing
let hideTimeout = null;  // Separate timeout for auto-hiding
let currentAddress = null;

// ── Helpers ────────────────────────────────────────────
function isSolanaAddress(str) {
  if (!str) return false;
  str = str.trim();
  if (str.length < 32 || str.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(str);
}

// ── Shadow DOM Setup ───────────────────────────────────
function ensureContainer() {
  if (armoryContainer) return;

  armoryContainer = document.createElement("div");
  armoryContainer.id = "armory-extension-root";
  armoryContainer.style.all = "initial"; 
  document.body.appendChild(armoryContainer);

  armoryShadowRoot = armoryContainer.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    #card-host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 300px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      pointer-events: auto;
      transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      transform: translateY(20px);
    }
    #card-host.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .inner {
      background: #0A0F1A;
      border: 1px solid #1A2A3A;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
      color: #F0F4F8;
    }
    .verified   { border-left: 5px solid #10B981; }
    .unverified { border-left: 5px solid #F59E0B; }
    .loading    { border-left: 5px solid #00A896; }

    .header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #05080F; border-bottom: 1px solid #1A2A3A; }
    .logo { color: #00A896; font-weight: 800; font-size: 11px; letter-spacing: 1.5px; }
    .badge { font-size: 10px; font-weight: 900; padding: 3px 10px; border-radius: 5px; text-transform: uppercase; }
    .badge-v { color: #10B981; background: rgba(16,185,129,0.15); }
    .badge-u { color: #F59E0B; background: rgba(245,158,11,0.15); }
    
    .body { padding: 18px; }
    .name { font-size: 17px; font-weight: 700; margin-bottom: 6px; color: #FFFFFF; }
    .domain { color: #00A896; font-size: 13px; margin-bottom: 14px; font-weight: 500; }
    .addr { font-family: "JetBrains Mono", monospace; font-size: 11px; color: #8B949E; background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; word-break: break-all; }
    .divider { height: 1px; background: #1A2A3A; margin: 14px 0; }
    .footer-text { font-size: 12px; color: #8B949E; line-height: 1.6; }
    
    .close-btn { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.05); border: none; color: #484F58; cursor: pointer; font-size: 14px; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .close-btn:hover { color: #FFFFFF; background: rgba(255,255,255,0.1); }
    
    .spinner { width: 22px; height: 22px; border: 3px solid rgba(0,168,150,0.1); border-top-color: #00A896; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 10px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  armoryShadowRoot.appendChild(style);

  const host = document.createElement("div");
  host.id = "card-host";
  armoryShadowRoot.appendChild(host);
}

// ── UI Rendering ───────────────────────────────────────
function updateUI(data) {
  ensureContainer();
  const host = armoryShadowRoot.getElementById("card-host");
  
  if (!data) {
    host.classList.remove("visible");
    return;
  }

  const { status, address, entityName, domain } = data;
  const truncAddr = (address || "").slice(0, 10) + "..." + (address || "").slice(-10);

  let content = "";
  if (status === "loading") {
    content = `
      <div class="inner loading">
        <div class="body">
          <div class="spinner"></div>
          <div class="name">Verifying Address...</div>
          <div class="addr">${truncAddr}</div>
        </div>
      </div>
    `;
  } else if (status === "Verified") {
    content = `
      <div class="inner verified">
        <button class="close-btn" title="Dismiss">✕</button>
        <div class="header">
          <div class="logo">ARMORY PROTOCOL</div>
          <div class="badge badge-v">✅ VERIFIED</div>
        </div>
        <div class="body">
          <div class="name">${entityName || "Verified Entity"}</div>
          <div class="domain">${domain}</div>
          <div class="addr">${truncAddr}</div>
          <div class="divider"></div>
          <div class="footer-text">✓ Identity confirmed on-chain. Safe to send assets.</div>
        </div>
      </div>
    `;
  } else {
    content = `
      <div class="inner unverified">
        <button class="close-btn" title="Dismiss">✕</button>
        <div class="header">
          <div class="logo">ARMORY PROTOCOL</div>
          <div class="badge badge-u">⚠️ UNVERIFIED</div>
        </div>
        <div class="body">
          <div class="name">Unknown Identity</div>
          <div class="addr">${truncAddr}</div>
          <div class="divider"></div>
          <div class="footer-text">This address is NOT in the Armory registry. Verify manually before sending.</div>
        </div>
      </div>
    `;
  }

  host.innerHTML = content;
  // Use timeout to ensure DOM is ready for transition
  setTimeout(() => host.classList.add("visible"), 10);

  const closeBtn = host.querySelector(".close-btn");
  if (closeBtn) closeBtn.onclick = hideCard;
}

function hideCard() {
  const host = armoryShadowRoot?.getElementById("card-host");
  if (host) {
    host.classList.remove("visible");
    // Wait for animation to finish before clearing state
    setTimeout(() => {
        if (!host.classList.contains("visible")) {
            currentAddress = null;
        }
    }, 400);
  }
}

// ── Query Logic ────────────────────────────────────────
async function triggerQuery(address) {
  if (!isSolanaAddress(address)) return;
  if (address === currentAddress && armoryShadowRoot?.getElementById("card-host")?.classList.contains("visible")) return;
  
  currentAddress = address;
  updateUI({ status: "loading", address });

  try {
    const result = await chrome.runtime.sendMessage({
      type: "ARMORY_QUERY_ADDRESS",
      address: address
    });

    if (address !== currentAddress) return;

    if (result.success) {
      const decoded = decodeEntityRecord(result.accountData);
      updateUI({ ...decoded, address });
    } else {
      updateUI({ status: "Unverified", address });
    }
  } catch (err) {
    console.error("Armory Extension Error:", err);
    hideCard();
  }

  // Auto-hide after 30s (increased for better UX)
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(hideCard, 30000);
}

// ── Message Listener ───────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ARMORY_TRIGGER_MANUAL") {
    if (isSolanaAddress(request.address)) {
      clearTimeout(queryTimeout);
      triggerQuery(request.address);
    }
  }
});

// ── Event Listeners ────────────────────────────────────
document.addEventListener("paste", (e) => {
  const text = e.clipboardData?.getData("text")?.trim();
  if (isSolanaAddress(text)) {
    clearTimeout(queryTimeout);
    triggerQuery(text);
  }
}, true);

document.addEventListener("input", (e) => {
  const val = e.target.value?.trim();
  if (isSolanaAddress(val)) {
    clearTimeout(queryTimeout);
    queryTimeout = setTimeout(() => triggerQuery(val), 600);
  } else {
    // If user clears the input, we can hide the card
    if (!val || val.length < 10) {
        hideCard();
    }
  }
}, true);
