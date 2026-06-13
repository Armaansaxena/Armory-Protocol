// Armory Protocol background service worker (Hardened + Cached)

const ARMORY_PROGRAM_ID = "VRPxpqkBTXgi1DaQ1t1yVyhD8PSCw6uBDrQx1zZznUk";
const ARMORY_RPC = "https://api.devnet.solana.com";

// ── Simple Cache (TTL: 5 minutes) ─────────────────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// ── Context Menu Setup ─────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "verify-armory",
    title: "Verify with Armory Protocol",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "verify-armory" && info.selectionText) {
    const cleanText = info.selectionText.trim();
    chrome.tabs.sendMessage(tab.id, {
      type: "ARMORY_TRIGGER_MANUAL",
      address: cleanText
    });
  }
});

// ── Message Listener ───────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ARMORY_QUERY_ADDRESS") {
    // 1. Check Cache
    const cached = cache.get(request.address);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      sendResponse(cached.data);
      return;
    }

    // 2. Fetch from Chain
    fetchWithRetry(request.address).then(response => {
      // 3. Save to Cache
      cache.set(request.address, { timestamp: Date.now(), data: response });
      sendResponse(response);
    });
    return true; 
  }
});

async function fetchWithRetry(address, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(ARMORY_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1,
          method: "getProgramAccounts",
          params: [
            ARMORY_PROGRAM_ID,
            {
              encoding: "base64",
              filters: [{ memcmp: { offset: 40, bytes: address } }]
            }
          ]
        })
      });
      
      const data = await response.json();
      if (data.result && data.result.length > 0) {
        return { success: true, accountData: data.result[0].account.data[0] };
      }
      return { success: false, status: "NotFound" };
    } catch (err) {
      if (i === retries - 1) return { success: false, error: err.message };
    }
  }
}
