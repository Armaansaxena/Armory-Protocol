#!/bin/bash
# Step 1: Build the program
anchor build

# Step 2: Get the program keypair pubkey
solana address -k target/deploy/armory_protocol-keypair.json

# Step 3: Airdrop SOL to deployer if needed
solana airdrop 2 --url devnet

# Step 4: Deploy to devnet
anchor deploy --provider.cluster devnet

# Step 5: Upload IDL to devnet
anchor idl init --filepath target/idl/armory_protocol.json \
  VRPxpqkBTXgi1DaQ1t1yVyhD8PSCw6uBDrQx1zZznUk \
  --provider.cluster devnet

# Step 6: Initialize RegistryConfig on devnet
# (runs initialize_config with admin + verifier keypairs)
npx ts-node scripts/initialize-devnet.ts

echo "Deployment complete. Program ID: VRPxpqkBTXgi1DaQ1t1yVyhD8PSCw6uBDrQx1zZznUk"
echo "Verify at: https://explorer.solana.com/address/VRPxpqkBTXgi1DaQ1t1yVyhD8PSCw6uBDrQx1zZznUk?cluster=devnet"
