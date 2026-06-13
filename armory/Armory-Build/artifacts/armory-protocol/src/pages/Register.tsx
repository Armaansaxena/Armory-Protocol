import { useState } from "react";
import { Link } from "wouter";
import {
  ChevronRight, CheckCircle2, Copy, Check,
  Globe, Wallet, FileCode, Shield, AlertTriangle, Loader2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { fetchWellKnown } from "@/lib/fetchWellKnown";
import { IDL, getDomainHash } from "@/lib/armory";

import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "@/lib/armory_protocol";

type Step = 1 | 2 | 3;

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || import.meta.env.VITE_PROGRAM_ID || "G8ZmDRtcCyvWCGRj41xoenQVQ7uRDEe1hVZzzqUYsgpX");

const STEPS = [
  { num: 1, label: "Domain & Wallet" },
  { num: 2, label: "DNS Verification" },
  { num: 3, label: "Submit" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-teal transition-colors" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function Register() {
  const { authenticated, login } = usePrivy();
  const wallet = useWallet();
  const { connection } = useConnection();

  const activeWallet = wallet;

  const [step, setStep] = useState<Step>(1);
  const [domain, setDomain] = useState("");
  const [walletAddr, setWalletAddr] = useState("");
  const [entityName, setEntityName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [txSignature, setTxSignature] = useState("");

  const [isCheckingFile, setIsCheckingFile] = useState(false);
  const [fileVerified, setFileVerified] = useState<boolean | null>(null);
  const [fileError, setFileError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const wellKnownContent = JSON.stringify({ "solana-address": walletAddr || "<your-wallet-address>", "solana-entity-name": entityName, "solana-network": "devnet" }, null, 2);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 mt-14">
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center" style={{ background: "#0A0F1A" }}>
            <Shield className="w-12 h-12 text-teal mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Sign in to Register</h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Connect your wallet or sign in to register your domain and establish your on-chain identity.
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

  const checkFile = async () => {
    setIsCheckingFile(true);
    setFileVerified(null);
    setFileError('');
    
    const result = await fetchWellKnown(domain);
    
    if (result.found && result.pubkey === walletAddr) {
      setFileVerified(true);
    } else {
      setFileVerified(false);
      setFileError(result.error || "Address mismatch or file unreadable.");
    }
    setIsCheckingFile(false);
  };

  const registerOnChain = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      setSubmitError('Connect your wallet first.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const rpcUrl = import.meta.env.VITE_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
      const connection = new Connection(rpcUrl, "confirmed");
      
      const provider = new anchor.AnchorProvider(
        connection,
        {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions
        },
        { preflightCommitment: "confirmed" }
      );

      const program = new anchor.Program(IDL, provider) as unknown as Program<ArmoryProtocol>;
      const domainHash = getDomainHash(domain);
      const [entityPda] = PublicKey.findProgramAddressSync([Buffer.from("entity"), domainHash], PROGRAM_ID);
      const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);

      const tx = await program.methods
        .registerEntity(domain.trim().toLowerCase(), new PublicKey(walletAddr), entityName)
        .accounts({
          entityAuthority: wallet.publicKey,
          config: configPda,
          entityRecord: entityPda,
        } as unknown as any)
        .rpc();

      setTxSignature(tx);
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(`Blockchain Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-14 max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-xs font-mono text-teal tracking-widest uppercase mb-2">Merchant Registration</p>
          <h1 className="text-3xl font-bold mb-2">Register Your Domain</h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Link your domain to your Solana wallet address. Once verified by the oracle,
            anyone can confirm your identity before sending funds.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => { if (s.num <= step && !submitted) setStep(s.num as Step); }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                  step > s.num
                    ? "bg-teal border-teal text-background"
                    : step === s.num
                    ? "border-teal text-teal bg-teal/10"
                    : "border-border text-muted-foreground"
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === s.num ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-px mx-3 transition-colors ${step > s.num ? "bg-teal" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8">

          {/* Form area */}
          <div>

            {/* ── STEP 1 ── */}
            {step === 1 && !submitted && (
              <div className="bg-surface border border-border rounded-xl p-7" style={{ background: "#0A0F1A" }}>
                <h2 className="text-lg font-semibold mb-1">Domain & Wallet</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter the domain you control and the wallet address you want to associate with it.
                </p>

                <div className="flex flex-col gap-5">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">
                      Entity Name
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        value={entityName}
                        onChange={e => setEntityName(e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full h-11 bg-background border border-border rounded-lg pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">
                      Domain
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        value={domain}
                        onChange={e => setDomain(e.target.value.toLowerCase())}
                        placeholder="acme.com"
                        className="w-full h-11 bg-background border border-border rounded-lg pl-10 pr-4 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal transition-colors"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Must be a domain you control. No https:// prefix.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">
                      Official Wallet Address
                    </label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        value={walletAddr}
                        onChange={e => setWalletAddr(e.target.value.trim())}
                        placeholder="Your Solana public key (base58)"
                        className="w-full h-11 bg-background border border-border rounded-lg pl-10 pr-4 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal transition-colors"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      32-44 character base58 public key. Double-check — this will be your verified address.
                    </p>
                  </div>

                  <button
                    onClick={() => { if (domain && walletAddr && entityName) setStep(2); }}
                    disabled={!domain || !walletAddr || !entityName}
                    className="w-full bg-teal hover:bg-teal-dim text-background font-semibold py-3 rounded-lg transition-colors text-sm disabled:opacity-40 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    Continue to DNS Verification <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && !submitted && (
              <div className="bg-surface border border-border rounded-xl p-7" style={{ background: "#0A0F1A" }}>
                <h2 className="text-lg font-semibold mb-1">DNS Verification</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Host a JSON file on your domain to prove ownership. The Armory oracle will fetch it before
                  flipping your status to VERIFIED.
                </p>

                <div className="flex flex-col gap-6">
                  {/* Instructions */}
                  {[
                    {
                      step: "1",
                      title: "Create the verification file",
                      body: (
                        <div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Create a file at <code className="text-teal">{domain ? `.well-known/solana-wallet.json` : ".well-known/solana-wallet.json"}</code> on your domain:
                          </p>
                          <div className="bg-background border border-border rounded-lg p-4 relative group">
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <CopyButton text={wellKnownContent} />
                            </div>
                            <pre className="text-xs font-mono text-success leading-relaxed">{wellKnownContent}</pre>
                          </div>
                        </div>
                      ),
                    },
                    {
                      step: "2",
                      title: "Verify it's accessible",
                      body: (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Confirm the URL is publicly accessible:</p>
                          <div className="bg-background border border-border rounded-lg p-3 flex items-center justify-between gap-2">
                            <code className="text-xs font-mono text-teal break-all">
                              {`https://${domain || "acme.com"}/.well-known/solana-wallet.json`}
                            </code>
                            <CopyButton text={`https://${domain || "acme.com"}/.well-known/solana-wallet.json`} />
                          </div>
                        </div>
                      ),
                    },
                    {
                      step: "3",
                      title: "Allow CORS from any origin",
                      body: (
                        <p className="text-sm text-muted-foreground">
                          The file must be readable by the Armory oracle. Add{" "}
                          <code className="text-teal">Access-Control-Allow-Origin: *</code>{" "}
                          to your server response headers.
                        </p>
                      ),
                    },
                  ].map(({ step: s, title, body }) => (
                    <div key={s} className="flex gap-4">
                      <div className="w-7 h-7 rounded-full border border-teal text-teal text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {s}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold mb-2">{title}</div>
                        {body}
                      </div>
                    </div>
                  ))}

                  <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 flex gap-3">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      The oracle checks this URL after you submit. If the file is missing or returns the wrong
                      wallet address, your record will remain UNVERIFIED until the next oracle cycle.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 border border-border hover:border-muted-foreground text-muted-foreground py-3 rounded-lg transition text-sm cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={checkFile}
                      disabled={isCheckingFile}
                      className="flex-1 bg-surface border border-teal text-teal hover:bg-teal/10 font-semibold py-3 rounded-lg transition-colors text-sm cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingFile ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Check DNS'}
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 bg-teal hover:bg-teal-dim text-background font-semibold py-3 rounded-lg transition-colors text-sm cursor-pointer"
                    >
                      Continue →
                    </button>
                  </div>
                  
                  {fileVerified === true && <div className="text-teal text-sm text-center font-medium">✅ File verified successfully!</div>}
                  {fileVerified === false && <div className="text-warning text-sm text-center font-medium">⚠️ {fileError}</div>}
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && !submitted && (
              <div className="bg-surface border border-border rounded-xl p-7" style={{ background: "#0A0F1A" }}>
                <h2 className="text-lg font-semibold mb-1">Confirm & Submit</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Review your registration details. Once submitted, a transaction will be created on Solana devnet.
                </p>

                <div className="bg-background border border-border rounded-xl p-5 mb-6">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-4">Record Preview</div>

                  <div className="border-l-2 border-teal pl-4">
                    <div className="text-xs font-mono text-teal mb-1">{domain}</div>
                    <div className="text-lg font-bold text-foreground mb-3">{entityName}</div>
                    <div className="flex flex-col gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Official Address</div>
                        <div className="text-sm font-mono text-foreground">{walletAddr.length > 12 ? walletAddr.slice(0, 6) + "..." + walletAddr.slice(-6) : walletAddr}</div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 bg-warning/10 text-warning text-xs font-mono px-2 py-0.5 rounded w-fit">
                        <AlertTriangle className="w-3 h-3" />
                        Pending verification
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-teal/5 border border-teal/20 rounded-lg p-4 mb-6">
                  <div className="text-xs text-teal font-mono font-semibold mb-1">What happens next</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>1. A PDA is created on Solana devnet (requires a small SOL fee)</li>
                    <li>2. The Armory oracle fetches your .well-known file</li>
                    <li>3. If verified, status flips to VERIFIED within ~30 seconds</li>
                    <li>4. Record expires after 90 days — renew to stay verified</li>
                  </ul>
                </div>

                {submitError && <div className="text-danger text-sm mb-4">{submitError}</div>}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 border border-border hover:border-muted-foreground text-muted-foreground py-3 rounded-lg transition text-sm cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={registerOnChain}
                    disabled={isSubmitting}
                    className="flex-1 bg-teal hover:bg-teal-dim text-background font-semibold py-3 rounded-lg transition-colors text-sm flex justify-center items-center cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Registration"}
                  </button>
                </div>
              </div>
            )}

            {/* ── SUBMITTED ── */}
            {submitted && (
              <div className="bg-surface border border-teal/30 rounded-xl p-8 text-center" style={{ background: "#0A0F1A" }}>
                <div className="w-16 h-16 rounded-full bg-teal/10 border border-teal flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8 text-teal" />
                </div>
                <h2 className="text-xl font-bold mb-2">Registration submitted!</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  Your record for <span className="text-teal font-mono">{domain}</span> has been created on Solana devnet.
                  The oracle will verify your DNS file shortly.
                </p>
                <div className="bg-background border border-border rounded-lg p-4 mb-6 text-sm font-mono text-muted-foreground">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Transaction</div>
                  <div className="text-teal break-all text-xs">
                    <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} target="_blank" rel="noreferrer" className="hover:underline">
                      {txSignature}
                    </a>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link href={`/app?domain=${domain}`}
                        className="bg-teal hover:bg-teal-dim text-background font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm cursor-pointer">
                    Check Your Address →
                  </Link>
                  <button
                    onClick={() => { setSubmitted(false); setStep(1); setDomain(""); setWalletAddr(""); setEntityName(""); }}
                    className="border border-border text-muted-foreground hover:text-foreground px-6 py-2.5 rounded-lg transition text-sm cursor-pointer"
                  >
                    Register Another
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            {/* What you're building */}
            <div className="bg-surface border border-border rounded-xl p-5" style={{ background: "#0A0F1A" }}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-teal" />
                What gets created
              </h3>
              <div className="flex flex-col gap-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal mt-0.5 flex-shrink-0" />
                  <span>On-chain PDA seeded by SHA-256 of your domain</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal mt-0.5 flex-shrink-0" />
                  <span>EntityRecord storing domain, wallet, status, expiration</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal mt-0.5 flex-shrink-0" />
                  <span>90-day expiration with oracle-signed verification</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal mt-0.5 flex-shrink-0" />
                  <span>Public queryable by address or domain</span>
                </div>
              </div>
            </div>

            {/* Trust model */}
            <div className="bg-surface border border-border rounded-xl p-5" style={{ background: "#0A0F1A" }}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal" />
                Trust model
              </h3>
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p className="mb-2">
                  Verification works like HTTPS certificate issuance: you prove you control
                  the domain by hosting a known file at a known path.
                </p>
                <p>
                  The Armory oracle reads your <code className="text-teal">.well-known/solana-wallet.json</code>,
                  confirms the wallet address matches your registration, and signs the on-chain record.
                </p>
              </div>
            </div>

            {/* Already registered? */}
            <div className="bg-surface border border-border rounded-xl p-5" style={{ background: "#0A0F1A" }}>
              <h3 className="text-sm font-semibold mb-2">Already registered?</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Check your current verification status in the app.
              </p>
              <Link href="/app"
                    className="w-full border border-teal/40 text-teal hover:bg-teal/10 text-sm py-2 rounded-lg transition text-center block cursor-pointer">
                Check Status →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
