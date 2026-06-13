import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowDown, CheckCircle2, Shield, Zap, Lock, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoWidget from "@/components/DemoWidget";

function useFadeIn() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-fade]");
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = "1";
          (e.target as HTMLElement).style.transform = "translateY(0)";
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    els.forEach(el => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
}

export default function Landing() {
  useFadeIn();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center justify-center pt-14 px-4"
               style={{ background: "radial-gradient(ellipse at top, rgba(0,168,150,0.04) 0%, transparent 70%)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/20 text-teal text-xs px-3 py-1 rounded-full mb-8">
            <Shield className="w-3 h-3" />
            BUILT ON SOLANA · TURBIN3 Q2 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight tracking-tight mb-6">
            Who owns this wallet?
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
            Paste any Solana address and instantly see the verified merchant behind it
            — before you send a single rupee.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Link href="/app"
                  className="bg-teal hover:bg-teal-dim text-background font-semibold px-8 py-3 rounded-lg transition-colors text-sm">
              Try Armory →
            </Link>
            <Link href="/register"
                  className="border border-border hover:border-teal/50 text-muted-foreground hover:text-foreground px-8 py-3 rounded-lg transition text-sm">
              Register Your Domain
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Free to query · Solana Devnet · sRFC-35 Standard
          </p>

          <div className="mt-16 animate-bounce">
            <ArrowDown className="w-5 h-5 text-muted-foreground mx-auto" />
          </div>
        </div>
      </section>

      {/* ── DEMO STRIP ───────────────────────────────────────────────── */}
      <section id="demo" className="py-16 bg-surface border-y border-border" style={{ background: "#0A0F1A" }}>
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-mono text-teal tracking-widest uppercase mb-2 text-center">Try It Now</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">See it in action</h2>
          <div data-fade>
            <DemoWidget />
          </div>
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ───────────────────────────────────────── */}
      <section id="problem" className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16">

          <div data-fade>
            <p className="text-xs font-mono text-danger tracking-widest uppercase mb-3">The Problem</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-snug">
              Blind transfers cost millions every year
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              In Web2, PhonePe shows you "Amazon India ✓" before you pay. In Web3, you
              copy-paste a 44-character string and hope it's right.
            </p>
            <div className="bg-surface border border-border border-l-4 border-l-danger rounded-xl p-6"
                 style={{ background: "#0A0F1A" }}>
              <div className="text-danger font-mono font-bold text-4xl mb-1">$83.8M+</div>
              <div className="text-foreground text-sm mb-1">confirmed losses from address poisoning attacks</div>
              <div className="text-muted-foreground text-xs font-mono">
                270M attack attempts · 17M victims · CMU/USENIX 2025
              </div>
            </div>
          </div>

          <div data-fade>
            <p className="text-xs font-mono text-teal tracking-widest uppercase mb-3">The Solution</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-snug">
              Cryptographic proof before every transfer
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Armory links Web2 domain ownership to Solana wallet addresses using DNS
              verification — the same trust model as HTTPS, but for payments.
            </p>
            <div className="flex flex-col gap-3">
              {["Sub-second verdict", "DNS-anchored verification", "90-day expiry enforcement"].map(f => (
                <div key={f} className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3"
                     style={{ background: "#0A0F1A" }}>
                  <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-surface border-y border-border" style={{ background: "#0A0F1A" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono text-teal tracking-widest uppercase mb-3 text-center">Mechanism</p>
          <h2 className="text-3xl font-bold text-center mb-2">How it works</h2>
          <p className="text-muted-foreground text-center mb-12">Three steps. No tokens. No governance.</p>

          <div className="grid md:grid-cols-3 gap-6 mb-12" data-fade>
            {[
              {
                num: "01",
                title: "Merchant registers",
                body: "Any business submits their domain and official wallet address. A registry entry is created on-chain — permissionless, anyone can register.",
              },
              {
                num: "02",
                title: "DNS proof confirmed",
                body: "The merchant hosts a solana-wallet.json file at their .well-known path. The Armory oracle reads it, confirms the match, and flips status to VERIFIED.",
              },
              {
                num: "03",
                title: "Anyone can query",
                body: "Wallets, dApps, and AI agents query the registry before sending. Green tick = safe to send. Warning = proceed with extreme caution.",
              },
            ].map(step => (
              <div key={step.num} className="bg-background border border-border rounded-xl p-6">
                <div className="text-teal font-mono font-bold text-5xl mb-4 leading-none">{step.num}</div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>

          {/* Flow diagram */}
          <div data-fade className="bg-background border border-border rounded-xl p-6 font-mono text-sm max-w-xl mx-auto">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-foreground">[Merchant]</span>
              <span>→ register_entity →</span>
              <span className="text-foreground">[Unverified PDA]</span>
            </div>
            <div className="text-muted-foreground pl-6 py-1">↓</div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-foreground">[DNS Oracle]</span>
              <span>→ verify_entity →</span>
              <span className="text-success">[Verified PDA ✓]</span>
            </div>
            <div className="text-muted-foreground pl-6 py-1">↓</div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-foreground">[User/Agent]</span>
              <span>→ query_entity →</span>
              <span className="text-success">[Verdict: VERIFIED]</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR TWO AUDIENCES ────────────────────────────────────────── */}
      <section id="merchants" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono text-teal tracking-widest uppercase mb-3 text-center">Who Is This For</p>
          <h2 className="text-3xl font-bold text-center mb-12">Built for humans and machines</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* For Humans */}
            <div data-fade className="bg-surface border border-border border-t-2 border-t-teal rounded-xl p-7"
                 style={{ background: "#0A0F1A" }}>
              <div className="text-3xl mb-4">👤</div>
              <h3 className="text-xl font-bold mb-1">For wallet users</h3>
              <p className="text-sm text-muted-foreground mb-5">Know before you send</p>

              <div className="bg-background border border-border rounded-lg p-4 mb-5 font-mono text-xs leading-relaxed">
                <div className="text-muted-foreground">You're about to send 50 SOL to a merchant.</div>
                <div className="text-muted-foreground">You paste their address.</div>
                <br />
                <div className="text-success">✓ Amazon India Pvt. Ltd.</div>
                <div className="text-muted-foreground ml-3">domain: amazon.in</div>
                <div className="text-muted-foreground ml-3">Valid until Aug 2026</div>
                <br />
                <div className="text-foreground">Send with confidence.</div>
              </div>

              <ul className="flex flex-col gap-2.5">
                {[
                  "Paste address or type domain",
                  "Instant VERIFIED / UNVERIFIED verdict",
                  "Works in any browser via Chrome extension",
                  "No wallet connection needed to check",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-teal mt-0.5">·</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* For AI Agents */}
            <div id="agents" data-fade className="bg-surface border border-border border-t-2 border-t-purple rounded-xl p-7"
                 style={{ background: "#0A0F1A" }}>
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-xl font-bold mb-1">For AI agents</h3>
              <p className="text-sm text-muted-foreground mb-5">Programmatic safety before every CPI</p>

              <div className="bg-background border border-border rounded-lg p-4 mb-5 font-mono text-xs leading-relaxed overflow-x-auto">
                <pre><span className="text-muted-foreground">{"// Before executing any payment CPI"}</span>{"\n"}<span className="text-[#7C9CBF]">const</span>{" verdict = "}<span className="text-[#7C9CBF]">await</span>{" "}<span className="text-teal">queryArmory</span>{"(destinationDomain);\n\n"}<span className="text-[#7C9CBF]">if</span>{" (verdict.status !== "}<span className="text-success">"Verified"</span>{") {\n  "}<span className="text-[#7C9CBF]">throw new</span>{" "}<span className="text-teal">Error</span>{"("}<span className="text-success">"Destination unverified"</span>{");\n}\n\n"}<span className="text-muted-foreground">{"// Safe to proceed"}</span>{"\n"}<span className="text-[#7C9CBF]">await</span>{" "}<span className="text-teal">executeTransfer</span>{"(verdict.officialPubkey, amount);"}</pre>
              </div>

              <ul className="flex flex-col gap-2.5">
                {[
                  "Machine-readable Verdict struct",
                  "CPI-callable from any Anchor program",
                  "Expiry enforcement — no stale trust",
                  "Integrates with Pay.sh · Circle Agent Stack",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-teal mt-0.5">·</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── TECHNICAL ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-surface border-t border-border" style={{ background: "#0A0F1A" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono text-teal tracking-widest uppercase mb-3 text-center">Architecture</p>
          <h2 className="text-3xl font-bold text-center mb-12">Built on solid foundations</h2>

          <div className="grid md:grid-cols-3 gap-8" data-fade>
            {/* On-chain */}
            <div>
              <h3 className="text-sm font-semibold border-b border-border pb-3 mb-4">Anchor Program</h3>
              <ul className="flex flex-col gap-3">
                {[
                  ["Program ID", "G8ZmD...gspX"],
                  ["Network", "Solana Devnet"],
                  ["Lookup", "Domain-seeded PDAs"],
                  ["Performance", "O(1) by domain"],
                  ["Reverse lookup", "Offset-40 memcmp"],
                  ["Expiry", "90-day enforcement"],
                  ["Standard", "sRFC-35 compliant"],
                ].map(([label, val]) => (
                  <li key={label} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      <span className="text-foreground">{label}:</span>{" "}
                      <span className="font-mono">{val}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust model */}
            <div>
              <h3 className="text-sm font-semibold border-b border-border pb-3 mb-4">Trust Model</h3>
              <ul className="flex flex-col gap-3">
                {[
                  "DNS .well-known verification",
                  "HTTPS as root of trust",
                  "Typosquatting protection",
                  "Oracle-signed verification",
                  "Immutable on-chain record",
                  "Permissionless registration",
                  "Trustless query (no API key)",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Works with */}
            <div>
              <h3 className="text-sm font-semibold border-b border-border pb-3 mb-4">Works With</h3>
              <div className="flex flex-wrap gap-2">
                {["Solana (sRFC-35)", "Phantom Wallet", "Anchor Framework", "Pay.sh", "Circle Agent Stack", "Chrome Extension", "ElizaOS"].map(p => (
                  <span key={p} className="text-xs font-mono text-muted-foreground border border-border rounded-md px-2.5 py-1 bg-background">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto" data-fade>
          <h2 className="text-3xl font-bold mb-4">Start verifying addresses today</h2>
          <p className="text-muted-foreground mb-8">
            Free to query. Permissionless to register. No API key needed.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/app"
                  className="bg-teal hover:bg-teal-dim text-background font-semibold px-8 py-3 rounded-lg transition-colors text-sm inline-flex items-center gap-2">
              Launch App <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/register"
                  className="border border-teal/40 text-teal hover:bg-teal/10 px-8 py-3 rounded-lg transition text-sm">
              Register Domain
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6 text-center">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/app" className="hover:text-teal transition-colors">Check Address</Link>
            <span className="text-border">|</span>
            <Link href="/register" className="hover:text-teal transition-colors">Register Domain</Link>
            <span className="text-border">|</span>
            <a href="https://github.com/Armaansaxena" target="_blank" rel="noopener noreferrer"
               className="hover:text-teal transition-colors">GitHub</a>
            <span className="text-border">|</span>
            <span className="text-muted-foreground/60">Turbin3 Q2 2026</span>
          </div>
          <div>
            <div className="text-teal font-mono font-bold text-sm tracking-widest mb-1">🛡 ARMORY PROTOCOL</div>
            <div className="text-muted-foreground text-sm italic mb-1">"The TLS handshake Web3 never had."</div>
            <div className="text-muted-foreground/60 text-xs font-mono">
              Built by Armaan Saxena · Solana Devnet · Turbin3 Builders Cohort Q2 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
