// ── Constants ──────────────────────────────────────────
const ARMORY_PROGRAM_ID = "VRPxpqkBTXgi1DaQ1t1yVyhD8PSCw6uBDrQx1zZznUk";

// ── Base58 encode ──────────────────────────────────────
function base58Encode(bytes) {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let result = "";
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result += "1";
  for (let i = digits.length - 1; i >= 0; i--) result += ALPHABET[digits[i]];
  return result;
}

// ── Decode EntityRecord from raw bytes ─────────────────
function decodeEntityRecord(base64Data) {
  try {
    const raw = atob(base64Data);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    
    const dataView = new DataView(bytes.buffer);
    
    // Status at 72
    const verificationStatus = bytes[72] === 1;
    
    // Expiry at 73 (i64 LE)
    const expiryLow  = dataView.getUint32(73, true);
    const expiryHigh = dataView.getInt32(77, true);
    const expirationEpoch = expiryHigh * 0x100000000 + expiryLow;
    
    // Domain at 131 (u32 length)
    const domainLen = dataView.getUint32(131, true);
    const domain = new TextDecoder().decode(bytes.slice(135, 135 + domainLen));
    
    // Name after domain
    const nameOffset = 135 + domainLen;
    const nameLen = dataView.getUint32(nameOffset, true);
    const entityName = new TextDecoder().decode(bytes.slice(nameOffset + 4, nameOffset + 4 + nameLen));
    
    const now = Math.floor(Date.now() / 1000);
    let status = (verificationStatus && now < expirationEpoch) ? "Verified" : "Unverified";
    
    return { status, domain, entityName };
  } catch (e) {
    return { status: "Unverified" };
  }
}
