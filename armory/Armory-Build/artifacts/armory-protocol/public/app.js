/* Armory Protocol — Demo Widget + Interactivity */

const PROGRAM_ID = "G8ZmDRtcCyvWCGRj41xoenQVQ7uRDEe1hVZzzqUYsgpX";
const RPC       = "https://api.devnet.solana.com";

// ─── Base58 ──────────────────────────────────────────────────────────────────

const B58_ALPHA = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Decode(str) {
  let num = 0n;
  for (const ch of str) {
    const idx = B58_ALPHA.indexOf(ch);
    if (idx < 0) throw new Error("Invalid base58 char: " + ch);
    num = num * 58n + BigInt(idx);
  }
  const bytes = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(num & 0xffn);
    num >>= 8n;
  }
  return bytes;
}

function base58Encode(bytes) {
  let num = 0n;
  for (const b of bytes) num = num * 256n + BigInt(b);
  let str = "";
  while (num > 0n) {
    str = B58_ALPHA[Number(num % 58n)] + str;
    num /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    str = "1" + str;
  }
  return str;
}

// ─── Ed25519 curve check (for PDA derivation) ────────────────────────────────

const P  = 2n ** 255n - 19n;
const D  = 37095705934669439343138083508754565189542113879843219016388785533085940283555n;

function modpow(b, e, m) {
  b = ((b % m) + m) % m;
  let r = 1n;
  while (e > 0n) {
    if (e & 1n) r = r * b % m;
    b = b * b % m;
    e >>= 1n;
  }
  return r;
}

function isOnCurve(bytes) {
  const b = new Uint8Array(bytes);
  b[31] &= 0x7f; // clear sign bit
  let y = 0n;
  for (let i = 31; i >= 0; i--) y = y * 256n + BigInt(b[i]);
  if (y >= P) return false;
  const y2 = y * y % P;
  const u  = (y2 - 1n + P) % P;
  const v  = (D * y2 % P + 1n) % P;
  if (v === 0n) return u === 0n;
  const x2 = u * modpow(v, P - 2n, P) % P;
  if (x2 === 0n) return true;
  const euler = modpow(x2, (P - 1n) / 2n, P);
  return euler === 1n;
}

// ─── PDA derivation ──────────────────────────────────────────────────────────

async function findProgramAddress(seeds, programIdBytes) {
  const PDA_MARKER = new TextEncoder().encode("ProgramDerivedAddress");
  for (let nonce = 255; nonce >= 0; nonce--) {
    const parts = [...seeds, new Uint8Array([nonce]), programIdBytes, PDA_MARKER];
    const total = parts.reduce((s, p) => s + p.length, 0);
    const buf   = new Uint8Array(total);
    let off = 0;
    for (const p of parts) { buf.set(p, off); off += p.length; }
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
    if (!isOnCurve(hash)) return { address: hash, bump: nonce };
  }
  throw new Error("Could not find PDA");
}

// ─── Entity record decoder ───────────────────────────────────────────────────

function readU32LE(bytes, off) {
  return bytes[off] | (bytes[off+1]<<8) | (bytes[off+2]<<16) | (bytes[off+3]<<24);
}

function readI64LE(bytes, off) {
  let v = 0n;
  for (let i = 7; i >= 0; i--) v = v * 256n + BigInt(bytes[off + i]);
  // handle sign
  if (v >= 2n**63n) v -= 2n**64n;
  return v;
}

function readOptionI64(bytes, off) {
  // Option<i64>: 1 byte tag (0=None, 1=Some) + 8 bytes if Some
  if (bytes[off] === 0) return { value: null, size: 9 };
  return { value: readI64LE(bytes, off + 1), size: 9 };
}

