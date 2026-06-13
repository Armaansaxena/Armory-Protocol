import { useState, useRef, useCallback } from "react";
import { Search, Copy, Check, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { queryByDomain, queryByAddress, type VerdictResult } from "@/lib/armory";
import { Connection } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { IDL } from "@/lib/armory";

import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "@/lib/armory_protocol";

const EXAMPLE_PILLS = [
  "demo.armory.dev",
  "testmerchant.in",
  "solpay.demo",
];

interface DemoWidgetProps {
  compact?: boolean;
}

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "result"; result: VerdictResult }
  | { phase: "error"; message: string };

function truncatePubkey(pk: string | any) {
  const str = pk.toString();
  if (str.length < 16) return str;
  return `${str.slice(0, 8)}...${str.slice(-8)}`;
}

function formatEpoch(epochStr: any) {
  const epoch = epochStr?.toNumber ? epochStr.toNumber() : Number(epochStr);
  return new Date(epoch * 1000).toLocaleDateString();
}

export default function DemoWidget({ compact = false }: DemoWidgetProps) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const runCheck = useCallback(async (value: string) => {
    const v = value.trim();
    if (!v) return;
    setState({ phase: "loading" });
    try {
      const rpcUrl = import.meta.env.VITE_RPC_URL || "https://api.devnet.solana.com";
      const connection = new Connection(rpcUrl, "confirmed");
      const provider = new anchor.AnchorProvider(connection, { publicKey: anchor.web3.PublicKey.default } as any, {});
      const program = new anchor.Program(IDL, provider) as Program<ArmoryProtocol>;

      let result: VerdictResult;
      if (v.includes(".")) {
        result = await queryByDomain(v, program);
      } else {
        result = await queryByAddress(v, program, connection);
      }
      setState({ phase: "result", result });
    } catch (err) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, []);

  const handlePill = (val: string) => {
    setInput(val);
    inputRef.current?.focus();
    runCheck(val);
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-surface rounded-xl border border-border ${compact ? "p-5" : "p-8"}`}
         style={{ background: "#0A0F1A" }}>
      {/* Input row */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runCheck(input)}
            placeholder="Paste a Solana wallet address or domain..."
            className="w-full h-12 bg-background border border-border rounded-lg pl-10 pr-4 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal transition-colors"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          onClick={() => runCheck(input)}
          disabled={state.phase === "loading"}
          className="px-5 h-12 bg-teal hover:bg-teal-dim text-background font-semibold text-sm rounded-lg transition-colors disabled:opacity-60 flex-shrink-0 cursor-pointer"
        >
          {state.phase === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : "Check"}
        </button>
      </div>

      {/* Example pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs text-muted-foreground self-center">Try:</span>
        {EXAMPLE_PILLS.map(p => (
          <button
            key={p}
            onClick={() => handlePill(p)}
            className="text-xs font-mono text-teal border border-teal/40 bg-teal/5 hover:bg-teal/10 px-3 py-1 rounded-full transition-colors cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Result area */}
      {state.phase === "loading" && (
        <div className="flex items-center gap-3 text-muted-foreground text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin text-teal" />
          Checking Armory registry on Solana devnet...
        </div>
      )}

      {state.phase === "error" && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-5 border-l-4 border-l-danger animate-fade-slide">
          <div className="flex items-center gap-2 text-danger text-xs font-mono font-semibold mb-2 uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" /> Error
          </div>
          <p className="text-sm text-muted-foreground">{state.message}</p>
        </div>
      )}

      {state.phase === "result" && state.result.status === "Unverified" && (
        <div className="rounded-lg border-l-4 border-l-warning border border-warning/20 bg-warning/5 p-5 animate-fade-slide">
          <div className="flex items-center gap-2 text-warning text-xs font-mono font-semibold mb-3 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" /> Unverified
          </div>
          <p className="text-foreground font-semibold mb-1">No registry record found</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We cannot confirm the owner of this address. No merchant has claimed it.
            Proceed with caution.
          </p>
        </div>
      )}

      {state.phase === "result" && state.result.status === "EcosystemLabel" && state.result.dexFallback && (
        <div className="rounded-lg border-l-4 border-l-blue-500 border border-blue-500/20 bg-blue-500/5 p-5 animate-fade-slide">
          <div className="flex items-center gap-2 text-blue-500 text-xs font-mono font-semibold mb-3 uppercase tracking-wider">
            <Search className="w-3.5 h-3.5" /> Ecosystem Label
          </div>
          <div className="flex items-center gap-3">
            {state.result.dexFallback.logo && <img src={state.result.dexFallback.logo} className="w-8 h-8 rounded-full" alt="logo" />}
            <div>
              <p className="text-foreground font-semibold mb-1">{state.result.dexFallback.name} ({state.result.dexFallback.symbol})</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Found via DexScreener. Not verified by Armory DNS oracle.
              </p>
            </div>
          </div>
        </div>
      )}

      {state.phase === "result" && state.result.status === "Expired" && state.result.data && (() => {
        const r = state.result.data;
        return (
          <div className="rounded-lg border-l-4 border-l-danger border border-danger/20 bg-danger/5 p-5 animate-fade-slide">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold mb-4 px-2 py-0.5 rounded uppercase tracking-wider text-danger bg-danger/10">
              <AlertTriangle className="w-3 h-3" /> Expired
            </div>
            <div className="text-foreground text-lg font-bold mb-0.5">{r.entityName || "Unknown Entity"}</div>
            <div className="text-teal font-mono text-sm mb-4">{r.domain}</div>
            <div className="mb-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Official Address</div>
              <div className="flex items-center gap-2 font-mono text-sm text-foreground">
                {truncatePubkey(r.officialPubkey)}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Expired since {formatEpoch(r.expirationEpoch)}
            </div>
            <hr className="border-border mb-4" />
            <div className="text-warning text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Verification not active — proceed with caution
            </div>
          </div>
        );
      })()}

      {state.phase === "result" && state.result.status === "Verified" && state.result.data && (() => {
        const r = state.result.data;
        return (
          <div className="rounded-lg border-l-4 border border-l-teal border-teal/20 bg-teal/5 p-5 animate-fade-slide">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold mb-4 px-2 py-0.5 rounded uppercase tracking-wider text-teal bg-teal/10">
              <CheckCircle2 className="w-3 h-3" /> Verified Merchant
            </div>

            <div className="text-foreground text-lg font-bold mb-0.5">{r.entityName || "Unknown Entity"}</div>
            <div className="text-teal font-mono text-sm mb-4">{r.domain}</div>

            <div className="mb-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Official Address</div>
              <div className="flex items-center gap-2 font-mono text-sm text-foreground">
                {truncatePubkey(r.officialPubkey)}
                <button
                  onClick={() => copyText(r.officialPubkey.toString())}
                  className="text-muted-foreground hover:text-teal transition-colors cursor-pointer"
                  title="Copy full address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {r.expirationEpoch && (
              <div className="text-sm text-muted-foreground mb-4">
                Valid until {formatEpoch(r.expirationEpoch)}
              </div>
            )}

            <hr className="border-border/30 mb-4" />

            <div className="flex items-center gap-1.5 text-teal text-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Safe to send · Verified by Armory Oracle
            </div>
          </div>
        );
      })()}
    </div>
  );
}
