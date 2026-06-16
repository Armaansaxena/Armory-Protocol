// ── Constants ──────────────────────────────────────────
const ARMORY_PROGRAM_ID = "VRPxpqkBTXgi1DaQ1t1yVyhD8PSCw6uBDrQx1zZznUk";

// ── Base64 to Uint8Array ───────────────────────────────
function base64ToUint8(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ── Decode EntityRecord (Fully Dynamic Master) ─────────
function decodeEntityRecord(base64Data) {
  try {
    const bytes = base64ToUint8(base64Data);
    const dataView = new DataView(bytes.buffer);
    
    // 1. Status at 72
    const verificationStatus = bytes[72] === 1;
    
    // 2. Expiry at 73 (i64 LE)
    const expiryLow  = dataView.getUint32(73, true);
    const expiryHigh = dataView.getInt32(77, true);
    const expirationEpoch = expiryHigh * 0x100000000 + expiryLow;
    
    // 3. Handle Option<i64> verified_at at offset 89
    const verifiedAtTag = bytes[89];
    const verifierOffset = (verifiedAtTag === 1) ? 98 : 90;
    
    // 4. Verifier (32 bytes) + Bump (1 byte) -> Domain length starts at verifierOffset + 33
    const domainLenOffset = verifierOffset + 33;
    const domainLen = dataView.getUint32(domainLenOffset, true);
    
    // 5. Domain String
    const domainStart = domainLenOffset + 4;
    const domain = new TextDecoder().decode(bytes.slice(domainStart, domainStart + domainLen));
    
    // 6. Entity Name length starts right after domain string
    const nameLenOffset = domainStart + domainLen;
    const nameLen = dataView.getUint32(nameLenOffset, true);
    const nameStart = nameLenOffset + 4;
    const entityName = new TextDecoder().decode(bytes.slice(nameStart, nameStart + nameLen));
    
    const now = Math.floor(Date.now() / 1000);
    const isVerified = verificationStatus && (expirationEpoch > now || expirationEpoch === 0);
    
    return { 
      status: isVerified ? "Verified" : "Unverified", 
      domain, 
      entityName,
      expirationEpoch
    };
  } catch (e) {
    console.error("Armory Decoder Error:", e);
    return { status: "Unverified" };
  }
}

// ── Unified Query Helper (Restored for Popup + Content) ─
async function armoryQueryByAddress(address) {
    try {
        const response = await chrome.runtime.sendMessage({ 
            type: "ARMORY_QUERY_ADDRESS", 
            address 
        });

        if (response && response.success) {
            if (response.isDex) {
                return { 
                    status: "Verified", 
                    entityName: response.entityName, 
                    domain: response.domain 
                };
            } else {
                return decodeEntityRecord(response.accountData);
            }
        }
        return { status: "Unverified" };
    } catch (e) {
        console.error("Armory Query Error:", e);
        throw e;
    }
}
