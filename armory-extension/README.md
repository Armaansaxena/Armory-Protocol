# Armory Protocol — Chrome Extension

## Install in Chrome (Developer Mode)

1. Open Chrome and go to: `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `armory-extension/` folder
5. The Armory shield icon appears in your toolbar

## Test It

1. Open any website (even Google.com)
2. Open the browser console or any text input
3. Paste one of these verified addresses:
   - Go to your Armory app (armory-protocol.vercel.app)
   - Search "demo.armory.dev" 
   - Copy the wallet address shown
   - Paste it anywhere on any webpage
   - The green verified card should appear

## Demo Flow For Presentation

1. Open Phantom wallet extension in Chrome
2. Click "Send" 
3. Paste the address of "demo.armory.dev"
4. Armory card appears OVER Phantom showing:
   ✅ Armory Protocol Demo
      demo.armory.dev
      Safe to send
5. Contrast with an unknown address:
   Paste any random address
   Armory shows ⚠️ UNVERIFIED

## Technical Details

- **Manifest V3** compliant.
- **Vanilla JavaScript**: No external dependencies or build steps.
- **On-Chain Queries**: Directly fetches from Solana Devnet RPC.
- **Reverse Lookup**: Uses `getProgramAccounts` with `memcmp` filter at offset 40.
