import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import { useLocation } from 'react-router-dom';
import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "../idl/armory_protocol";
import { getVerdictStatus, formatExpiry, truncateAddress } from "../utils/verdict";
import styled, { keyframes } from 'styled-components';
import { CyberInput, PremiumButton, techGlow } from '../styles/shared';

const PROGRAM_ID = new PublicKey("VRPxpqkBTXgi1DaQ1t1yVyhD8PSCw6uBDrQx1zZznUk");
const IDL = require("../idl/armory_protocol.json");

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageWrapper = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeroContainer = styled.div`
  text-align: center;
  padding: 120px 20px 60px 20px;
  animation: ${fadeIn} 0.8s ease-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at center, rgba(0, 168, 150, 0.05) 0%, rgba(0,0,0,0) 70%);
    pointer-events: none;
  }
`;

const SubtitleBadge = styled.div`
  color: #00A896; 
  font-weight: 700; 
  text-transform: uppercase; 
  font-size: 13px; 
  letter-spacing: 2px; 
  margin-bottom: 16px;
`;

const CyberTitle = styled.h1`
  font-size: 56px;
  font-weight: 800;
  margin: 0 0 20px 0;
  letter-spacing: -2.5px;
  line-height: 1.1;
  color: #FFFFFF;
`;

const HeroDescription = styled.p`
  color: #8B949E; 
  font-size: 18px; 
  margin: 0 auto 48px auto; 
  max-width: 540px; 
  line-height: 1.6; 
  font-weight: 400;
`;

const SearchWrapper = styled.div`
  display: flex;
  background: #0D1117;
  border-radius: 16px;
  border: 1px solid #1A1F26;
  padding: 8px;
  height: 76px;
  max-width: 850px;
  margin: 0 auto;
  box-shadow: 0 30px 60px rgba(0,0,0,0.5);
  transition: border-color 0.3s ease;

  &:hover, &:focus-within {
    border-color: rgba(0, 168, 150, 0.5);
    animation: ${techGlow} 2s infinite;
  }
`;