function decodeEntityRecord(base64Data) {
  const raw = atob(base64Data);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

  let off = 8; // skip discriminator
  off += 32;   // skip domain_hash

  const officialPubkey     = bytes.slice(off, off + 32); off += 32;
  const verificationStatus = bytes[off];                 off += 1;
  const expirationEpoch    = readI64LE(bytes, off);      off += 8;
  const registeredAt       = readI64LE(bytes, off);      off += 8;

  // verified_at: Option<i64>
  const verifiedAtOption = readOptionI64(bytes, off);    off += verifiedAtOption.size;

  const verifierPubkey     = bytes.slice(off, off + 32); off += 32;
  const bump               = bytes[off];                 off += 1;

  // domain string
  const domainLen          = readU32LE(bytes, off);      off += 4;
  const domain             = new TextDecoder().decode(bytes.slice(off, off + domainLen)); off += domainLen;

  // entity_name string
  const nameLen            = readU32LE(bytes, off);      off += 4;
  const entityName         = new TextDecoder().decode(bytes.slice(off, off + nameLen));

  return {
    officialPubkey:     base58Encode(officialPubkey),
    verificationStatus,
    expirationEpoch:    Number(expirationEpoch),
    registeredAt:       Number(registeredAt),
    domain,
    entityName,
    bump,
  };
}

// ─── RPC helpers ─────────────────────────────────────────────────────────────

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error("RPC HTTP error " + res.status);
  const data = await res.json();
  if (data.error) throw new Error("RPC error: " + JSON.stringify(data.error));
  return data.result;
}

async function fetchAccount(pubkeyBytes) {
  const addr = base58Encode(pubkeyBytes);
  const result = await rpc("getAccountInfo", [addr, { encoding: "base64" }]);
  return result?.value ?? null;
}

// ─── Armory query ─────────────────────────────────────────────────────────────

