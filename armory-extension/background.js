// Armory Protocol background service worker (Hardened + Performance Optimized)

const ARMORY_PROGRAM_ID = "VRPxpqkBTXgi1DaQ1t1yVyhD8PSCw6uBDrQx1zZznUk";
const ARMORY_RPC = "https://api.devnet.solana.com";

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ARMORY_QUERY_ADDRESS") {
    const cached = cache.get(request.address);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      sendResponse(cached.data);
      return;
    }

    handleQuery(request.address).then(response => {
      cache.set(request.address, { timestamp: Date.now(), data: response });
      sendResponse(response);
    });
    return true; 
  }
});

async function handleQuery(address) {
  const start = Date.now();
  console.log(`Armory: Querying blockchain for ${address}...`);

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
    const latency = Date.now() - start;
    console.log(`Armory: RPC Response received in ${latency}ms`);

    if (data.result && data.result.length > 0) {
      return { success: true, accountData: data.result[0].account.data[0] };
    }
    
    // Fallback: Check DexScreener for known tokens
    try {
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
        if (dexRes.ok) {
            const dexData = await dexRes.json();
            const pair = dexData.pairs?.find(p => p.chainId === 'solana');
            if (pair) {
                return { 
                    success: true, 
                    isDex: true,
                    entityName: pair.baseToken.symbol === address ? pair.quoteToken.name : pair.baseToken.name,
                    domain: "Ecosystem Token"
                };
            }
        }
    } catch(e) {}

    return { success: false, status: "NotFound" };
  } catch (err) {
    console.error("Armory RPC Error:", err);
    return { success: false, error: err.message };
  }
}