const QueryPage: React.FC = () => {
  const location = useLocation();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalEntities: '0', lookupTime: '0' });
  const [isProgramMissing, setIsProgramMissing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const domainParam = params.get('domain');
    if (domainParam) {
      setInput(domainParam);
    }
    fetchStats();
  }, [location]);

  const fetchStats = async () => {
    try {
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const program = new Program(IDL, { connection } as any) as Program<ArmoryProtocol>;
      const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
      const config = await program.account.registryConfig.fetch(configPda);
      setStats(prev => ({ ...prev, totalEntities: config.totalEntities.toString() }));
      setIsProgramMissing(false);
    } catch (e) {
      setIsProgramMissing(true);
    }
  };

  const handleCopy = (text: string, e: any) => {
    navigator.clipboard.writeText(text);
    const oldText = e.target.innerText;
    e.target.innerText = 'Copied!';
    setTimeout(() => { e.target.innerText = oldText; }, 2000);
  };

  const checkDomain = async () => {
      const cleanInput = input.trim();
      if (!cleanInput) return;
      setLoading(true);
      setResult(null);
      setError(null);
      const startTime = Date.now();

      try {
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const program = new Program(IDL, { connection } as any) as Program<ArmoryProtocol>;
        
        let entityRecord: any = null;
        let dexFallback: any = null;

        if (cleanInput.includes('.')) {
          // Web-safe SHA-256 implementation using Web Crypto API instead of Node crypto wrappers
          const msgBuffer = new TextEncoder().encode(cleanInput.toLowerCase().trim());
          const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const domainHashBytes = Buffer.from(hashArray);

          // Derive the exact PDA using the raw byte array directly
          const [entityPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("entity"), domainHashBytes], 
            PROGRAM_ID
          );

          try {
            entityRecord = await program.account.entityRecord.fetch(entityPda);
          } catch (fetchError) {
            console.error("Failed to fetch entity PDA from Devnet:", fetchError);
          }
        } else {
          let searchPubkey: PublicKey;
          try {
            searchPubkey = new PublicKey(cleanInput);
          } catch (e) {
            setError("Invalid wallet address format.");
            setLoading(false);
            return;
          }

          try {
            const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
              filters: [{ memcmp: { offset: 40, bytes: searchPubkey.toBase58() } }],
            });
            if (accounts.length > 0) {
              entityRecord = program.coder.accounts.decode("EntityRecord", accounts[0].account.data);
            }
          } catch (gpaError) {
            console.error("Failed getProgramAccounts filtering:", gpaError);
          }

          if (!entityRecord) {
            try {
              const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${cleanInput}`);
              if (res.ok) {
                  const json = await res.json();
                  const solanaPair = (json.pairs || []).find((p: any) => p.chainId === 'solana');
                  if (solanaPair) {
                      dexFallback = {
                          name: solanaPair.baseToken.address === cleanInput ? solanaPair.baseToken.name : solanaPair.quoteToken.name,
                          symbol: solanaPair.baseToken.address === cleanInput ? solanaPair.baseToken.symbol : solanaPair.quoteToken.symbol,
                          logo: solanaPair.info?.imageUrl
                      };
                  }
              }
            } catch (e) {}
          }
        }

        const lookupTime = Date.now() - startTime;
        setStats(prev => ({ ...prev, lookupTime: `${lookupTime}ms` }));
        const status = getVerdictStatus(entityRecord);

        setResult({ status, data: entityRecord, dexFallback });
      } catch (e: any) {
        console.error("Global checkDomain Error:", e);
        setError("Network unavailable. Please check your connection.");
      } finally {
        setLoading(false);
      }
  };

  return (
    <PageWrapper>
      {isProgramMissing && (
        <div style={{ background: '#F59E0B', color: '#000', padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', marginTop: '20px' }}>
          ⚠️ Program not found on Devnet. Ensure deployment and check RPC URL.
        </div>
      )}
      
      <HeroContainer>
        <SubtitleBadge>Agentic Web Security Layer</SubtitleBadge>
        <CyberTitle>
          Is this address <span style={{ color: '#00A896' }}>safe</span> to pay?
        </CyberTitle>
        <HeroDescription>
          Search any Solana wallet or domain to verify its cryptographic identity before sending funds or triggering agent execution.
        </HeroDescription>
        
        <SearchWrapper>
          <CyberInput 
            type="text" 
            value={input} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && checkDomain()}
            placeholder="Search domain (e.g. amazon.in) or wallet address..."
          />
          <PremiumButton primary onClick={checkDomain} disabled={loading} style={{ width: '140px', height: '100%' }}>
            {loading ? '...' : 'Verify Identity'}
          </PremiumButton>
        </SearchWrapper>

        <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <span style={{ color: '#484F58', fontSize: '13px', alignSelf: 'center', fontWeight: 500 }}>Quick Lookups:</span>
          {['demo.armory.dev', 'testmerchant.in'].map(p => (
            <button key={p} onClick={() => setInput(p)} style={{ background: '#161B22', border: '1px solid #30363D', color: '#8B949E', padding: '8px 16px', borderRadius: '99px', fontSize: '13px', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      </HeroContainer>

      <div style={{ paddingBottom: '100px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="spinner" style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid rgba(0, 168, 150, 0.1)', borderTopColor: '#00A896', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', padding: '20px', borderRadius: '12px', color: '#EF4444', textAlign: 'center', fontWeight: 600 }}>
            {error}
          </div>
        )}
        
        {result && !loading && !error && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {result.status === "Verified" ? (
              <div style={{ background: '#0D1117', borderRadius: '20px', padding: '40px', border: '1px solid #30363D', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#00A896' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <div>
                    <div style={{ color: '#00A896', fontWeight: 800, fontSize: '14px', letterSpacing: '1px', marginBottom: '8px' }}>✅ VERIFIED MERCHANT</div>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>{result.data.entityName}</h2>
                    <div style={{ color: '#8B949E', fontSize: '16px', marginTop: '4px' }}>{result.data.domain}</div>
                  </div>
                  <div style={{ background: 'rgba(0, 168, 150, 0.1)', color: '#00A896', padding: '8px 16px', borderRadius: '99px', fontSize: '14px', fontWeight: 700 }}>Trust Index: 100/100</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div style={{ borderTop: '1px solid #1A1F26', paddingTop: '20px' }}>
                    <div style={{ color: '#8B949E', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Official Wallet</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <code style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 600 }}>{truncateAddress(result.data.officialPubkey.toBase58())}</code>
                      <button onClick={(e) => handleCopy(result.data.officialPubkey.toBase58(), e)} style={{ background: '#161B22', border: '1px solid #30363D', color: '#8B949E', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Copy</button>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #1A1F26', paddingTop: '20px' }}>
                    <div style={{ color: '#8B949E', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Certificate Expiry</div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>{formatExpiry(result.data.expirationEpoch)}</div>
                  </div>
                </div>
                <div style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
                  <a href={`https://explorer.solana.com/address/${result.data.officialPubkey.toBase58()}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ background: '#FFFFFF', color: '#05080F', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>View on Solana Explorer</a>
                </div>
              </div>
            ) : (
              <div style={{ background: '#0D1117', borderRadius: '20px', padding: '40px', border: '1px solid #30363D', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>{result.status === "Expired" ? '🔴' : '⚠️'}</div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: result.status === "Expired" ? '#EF4444' : '#F59E0B' }}>{result.status === "Expired" ? 'VERIFICATION EXPIRED' : 'UNKNOWN IDENTITY'}</h2>
                <p style={{ color: '#8B949E', fontSize: '16px', maxWidth: '450px', margin: '16px auto' }}>{result.status === "Expired" ? "This merchant was previously verified but has failed to renew their certificate." : "No on-chain verification record found. High risk of phishing detected."}</p>
                {result.dexFallback && (
                  <div style={{ marginTop: '32px', padding: '24px', background: '#161B22', borderRadius: '16px', border: '1px solid #30363D', display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
                    {result.dexFallback.logo && <img src={result.dexFallback.logo} width="48" style={{ borderRadius: '50%' }} alt="token" />}
                    <div><div style={{ color: '#8B949E', fontSize: '12px', fontWeight: 600 }}>ECOSYSTEM LABEL</div><div style={{ fontSize: '18px', fontWeight: 700 }}>{result.dexFallback.name} ({result.dexFallback.symbol})</div></div>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '40px', padding: '20px', background: '#0D1117', border: '1px solid #1A1F26', borderRadius: '16px' }}>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '18px' }}>{stats.totalEntities}</div><div style={{ color: '#8B949E', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Identities</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#00A896', fontWeight: 800, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: isProgramMissing ? '#EF4444' : '#00A896', borderRadius: '50%' }} />Devnet</div><div style={{ color: '#8B949E', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Network</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '18px' }}>{stats.lookupTime}</div><div style={{ color: '#8B949E', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Latency</div></div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default QueryPage;