async function queryArmory(input) {
  input = input.trim();
  if (!input) throw new Error("Please enter a wallet address or domain.");

  const programIdBytes = base58Decode(PROGRAM_ID);
  const entitySeed     = new TextEncoder().encode("entity");

  if (input.includes(".")) {
    // Domain lookup: PDA seed = ["entity", sha256(domain)]
    const domainBytes = new TextEncoder().encode(input);
    const hashBuf     = await crypto.subtle.digest("SHA-256", domainBytes);
    const domainHash  = new Uint8Array(hashBuf);

    const { address: pdaBytes } = await findProgramAddress([entitySeed, domainHash], programIdBytes);
    const account = await fetchAccount(pdaBytes);

    if (!account || !account.data || !account.data[0]) {
      return { status: "not_found", input };
    }
    const record = decodeEntityRecord(account.data[0]);
    return { status: "found", record, input };

  } else {
    // Address reverse-lookup via getProgramAccounts (memcmp offset 40 = officialPubkey)
    let pubkeyBytes;
    try { pubkeyBytes = base58Decode(input); }
    catch { throw new Error("Invalid base58 address."); }

    const result = await rpc("getProgramAccounts", [
      PROGRAM_ID,
      {
        encoding: "base64",
        filters: [{
          memcmp: { offset: 40, bytes: input }
        }]
      }
    ]);

    if (!result || result.length === 0) {
      return { status: "not_found", input };
    }

    const record = decodeEntityRecord(result[0].account.data[0]);
    return { status: "found", record, input };
  }
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

function truncatePubkey(pk) {
  return pk.slice(0, 4) + "..." + pk.slice(-4);
}

function formatEpoch(epochSecs) {
  if (!epochSecs) return "Unknown";
  const d = new Date(epochSecs * 1000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function showToast(msg) {
  const toast = document.getElementById("copy-toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(
    ()  => showToast("Copied to clipboard"),
    ()  => showToast("Copy failed")
  );
}

function renderResult(state) {
  const el = document.getElementById("demo-result");
  if (!el) return;

  if (state.loading) {
    el.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        Checking Armory registry...
      </div>`;
    return;
  }

  if (state.error) {
    el.innerHTML = `
      <div class="result-card result-unverified">
        <div class="result-badge badge-unverified">&#9888; ERROR</div>
        <p class="result-body">${escHtml(state.error)}</p>
      </div>`;
    return;
  }

  if (state.type === "not_found") {
    el.innerHTML = `
      <div class="result-card result-unverified">
        <div class="result-badge badge-unverified">&#9888; UNVERIFIED</div>
        <p class="result-name" style="margin-bottom:12px">No registry record found</p>
        <p class="result-body">
          We cannot confirm the owner of this address.
          No merchant has claimed it. Proceed with caution.
        </p>
      </div>`;
    return;
  }

  if (state.type === "found") {
    const r = state.record;
    const isVerified = r.verificationStatus === 1;
    const now        = Date.now() / 1000;
    const isExpired  = r.expirationEpoch && r.expirationEpoch < now;

    let badgeClass, badgeLabel;
    if (isExpired) {
      badgeClass = "badge-expired"; badgeLabel = "&#128308; EXPIRED";
    } else if (isVerified) {
      badgeClass = "badge-verified"; badgeLabel = "&#10003; VERIFIED MERCHANT";
    } else {
      badgeClass = "badge-unverified"; badgeLabel = "&#9888; UNVERIFIED";
    }

    const cardClass = isVerified && !isExpired ? "result-verified" : "result-unverified";

    el.innerHTML = `
      <div class="result-card ${cardClass}">
        <div class="result-badge ${badgeClass}">${badgeLabel}</div>
        <div class="result-name">${escHtml(r.entityName || "Unknown Entity")}</div>
        <div class="result-domain">${escHtml(r.domain)}</div>

        <div class="result-field-label">Official Address</div>
        <div class="result-field-value">
          <span>${truncatePubkey(r.officialPubkey)}</span>
          <button class="copy-inline" data-copy="${escHtml(r.officialPubkey)}">copy</button>
        </div>

        ${r.expirationEpoch ? `<div class="result-expiry">Valid until ${formatEpoch(r.expirationEpoch)}</div>` : ""}

        <hr class="result-divider" />
        ${isVerified && !isExpired
          ? `<div class="result-safe">&#10003; Safe to send &middot; Verified by Armory Oracle</div>`
          : `<div style="font-size:12px;color:var(--warning)">&#9888; Verification not active &mdash; proceed with caution</div>`
        }
      </div>`;

    // wire up inline copy buttons
    el.querySelectorAll("[data-copy]").forEach(btn => {
      btn.addEventListener("click", () => copyText(btn.getAttribute("data-copy")));
    });
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function runCheck(input) {
  renderResult({ loading: true });
  try {
    const result = await queryArmory(input);
    if (result.status === "not_found") {
      renderResult({ type: "not_found" });
    } else {
      renderResult({ type: "found", record: result.record });
    }
  } catch (err) {
    renderResult({ error: err.message || "Unknown error" });
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {

  // Demo widget
  const input   = document.getElementById("demo-input");
  const checkBtn = document.getElementById("demo-check-btn");

  if (checkBtn) {
    checkBtn.addEventListener("click", () => {
      const val = input ? input.value.trim() : "";
      if (val) runCheck(val);
    });
  }

  if (input) {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const val = input.value.trim();
        if (val) runCheck(val);
      }
    });
  }

  // Example pills
  document.querySelectorAll(".demo-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      const val = pill.getAttribute("data-value");
      if (input) input.value = val;
      runCheck(val);
    });
  });

  // Copy buttons (program ID etc.)
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => copyText(btn.getAttribute("data-copy")));
  });

  // Mobile nav
  const hamburger = document.getElementById("nav-hamburger");
  const mobileMenu = document.getElementById("nav-mobile-menu");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
    });

    mobileMenu.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => mobileMenu.classList.remove("open"));
    });
  }

  // Fade-in on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".fade-in").forEach(el => observer.observe(el));

  // Nav scroll shadow
  const nav = document.getElementById("nav");
  if (nav) {
    window.addEventListener("scroll", () => {
      nav.style.borderBottomColor = window.scrollY > 20 ? "#1A2A3A" : "#1A2A3A";
    }, { passive: true });
  }
});
