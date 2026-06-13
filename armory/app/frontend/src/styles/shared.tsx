import styled, { keyframes } from 'styled-components';

export const techGlow = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 168, 150, 0.2); }
  50% { box-shadow: 0 0 20px rgba(0, 168, 150, 0.5); }
  100% { box-shadow: 0 0 5px rgba(0, 168, 150, 0.2); }
`;

interface PremiumButtonProps {
  primary?: boolean;
}

export const PremiumButton = styled.button<PremiumButtonProps>`
  background: ${props => props.primary ? 'linear-gradient(135deg, #00A896 0%, #007669 100%)' : '#1A1F26'};
  color: ${props => props.primary ? '#FFFFFF' : '#8B949E'};
  border: ${props => props.primary ? 'none' : '1px solid #30363D'};
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: -0.5px;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.primary ? '0 8px 16px rgba(0, 168, 150, 0.3)' : '0 8px 16px rgba(0, 0, 0, 0.4)'};
  }

  &:active {
    transform: translateY(1px);
  }
`;

export const CyberInput = styled.input`
  flex: 1;
  padding: 0 24px;
  background: transparent;
  border: none;
  color: #FFFFFF;
  font-size: 18px;
  outline: none;
  font-weight: 500;
  height: 100%;

  &::placeholder {
    color: #484F58;
  }
`;