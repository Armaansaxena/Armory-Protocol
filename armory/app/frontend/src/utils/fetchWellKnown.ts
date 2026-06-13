const PROXIES = [
  (url: string) => 
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => 
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => 
    `https://thingproxy.freeboard.io/fetch/${url}`,
];

export interface WellKnownResult {
  found: boolean;
  pubkey: string | null;
  entityName: string | null;
  error: string | null;
  proxyUsed: number;
}

export async function fetchWellKnown(
  domain: string
): Promise<WellKnownResult> {
  const targetUrl = 
    `https://${domain}/.well-known/solana-wallet.json`;
  
  // 1. Try DIRECT fetch first (best for Vercel with CORS headers)
  try {
    const directResponse = await fetch(targetUrl);
    if (directResponse.ok) {
        const data = await directResponse.json();
        return validateData(data, -1); // -1 indicates direct fetch
    }
  } catch(e) {
    // Direct failed (expected if CORS missing), proceed to proxies
  }

  // 2. Proxy Waterfall (Fallback)
  for (let i = 0; i < PROXIES.length; i++) {
    try {
      const proxyUrl = PROXIES[i](targetUrl);
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(), 5000
      );
      
      const response = await fetch(proxyUrl, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (!response.ok) continue;
      
      // Check if response is actually JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
          // If it's a proxy that wraps the response, it might still be JSON
          // but if it's an HTML error page, we should skip it
          const text = await response.text();
          if (text.trim().startsWith("<!DOCTYPE html>")) continue;
          
          try {
              const data = JSON.parse(text);
              return validateData(data, i);
          } catch(e) {
              continue;
          }
      }

      const data = await response.json();
      return validateData(data, i);
      
    } catch (err: any) {
      if (i === PROXIES.length - 1) {
        return {
          found: false,
          pubkey: null,
          entityName: null,
          error: "Browser security (CORS) is blocking direct access. Please proceed to registration; the Armory Oracle will handle the verification.",
          proxyUsed: -1
        };
      }
      continue;
    }
  }
  
  return {
    found: false,
    pubkey: null,
    entityName: null,
    error: "Verification unavailable",
    proxyUsed: -1
  };
}

function validateData(data: any, proxyIndex: number): WellKnownResult {
    if (!data["solana-address"]) {
        return {
          found: true,
          pubkey: null,
          entityName: data["solana-entity-name"] || null,
          error: "File found but missing solana-address field",
          proxyUsed: proxyIndex
        };
    }
    
    return {
        found: true,
        pubkey: data["solana-address"],
        entityName: data["solana-entity-name"] || null,
        error: null,
        proxyUsed: proxyIndex
    };
}