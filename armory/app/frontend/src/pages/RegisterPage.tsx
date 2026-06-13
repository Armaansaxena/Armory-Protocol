import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "../idl/armory_protocol";
import { fetchWellKnown } from "../utils/fetchWellKnown";

const PROGRAM_ID = new PublicKey("VRPxpqkBTXgi1DaQ1t1yVyhD8PSCw6uBDrQx1zZznUk");
const IDL = require("../idl/armory_protocol.json");

const RegisterPage: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState('');
  const [walletAddr, setWalletAddr] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [fileVerified, setFileVerified] = useState<boolean | null>(null);
  const [fileError, setFileError] = useState('');
  const [isCheckingFile, setIsCheckingFile] = useState(false);
  const [skipFileCheck, setSkipFileCheck] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [txSignature, setTxSignature] = useState('');
  const [pdaAddress, setPdaAddress] = useState('');

  const domainError = domain && (domain.includes('https://') || domain.includes('/')) 
    ? 'Remove protocol (https://) and paths' 
    : domain.length > 64 ? 'Max 64 characters' : '';

  let isWalletValid = false;
  if (walletAddr) {
    try {
      new PublicKey(walletAddr);
      isWalletValid = walletAddr.length >= 32 && walletAddr.length <= 44;
    } catch {
      isWalletValid = false;
    }
  }
  const walletError = walletAddr && !isWalletValid ? 'Invalid Solana address format' : '';

  const step1Valid = domain && !domainError && walletAddr && !walletError && businessName && businessName.length <= 100;

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
    if (!wallet.publicKey || !wallet.signTransaction) {
      setSubmitError('Connect your wallet first.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const provider = new anchor.AnchorProvider(connection, wallet as any, { preflightCommitment: "confirmed" });
      const program = new Program(IDL, provider) as Program<ArmoryProtocol>;
      
      // Native Web Crypto SHA-256 (matches QueryPage and Smart Contract)
      const msgBuffer = new TextEncoder().encode(domain.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const domainHash = Buffer.from(new Uint8Array(hashBuffer));
      
      const [entityPda] = PublicKey.findProgramAddressSync([Buffer.from("entity"), domainHash], PROGRAM_ID);
      const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);

      const tx = await program.methods
        .registerEntity(domain.trim().toLowerCase(), new PublicKey(walletAddr), businessName)
        .accounts({
          entityAuthority: wallet.publicKey,
          config: configPda,
          entityRecord: entityPda,
        } as any)
        .rpc();

      setTxSignature(tx);
      setPdaAddress(entityPda.toBase58());
    } catch (e: any) {
      setSubmitError(`Blockchain Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    background: '#0D1117',
    border: '1px solid #30363D',
    color: '#FFFFFF',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    marginTop: '8px'
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingTop: '80px' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-1px' }}>Register Identity</h1>
        <p style={{ color: '#8B949E', fontSize: '16px' }}>Link your DNS domain to your Solana wallet on-chain.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
        {[1, 2, 3].map(num => (
          <div key={num} style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= num ? '#00A896' : '#1A1F26', transition: 'background 0.4s' }} />
        ))}
      </div>

      <div style={{ background: '#0D1117', borderRadius: '24px', padding: '40px', border: '1px solid #30363D', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        {txSignature ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🛡️</div>
            <h2 style={{ color: '#00A896', fontSize: '24px', fontWeight: 800, margin: '0 0 16px 0' }}>Registration Submitted</h2>
            <p style={{ color: '#8B949E', lineHeight: '1.6', marginBottom: '32px' }}>Your domain <strong>{domain}</strong> is now pending verification.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div style={{ textAlign: 'left', background: '#161B22', padding: '16px', borderRadius: '12px', border: '1px solid #30363D' }}>
                <div style={{ fontSize: '11px', color: '#8B949E', marginBottom: '4px', fontWeight: 600 }}>TRANSACTION SIGNATURE</div>
                <div style={{ fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{txSignature}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ background: '#FFFFFF', color: '#05080F', padding: '14px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>View Transaction</a>
              <button onClick={() => { setTxSignature(''); setStep(1); }} style={{ background: 'transparent', border: '1px solid #30363D', color: '#8B949E', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>Register Another</button>
            </div>
          </div>
        ) : (
          <div>
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#8B949E', textTransform: 'uppercase' }}>Domain Name</label>
                  <input style={inputStyle} value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. stripe.com" />
                  {domainError && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '8px' }}>{domainError}</div>}
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#8B949E', textTransform: 'uppercase' }}>Official Wallet Address</label>
                  <input style={inputStyle} value={walletAddr} onChange={e => setWalletAddr(e.target.value)} placeholder="Solana Public Key (Base58)" />
                  {walletError && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '8px' }}>{walletError}</div>}
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#8B949E', textTransform: 'uppercase' }}>Entity / Brand Name</label>
                  <input style={inputStyle} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Stripe, Inc." />
                </div>
                <button disabled={!step1Valid} onClick={() => setStep(2)} style={{ marginTop: '12px', padding: '16px', background: step1Valid ? '#00A896' : '#1A1F26', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: step1Valid ? 'pointer' : 'not-allowed' }}>Generate Proof File</button>
              </div>
            )}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ padding: '20px', background: 'rgba(0, 168, 150, 0.05)', border: '1px dashed #00A896', borderRadius: '12px', color: '#cbd5e0', fontSize: '14px' }}>To verify ownership, you must host a JSON file on your domain's server.</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8B949E', marginBottom: '8px' }}>TARGET URL</div>
                  <code style={{ display: 'block', padding: '12px', background: '#05080F', borderRadius: '8px', color: '#00A896', fontSize: '13px' }}>https://{domain}/.well-known/solana-wallet.json</code>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8B949E', marginBottom: '8px' }}>FILE CONTENT</div>
                  <pre style={{ margin: 0, padding: '20px', background: '#05080F', borderRadius: '12px', color: '#FFFFFF', fontSize: '13px', overflowX: 'auto', border: '1px solid #1A1F26' }}>{JSON.stringify({ "solana-address": walletAddr, "solana-entity-name": businessName, "solana-network": "devnet" }, null, 2)}</pre>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={checkFile} disabled={isCheckingFile} style={{ flex: 1, padding: '14px', background: '#1A1F26', border: '1px solid #30363D', color: '#FFFFFF', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>{isCheckingFile ? 'Scanning DNS...' : 'Verify My File'}</button>
                  <button onClick={() => { setSkipFileCheck(true); setStep(3); }} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid transparent', color: '#484F58', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>Skip for now</button>
                </div>
                {fileVerified && <div style={{ color: '#00A896', fontWeight: 600, textAlign: 'center' }}>✅ Proof file detected successfully!</div>}
                {fileError && (
                  <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', fontSize: '12px', textAlign: 'center' }}>
                    <div style={{ color: '#F59E0B', fontWeight: 700, marginBottom: '4px' }}>BROWSER LIMITATION</div>
                    <div style={{ color: '#8B949E' }}>CORS security may be blocking direct access from the browser. The <strong>Armory Oracle</strong> will still be able to verify your domain in the next step.</div>
                  </div>
                )}
                <button disabled={!fileVerified && !skipFileCheck} onClick={() => setStep(3)} style={{ padding: '16px', background: '#00A896', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Next: Complete Registration</button>
              </div>
            )}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ padding: '24px', background: '#161B22', borderRadius: '16px', border: '1px solid #30363D' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div><div style={{ fontSize: '11px', color: '#8B949E' }}>DOMAIN</div><div style={{ fontWeight: 700 }}>{domain}</div></div>
                    <div><div style={{ fontSize: '11px', color: '#8B949E' }}>ENTITY</div><div style={{ fontWeight: 700 }}>{businessName}</div></div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#8B949E', textAlign: 'center' }}>Required Rent Deposit: <strong>~0.003 SOL</strong></div>
                {!wallet.connected ? (
                  <div style={{ textAlign: 'center' }}><WalletMultiButton className="armory-wallet-btn" /></div>
                ) : (
                  <button onClick={registerOnChain} disabled={isSubmitting} style={{ padding: '16px', background: '#00A896', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '18px', cursor: 'pointer' }}>{isSubmitting ? 'Signing Transaction...' : 'Register On-Chain'}</button>
                )}
                {submitError && <div style={{ color: '#EF4444', fontSize: '13px', textAlign: 'center' }}>{submitError}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
