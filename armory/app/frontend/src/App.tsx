import React, { useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';
import './index.css';
import styled from 'styled-components';

import QueryPage from './pages/QueryPage';
import RegisterPage from './pages/RegisterPage';
import WalletMockupPage from './pages/WalletMockupPage';

interface NavLinkProps {
  active?: boolean;
}

const PremiumHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  background: rgba(5, 8, 15, 0.85);
  backdrop-filter: blur(15px);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavLinkStyled = styled(Link)<NavLinkProps>`
  color: ${props => props.active ? '#FFFFFF' : '#8B949E'};
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 6px;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.05)' : 'transparent'};
  transition: all 0.2s;
  position: relative;

  &:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.03);
  }
`;

const NavLink: React.FC<{ to: string, label: string }> = ({ to, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to === '/check' && location.pathname === '/');
  
  return (
    <NavLinkStyled to={to} active={isActive}>
      {label}
    </NavLinkStyled>
  );
};

const AppContent = () => {
  return (
    <div style={{ backgroundColor: '#05080F', minHeight: '100vh', color: '#FFFFFF' }}>
      
      <PremiumHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <Link to="/" style={{ 
            color: '#00A896', 
            textDecoration: 'none', 
            fontSize: '24px', 
            fontWeight: 800, 
            letterSpacing: '-1.5px',
            fontFamily: '"Space Grotesk", sans-serif'
          }}>
            ARMORY
          </Link>
          <div style={{ display: 'flex', gap: '8px' }}>
            <NavLink to="/check" label="Verify" />
            <NavLink to="/register" label="Register" />
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#484F58', fontSize: '12px' }}>Devnet v1.1</span>
          <WalletMultiButton className="armory-wallet-btn" />
        </div>
      </PremiumHeader>

      <main style={{ padding: '0 20px 100px 20px' }}>
        <Routes>
          <Route path="/" element={<QueryPage />} />
          <Route path="/check" element={<QueryPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/demo/wallet" element={<WalletMockupPage />} />
        </Routes>
      </main>

      <footer style={{ 
        padding: '60px 40px', 
        textAlign: 'center', 
        borderTop: '1px solid #1A1F26',
        color: '#484F58',
        fontSize: '13px'
      }}>
        <div style={{ marginBottom: '12px', color: '#8B949E', fontWeight: 500 }}>Armory Protocol — The Agentic Web Security Layer</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
          <span style={{ color: '#00A896' }}>Built on Solana</span>
          <span>sRFC-35 Standard</span>
          <a href="https://github.com/Armaansaxena" style={{ color: '#8B949E', textDecoration: 'none' }}>Open Source</a>
        </div>
      </footer>

    </div>
  );
};

const App = () => {
  const endpoint = process.env.REACT_APP_RPC_URL || "https://api.devnet.solana.com";
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  // 🛡️ Dynamically inject/force the Armory favicon into the browser document head
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    // Make sure your icon or image asset is named favicon.ico inside your public/ folder
    link.href = '/favicon.ico'; 
    link.type = 'image/x-icon';
    
    // Also update the document Title tab name while we are here!
    document.title = "Armory Protocol | Identity Oracle";
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
            <AppContent />
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;