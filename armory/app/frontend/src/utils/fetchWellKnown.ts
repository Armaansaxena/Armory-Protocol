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
      
      const data = await response.json();
      
      if (!data["solana-address"]) {
        return {
          found: true,
          pubkey: null,
          entityName: data["solana-entity-name"] || null,
          error: "File found but missing solana-address field",
          proxyUsed: i
        };
      }
      
      return {
        found: true,
        pubkey: data["solana-address"],
        entityName: data["solana-entity-name"] || null,
        error: null,
        proxyUsed: i
      };
      
    } catch (err: any) {
      if (i === PROXIES.length - 1) {
        // All proxies failed
        return {
          found: false,
          pubkey: null,
          entityName: null,
          error: "Could not reach domain. Check URL or try later.",
          proxyUsed: -1
        };
      }
      // Try next proxy
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