# Armory Protocol: The Agentic Web Identity Layer

Armory Protocol is a decentralized identity registry on Solana designed specifically for the **Agentic Web**. It provides a cryptographic bridge between Web2 domains (DNS) and Web3 wallets (Pubkeys), enabling AI agents and automated protocols to verify the authentic identity behind any on-chain address with 100% cryptographic certainty.

---

## 1. High-Level Architecture Design

The system is composed of four decoupled layers that interact seamlessly to maintain an immutable, trustless source of truth.

### System Topology

```mermaid
graph TD
    subgraph Web2_Infrastructure [Web2 Infrastructure]
        D[Merchant Domain Server]
        SSL[SSL/TLS Certificate Layer]
    end

    subgraph Verification_Oracle [Verification Oracle]
        W{{Node.js Worker}}
        P[Multi-Proxy Fallback System]
    end

    subgraph Blockchain_Layer [Solana / Anchor Program]
        RC[(RegistryConfig PDA)]
        ER[(EntityRecord PDA)]
        I[Program Instructions]
    end

    subgraph Client_Layer [Client Layer]
        FE[React 'Truth Portal']
        WA[Wallet Adapter]
        API[DexScreener/Ecosystem API]
    end

    FE -- "1. Registration" --> I
    I -- "Writes" --> ER
    W -- "2. Monitor" --> ER
    W -- "3. SSL Handshake" --> D
    D -- "solana-wallet.json" --> W
    W -- "4. Sign Verdict" --> I
    FE -- "5. Hybrid Query" --> RC
    FE -- "5. Hybrid Query" --> ER
    FE -- "6. Fallback" --> API
```


## 2. Component-Level Workflows

### A. Merchant Registration Flow
How a domain owner claims their on-chain identity.

```mermaid
sequenceDiagram
    participant M as Merchant
    participant W as Web Server
    participant F as Frontend
    participant S as Solana Blockchain

    M->>F: Enter Domain and Wallet Pubkey
    F->>F: Generate JSON Snippet
    F->>M: Display Snippet and Target Path
    M->>W: Upload to /.well-known/solana-wallet.json
    F->>F: Pre-check via CORS Proxy
    M->>F: Click Register On-Chain
    F->>S: register_entity
    S->>S: Derive PDA
    S-->>F: Success Status Unverified
```

### B. The 'Waterfall' Search Engine
The logic used by the UI and AI agents to resolve trust.

```mermaid
flowchart TD
    Start([Input Domain or Address]) --> IsDomain{Is it a Domain?}
    
    IsDomain -- Yes --> DerivePDA[Derive PDA]
    DerivePDA --> FetchPDA[Fetch EntityRecord PDA]
    FetchPDA --> Found{Found?}
    
    IsDomain -- No --> GPA[Reverse Lookup GPA Filter]
    GPA --> Found
    
    Found -- Yes --> CheckExpiry{Is Expired?}
    CheckExpiry -- No --> Verified[✅ VERIFIED ON-CHAIN]
    CheckExpiry -- Yes --> Expired[🔴 EXPIRED]
    
    Found -- No --> Dex[Fetch DexScreener API]
    Dex --> AssetFound{Found in Ecosystem?}
    AssetFound -- Yes --> EcoBadge[🔍 ECOSYSTEM LABEL]
    AssetFound -- No --> Unknown[🔐 UNKNOWN IDENTITY ??]
```

---

## 3. On-Chain State Management

### Entity Record Lifecycle

```mermaid
stateDiagram-v2
    direction LR
    state "Registration Pending" as S1
    state "Active & Verified" as S2
    state "Verification Expired" as S3
    state "Revoked / Fraud" as S4

    [*] --> S1: Merchant Registers
    S1 --> S2: Oracle Proof Signed
    S2 --> S3: 90 Days Elapsed
    S3 --> S2: Oracle Re-Verified
    S2 --> S4: Admin Kill-switch
    S4 --> S1: Re-Registration
```

---

## 4. Account Structure & Indexing Blueprint

### PDA Seed Derivation
```mermaid
graph LR
    subgraph Input
        D[domain amazon.com]
    end
    subgraph Hashing
        H[SHA-256]
    end
    subgraph Seed
        B[prefix entity]
        S[32-byte Hash]
    end
    subgraph Address
        A[(EntityRecord PDA)]
    end

    D --> H
    H --> S
    B --> A
    S --> A
```

### Data Layout (Surgical Indexing)
| Offset | Field | Type | Description |
| :--- | :--- | :--- | :--- |
| 0 | Discriminator | `[u8; 8]` | Anchor Identifier |
| 8 | `domain_hash` | `[u8; 32]` | Fixed-offset index for GPA |
| **40** | **`official_pubkey`** | **`Pubkey`** | **Primary Reverse-Lookup Anchor** |
| 72 | `verification_status`| `bool` | Trust State |
| 73 | `expiration_epoch` | `i64` | Unix Expiry |

---

## 5. Security Model: The Trust Bridge

Armory tokenizes DNS trust onto Solana by bridging Web2 security (SSL) with Web3 immutability.

```mermaid
graph LR
    subgraph Web2_Trust [Web2 SSL Wall]
        DNS[DNS Root] --> SSL[SSL Cert]
        SSL --> Server[Merchant Server]
    end
    
    subgraph Bridge [The Oracle]
        O{{Armory Worker}}
    end

    subgraph Web3_Trust [Web3 Immutable Wall]
        S[(Solana Registry)]
    end

    Server -- holds proof --> O
    O -- validates SSL and Pubkey --> S
```

---

## 6. Technical Secret Sauce

1.  **Infinite Domain Support**: By hashing domains into SHA-256 seeds, we bypass Solana’s 32-byte seed limit, supporting any URL length.
2.  **Surgical Offsets**: Storing `official_pubkey` at exactly byte 40 enables ultra-fast, index-free reverse lookups directly on any RPC node.
3.  **Agent-First**: The architecture provides programmatic, on-chain truth designed for AI agents to consume via one instruction call.

---
**Armory Protocol — Turbin3 Q2 2026**
*The cryptographic source of truth for the Agentic Web.*
