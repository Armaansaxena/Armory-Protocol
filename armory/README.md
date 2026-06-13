# Armory Protocol

Armory Protocol is a Solana-based verification layer for agentic web and corporate wallets. It allows domains to register official public keys and name records, providing a decentralized source of truth for entity identity on-chain.

## Project Structure

- `programs/armory_protocol`: The Anchor smart contract.
- `app/worker.ts`: DNS verification worker script (Node.js).
- `app/frontend`: React UI for querying registry records.
- `tests/`: Comprehensive TypeScript test suite.

## Setup

1. **Install Dependencies:**
   ```bash
   yarn install
   ```

2. **Build the Program:**
   ```bash
   anchor build
   ```

3. **Run Tests:**
   ```bash
   anchor test
   ```

4. **Deploy to Devnet:**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

## Verification Worker

The worker script fetches DNS records (via `.well-known/solana-wallet.json`) and verifies them against registered entities.

**Usage:**
```bash
VERIFIER_KEYPAIR_PATH=~/.config/solana/id.json npx ts-node app/worker.ts <domain>
```

## Frontend

The React frontend allows users to check the verification status of domains or wallet addresses.

**Usage:**
```bash
cd app/frontend && npm install && npm start
```

## Program ID
Devnet Program ID: `VRPxpqkBTXgi1DaQ1t1yVyhD8PSCw6uBDrQx1zZznUk`
