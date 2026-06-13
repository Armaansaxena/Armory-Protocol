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

// ── Decode EntityRecord (Fully Dynamic) ────────────────
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
    // Anchor/Borsh Option: 0 = None, 1 = Some + 8 bytes
    const verifiedAtTag = bytes[89];
    // If tag is 1, data is 8 bytes. If tag is 0, data is 0 bytes.
    const verifierOffset = (verifiedAtTag === 1) ? 98 : 90;
    
    // 4. Verifier (32 bytes) + Bump (1 byte)
    // Domain length starts after them
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
    // Even if verificationStatus is true, check expiry
    const isVerified = verificationStatus && (expirationEpoch > now || expirationEpoch === 0);
    
    return { 
      status: isVerified ? "Verified" : "Unverified", 
      domain, 
      entityName,
      address: "" // placeholder
    };
  } catch (e) {
    console.error("Armory Decoder Error:", e);
    return { status: "Unverified" };
  }
}
