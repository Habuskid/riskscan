# RiskScan

RiskScan is a token and wallet address security scanner that returns a plain-English risk verdict before you interact with an on-chain address. It is registered as an AI Service Provider (ASP) on the OKX AI Agent Marketplace and implements the x402 micropayment standard so other agents can call it autonomously without human approval.

## What It Does

Submit a token contract address or wallet address along with a chain identifier. RiskScan fetches live security data from the GoPlus Security API, runs it through Gemini to produce a structured verdict, and returns a risk score (Low, Medium, High, or Critical), a plain-English explanation, and an actionable recommendation.

## Architecture

```
Browser / Agent
      |
      | POST /scan  { address, chainId }
      | x402 PAYMENT-SIGNATURE header (0.05 USDT)
      v
Express server (index.js)
      |
      |-- OKXFacilitatorClient  -->  OKX x402 facilitator (verify + settle on X Layer)
      |
      |-- GoPlus Security API   -->  token_security / address_security / solana/token_security
      |
      |-- Google Gemini API     -->  structured risk verdict (JSON)
      |
      v
{ address, chainId, isToken, verdict: { riskScore, explanation, recommendation }, rawGoPlusData }
```

## Payment Standard

The `/scan` endpoint is protected by the x402 payment protocol implemented via `@okxweb3/x402-express`. A caller that sends a request without a valid payment header receives HTTP 402 with a `PAYMENT-REQUIRED` header containing the base64-encoded payment requirements. The caller signs the payment using their Agentic Wallet and retries with a `PAYMENT-SIGNATURE` header. Settlement and verification are handled by the OKX facilitator on X Layer Mainnet (EIP-155 chain ID 196) in USDT.

Fee: 0.05 USDT per scan.

## Supported Chains

| Chain | ID |
|-------|----|
| Ethereum | 1 |
| BNB Smart Chain | 56 |
| Polygon | 137 |
| Arbitrum One | 42161 |
| Optimism | 10 |
| Base | 8453 |
| Avalanche C-Chain | 43114 |
| Fantom | 250 |
| Solana | solana |

Chain support is determined by GoPlus Security API coverage. Chains not listed above return no risk data.

## API Reference

### POST /scan

**Request body**

```json
{
  "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "chainId": "1"
}
```

- `address` (required): Token contract address or wallet address. Use the standard base58 address format for Solana.
- `chainId` (required): Chain identifier as listed in the supported chains table. Use the string `"solana"` for Solana.

**Response (200)**

```json
{
  "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "chainId": "1",
  "isToken": true,
  "verdict": {
    "riskScore": "Low",
    "explanation": "Tether USD is a well-established stablecoin with over 5 million holders and high liquidity across major exchanges. Standard admin controls such as blacklisting are expected for a regulated stablecoin and do not indicate malicious intent at this scale.",
    "recommendation": "Safe to interact with. Verify you are using the correct contract address before transacting."
  },
  "rawGoPlusData": { ... }
}
```

**Response (402)**

Returned when no valid `PAYMENT-SIGNATURE` header is present. The `PAYMENT-REQUIRED` header contains a base64-encoded JSON object with scheme, network, amount, asset address, and payTo fields required to construct a valid payment.

**Response (404)**

Returned when GoPlus has no data for the submitted address on the selected chain.

## Running Locally

**Requirements:** Node.js 18 or later.

1. Clone the repository and install dependencies.

```bash
git clone https://github.com/Habuskid/riskscan.git
cd riskscan
npm install
```

2. Create a `.env` file in the project root with the following variables.

```
GEMINI_API_KEY=your_gemini_api_key
OKX_API_KEY=your_okx_api_key
OKX_SECRET_KEY=your_okx_secret_key
OKX_PASSPHRASE=your_okx_passphrase
```

3. Start the server.

```bash
node index.js
```

The server listens on port 3000 by default. Set the `PORT` environment variable to override.

4. Open `index.html` in a browser to use the UI. Change the fetch URL in `index.html` from `https://riskscan.onrender.com/scan` to `http://localhost:3000/scan` for local testing.

Note: The x402 payment middleware will attempt to connect to the OKX facilitator on startup. An internet connection and valid OKX API credentials are required.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key. Used by `@google/genai` for risk verdict generation. |
| `OKX_API_KEY` | OKX developer API key. Used by `OKXFacilitatorClient` to authenticate with the x402 facilitator. |
| `OKX_SECRET_KEY` | OKX developer secret key. |
| `OKX_PASSPHRASE` | OKX developer passphrase. |
| `PORT` | (Optional) Port for the Express server. Defaults to 3000. |

## Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `cors` | Cross-origin request handling |
| `axios` | GoPlus API requests |
| `@google/genai` | Gemini AI verdict generation |
| `@okxweb3/x402-express` | x402 payment middleware for Express |
| `@okxweb3/x402-core` | OKX facilitator client |
| `@okxweb3/x402-evm` | EVM payment scheme (ExactEvmScheme) |
| `dotenv` | Environment variable loading |

## Deployment

The live endpoint is deployed on Render at `https://riskscan.onrender.com`. Render reads environment variables from its dashboard. The free tier spins the instance down after 15 minutes of inactivity; the first request after a cold start may take up to 60 seconds.

## OKX AI Marketplace

RiskScan is registered as an ASP on the OKX AI Agent Marketplace under agent ID 5059. Agents that support the x402 protocol can call the `/scan` endpoint directly and pay per scan without human intervention.

Service name: Risk Analysis API
Fee: 0.05 USDT per request
Endpoint: https://riskscan.onrender.com/scan

## License

ISC
