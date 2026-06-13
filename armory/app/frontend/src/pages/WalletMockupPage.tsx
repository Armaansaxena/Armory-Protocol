import React, { useState } from 'react';
import styled from 'styled-components';

const MockContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #020408;
  padding: 20px;
`;

const PhantomFrame = styled.div`
  width: 375px;
  height: 600px;
  background: #121212;
  border-radius: 24px;
  border: 4px solid #1A1F26;
  box-shadow: 0 40px 100px rgba(0,0,0,0.8);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const TopBar = styled.div`
  height: 60px;
  background: #1A1A1A;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #2A2A2A;
`;

const Content = styled.div`
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 32px;
  text-align: center;
  color: #FFFFFF;
`;

const Label = styled.label`
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  background: #1E1E1E;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 16px;
  color: #FFF;
  font-family: monospace;
  font-size: 14px;
  margin-bottom: 24px;
  outline: none;
  &:focus { border-color: #AB9FF2; }
`;

const AmountBox = styled.div`
  background: #1E1E1E;
  padding: 20px;
  border-radius: 16px;
  margin-bottom: auto;
`;

const SendButton = styled.button`
  width: 100%;
  padding: 18px;
  background: #AB9FF2;
  color: #000;
  border: none;
  border-radius: 16px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  margin-top: 24px;
  &:hover { background: #9688E3; }
`;

const WalletMockupPage: React.FC = () => {
  const [address, setAddress] = useState('');

  return (
    <MockContainer>
      <div style={{ marginRight: '60px', maxWidth: '400px' }}>
        <h1 style={{ color: '#00A896', fontSize: '32px', marginBottom: '16px' }}>Wallet Simulator</h1>
        <p style={{ color: '#888', lineHeight: '1.6' }}>
          This page simulates a wallet UI (like Phantom). Since this is a webpage, our 
          Chrome Extension can interact with it to show the 
          <strong> Armory Verification Layer</strong>.
        </p>
        <div style={{ marginTop: '32px', padding: '16px', background: '#0D1117', borderLeft: '4px solid #00A896', borderRadius: '8px' }}>
          <p style={{ color: '#FFF', fontSize: '14px', marginBottom: '8px' }}><strong>Try this:</strong></p>
          <code style={{ color: '#00A896', display: 'block', wordBreak: 'break-all', fontSize: '12px' }}>
            88fS66N9y6p3Hh9pT6H2V2R6T6H2V2R6T6H2V2R6
          </code>
          <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
            (Paste the demo address above into the wallet's recipient field)
          </p>
        </div>
      </div>

      <PhantomFrame>
        <TopBar>
          <div style={{ color: '#AB9FF2', fontWeight: 800 }}>PHANTOM (MOCK)</div>
          <div style={{ color: '#666' }}>✕</div>
        </TopBar>
        <Content>
          <Header>Send SOL</Header>
          
          <Label>Recipient Address</Label>
          <Input 
            placeholder="Paste Solana address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Label>Amount</Label>
          <AmountBox>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: 600 }}>0.00</span>
              <span style={{ color: '#888' }}>SOL</span>
            </div>
          </AmountBox>

          <SendButton>Next</SendButton>
          
          <div style={{ textAlign: 'center', marginTop: '16px', color: '#555', fontSize: '11px' }}>
            NETWORK: SOLANA DEVNET
          </div>
        </Content>
      </PhantomFrame>
    </MockContainer>
  );
};

export default WalletMockupPage;
