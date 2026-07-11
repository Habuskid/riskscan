# PRD: RiskScan — Wallet & Token Risk Scanner Agent
### OKX AI Genesis Hackathon — Software Utility / Finance Copilot

---

## 1. Overview

**What it is:** An always-on AI agent that checks any wallet address or token contract for scam, rug-pull, and malicious-approval risk, and returns a plain-English verdict with a risk score — before the user signs anything.

**Format:** Web app (thin demo frontend) + backend API (the real product, registered as an A2MCP pay-per-call service on OKX AI).

**One-line pitch:** "Paste an address or token before you interact with it. Get a verdict in seconds, not after you've been drained."

---

## 2. Problem

Scams, honeypots, and malicious token approvals are one of the most common ways crypto users lose funds. Most people have no easy way to check a contract or wallet before interacting with it — they rely on gut feeling or asking in Discord. This is a daily, recurring need across every chain OKX operates on.

---

## 3. Target User

- Retail traders about to buy a new/unknown token
- Anyone about to approve a token spend or connect a wallet to a new dApp
- Other AI agents on OKX AI that need a trust check before executing a task on a user's behalf (A2A composability angle)

---

## 4. Core Features (MVP — build in 5 days)

1. **Input:** wallet address OR token contract address (+ chain selector: start with Ethereum, add BSC/Base if time allows)
2. **Risk data pull:** query GoPlus Security API (free tier) for:
   - Honeypot detection
   - Mint/ownership risk (can deployer mint unlimited supply, pause trading, blacklist holders)
   - Malicious approval history
   - Known scam/sanctioned address flags
3. **AI verdict layer:** feed raw GoPlus JSON to Gemini API with a fixed prompt template → returns:
   - Risk score (Low / Medium / High / Critical)
   - 2–3 sentence plain-English explanation of *why*
   - One-line recommendation ("Safe to interact" / "Do not approve unlimited spend" / "Avoid entirely")
4. **Output display:** simple result card on the web frontend — score, explanation, recommendation, link to raw data source

## 5. Out of Scope (for hackathon MVP)

- Real-time monitoring/alerts (that's a v2 feature, not needed for launch)
- Multi-wallet portfolio-wide scanning
- Historical price/trading data
- Chains beyond Ethereum (+1 stretch chain if time permits)

---

## 6. Technical Architecture

```
User/Agent request
      ↓
[Backend API] ──→ GoPlus Security API (risk data)
      ↓
[Gemini API] ──→ generates verdict from risk data
      ↓
Response returned → (a) to demo web frontend, or
                    (b) to OKX AI as A2MCP paid response
```

**Stack (all free-tier):**
- Backend: Node.js or Python (whichever your agent scaffolds faster) — single API route, e.g. `POST /scan`
- AI: Gemini API (existing key)
- Risk data: GoPlus Security API (free tier, no card required)
- Frontend: simple single-page app — input box, submit, result card. No auth needed for demo.
- Hosting: any free-tier host (Vercel/Render free plan) — needs to be reachable by OKX AI infra

---

## 7. OKX Integration Requirements (non-negotiable, from OKX docs)

| Requirement | What it means for this build |
|---|---|
| Onchain OS skill install | `npx skills add okx/onchainos-skills --yes -g` — sets up the agent's environment via OKX's toolkit |
| Agentic Wallet | Prompt your build agent: *"Log in to Agentic Wallet on Onchain OS with my email"* — this is your agent's identity + payout destination |
| Register as A2MCP | Prompt: *"Help me register an A2MCP ASP on OKX.AI using OKX Agent Identity from Onchain OS"* — fits this agent perfectly since input/output is fixed-shape (address → verdict) |
| x402 payment standard | **Required** — the A2MCP endpoint must speak the x402 payment protocol. This is the part most likely to trip up review, so confirm it's implemented correctly early, not at the last minute |
| List the ASP | Prompt: *"Help me list my ASP on OKX.AI using Onchain OS"* |
| Pass OKX internal review | Reviewed within 24 hours, result emailed to the Agentic Wallet email. Submission is invalid if the ASP isn't approved and live — submit for listing with at least a day of buffer before the deadline |
| Submit Google form | Before Jul 17, 23:59 UTC — must include ASP details + link to X post |
| X post with #okxai | 90-second demo max, must explain the ASP and the problem it solves |
| Dispute handling (post-launch, not a build blocker) | If a delivery is rejected, arbitration can be filed within a day but requires a 5% bounty deposit — refunded if won, forfeited if lost |

---

## 8. Demo Script (90 seconds)

1. (0–15s) "Every day, people lose funds approving tokens they didn't check."
2. (15–45s) Live: paste a known scam token address → RiskScan returns "Critical — unlimited mint function, deployer can drain liquidity" in seconds
3. (45–70s) Paste a legitimate token → "Low risk" verdict, contrast shown
4. (70–90s) "It's live on OKX.AI right now, pay-per-call, no signup needed." Show OKX.AI listing.

---

## 9. Success Criteria for Hackathon Submission

- [ ] Agent returns accurate verdicts on 15+ test addresses (known-good and known-scam)
- [ ] A2MCP + Payment SDK integration working end-to-end (request → verdict → payment settles)
- [ ] Agentic Wallet live and receiving test payments
- [ ] ASP submitted for listing with at least a day of buffer before the Jul 17, 23:59 UTC deadline (review takes up to 24 hours)
- [ ] Demo video recorded and posted with #okxai
- [ ] Google form submitted with ASP details + X post link

---

## 10. Risks / Watch-outs

- **x402 payment standard implementation is the highest-risk block** — this is a specific protocol the endpoint must speak correctly, not a generic integration; verify it early with a test call rather than assuming it works
- GoPlus free tier may rate-limit under heavy testing — cache test results locally while iterating
- Review takes up to 24 hours — submit for listing with buffer before the Jul 17, 23:59 UTC deadline, not on the day itself
