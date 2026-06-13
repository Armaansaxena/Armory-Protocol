import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Clock, CheckCircle2, AlertTriangle, ExternalLink, BarChart2, Shield, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoWidget from "@/components/DemoWidget";
import { getTotalEntities } from "@/lib/armory";
import { Connection } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { IDL } from "@/lib/armory";

import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "@/lib/armory_protocol";

const RECENT_CHECKS = [
  {
    input: "amazon.in",
    entityName: "Amazon India Pvt. Ltd.",
    status: "verified",
    checkedAt: "2 min ago",
    pubkey: "Gh7K...9xmP",
  },
  {
    input: "9xN4...k7Pq",
    entityName: "Unknown",
    status: "not_found",
    checkedAt: "14 min ago",
    pubkey: "9xN4...k7Pq",
  },
  {
    input: "flipkart.com",
    entityName: "Flipkart Internet Pvt. Ltd.",
    status: "verified",
    checkedAt: "1 hr ago",
    pubkey: "3mRt...8xLq",
  },
  {
    input: "demo.armory.dev",
    entityName: "Armory Protocol Demo",
    status: "verified",
    checkedAt: "3 hr ago",
    pubkey: "2bHj...5yNk",
  },
  {
    input: "Gh7K...9xmP",
    entityName: "Armory Protocol Demo",
    status: "verified",
    checkedAt: "Yesterday",
    pubkey: "Gh7K...9xmP",
  },
];

import { usePrivy } from "@privy-io/react-auth";
import { Loader2 } from "lucide-react";

export default function AppPage() {
  const [activeTab, setActiveTab] = useState<"check" | "recent">("check");
  const [totalEntities, setTotalEntities] = useState<number | null>(null);
  const { authenticated, ready, login } = usePrivy();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const rpcUrl = import.meta.env.VITE_RPC_URL || "https://api.devnet.solana.com";
        const connection = new Connection(rpcUrl, "confirmed");
        const provider = new anchor.AnchorProvider(connection, { publicKey: anchor.web3.PublicKey.default } as any, {});
        const program = new anchor.Program(IDL, provider) as Program<ArmoryProtocol>;
        const total = await getTotalEntities(program);
        setTotalEntities(total);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  const statsList = [
    { label: "Registry Records", value: totalEntities !== null ? totalEntities.toString() : "...", icon: Shield },
    { label: "Verified Merchants", value: totalEntities !== null ? totalEntities.toString() : "...", icon: CheckCircle2 },
    { label: "Queries Today", value: "3,412", icon: BarChart2 },
    { label: "Avg Latency", value: "< 300ms", icon: Globe },
  ];

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center" style={{ background: "#0A0F1A" }}>
            <Shield className="w-12 h-12 text-teal mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Sign in to Access</h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Verify domains, reverse-lookup wallet addresses, and explore the decentralized identity registry.
            </p>
            <button
              onClick={login}
              className="w-full bg-teal hover:bg-teal-dim text-background font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-teal/20 cursor-pointer"
            >
              Sign In / Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-14 min-h-screen flex flex-col">
        {/* Stats strip */}
        <div className="bg-surface border-b border-border py-3 px-6" style={{ background: "#0A0F1A" }}>
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsList.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <s.icon className="w-4 h-4 text-teal flex-shrink-0" />
                <div>
                  <div className="text-foreground font-mono font-semibold text-sm">{s.value}</div>
                  <div className="text-muted-foreground text-xs">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 grid lg:grid-cols-[1fr_340px] gap-8">

          {/* Left: search */}
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-1">Verify an address</h1>
              <p className="text-sm text-muted-foreground">
                Enter a wallet address or domain to check the Armory registry in real-time.
              </p>
            </div>

            <DemoWidget />

            {/* How to use */}
            <div className="mt-8 bg-surface border border-border rounded-xl p-5" style={{ background: "#0A0F1A" }}>
              <h3 className="text-sm font-semibold mb-4">How to use</h3>
              <div className="flex flex-col gap-4">
                {[
                  { icon: "🔍", title: "By domain", desc: "Type any registered domain (e.g. flipkart.com) to see its verified wallet." },
                  { icon: "📋", title: "By address", desc: "Paste a 32-44 character Solana address to reverse-lookup its registered merchant." },
                  { icon: "⚡", title: "Real-time", desc: "All results are fetched live from Solana devnet — no caching, no middlemen." },
                ].map(tip => (
                  <div key={tip.title} className="flex gap-3">
                    <span className="text-xl flex-shrink-0">{tip.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-foreground mb-0.5">{tip.title}</div>
                      <div className="text-xs text-muted-foreground">{tip.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="flex flex-col gap-6">
            {/* Tabs */}
            <div>
              <div className="flex gap-1 bg-surface rounded-lg p-1 mb-4" style={{ background: "#0A0F1A" }}>
                {(["check", "recent"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`flex-1 py-1.5 text-xs rounded-md transition-colors font-medium capitalize ${
                      activeTab === t
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "check" ? "Network" : "Recent"}
                  </button>
                ))}
              </div>

              {activeTab === "check" && (
                <div className="flex flex-col gap-3">
                  <div className="bg-surface border border-border rounded-xl p-4" style={{ background: "#0A0F1A" }}>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-mono">Network</div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-sm text-foreground">Solana Devnet</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">api.devnet.solana.com</div>
                  </div>

                  <div className="bg-surface border border-border rounded-xl p-4" style={{ background: "#0A0F1A" }}>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-mono">Program</div>
                    <div className="text-xs font-mono text-teal break-all">
                      G8ZmDRtcCyvWCGRj41xoenQVQ7uRDEe1hVZzzqUYsgpX
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <ExternalLink className="w-3 h-3" />
                      <a href="https://explorer.solana.com/address/G8ZmDRtcCyvWCGRj41xoenQVQ7uRDEe1hVZzzqUYsgpX?cluster=devnet"
                         target="_blank" rel="noopener noreferrer"
                         className="hover:text-teal transition-colors">
                        View on Explorer
                      </a>
                    </div>
                  </div>

                  <div className="bg-surface border border-border rounded-xl p-4" style={{ background: "#0A0F1A" }}>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-mono">Standard</div>
                    <div className="text-sm text-foreground">sRFC-35</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Solana Foundation Registry Standard</div>
                  </div>

                  <Link href="/register"
                        className="w-full bg-teal hover:bg-teal-dim text-background font-semibold py-2.5 rounded-lg transition-colors text-sm text-center block">
                    Register Your Domain →
                  </Link>
                </div>
              )}

              {activeTab === "recent" && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground mb-1">Session history (mock)</p>
                  {RECENT_CHECKS.map((c, i) => (
                    <div key={i}
                         className="bg-surface border border-border rounded-lg p-3 hover:border-border/80 transition-colors cursor-pointer"
                         style={{ background: "#0A0F1A" }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          {c.status === "verified"
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                            : <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                          }
                          <span className="text-xs font-mono text-foreground truncate max-w-[120px]">{c.input}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {c.checkedAt}
                        </div>
                      </div>
                      {c.status === "verified" && (
                        <div className="text-xs text-muted-foreground ml-5">{c.entityName}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
