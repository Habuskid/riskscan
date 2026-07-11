require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const { paymentMiddleware, x402ResourceServer } = require('@okxweb3/x402-express');
const { ExactEvmScheme } = require('@okxweb3/x402-evm/exact/server');
const { OKXFacilitatorClient } = require('@okxweb3/x402-core');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const facilitatorClient = new OKXFacilitatorClient({
    apiKey: process.env.OKX_API_KEY,
    secretKey: process.env.OKX_SECRET_KEY,
    passphrase: process.env.OKX_PASSPHRASE
});

const server = new x402ResourceServer(facilitatorClient)
    .register('eip155:196', new ExactEvmScheme());

const routes = {
    "/scan": {
        accepts: {
            scheme: "exact",
            network: "eip155:196",
            payTo: "0x711eb5fd8376a478c8fb351d05151a79d63eb6e2",
            price: "$0.05"
        }
    }
};

const scanMiddleware = paymentMiddleware(routes, server);

// Initialize Gemini
// Assumes GEMINI_API_KEY is present in process.env
const ai = new GoogleGenAI({});

app.post('/scan', scanMiddleware, async (req, res) => {
    try {
        const { address, chainId = '1' } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        let riskData = null;
        let isToken = false;

        // 1. Try Token Security API first
        try {
            const tokenRes = await axios.get(`https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`);
            if (tokenRes.data && tokenRes.data.result && Object.keys(tokenRes.data.result).length > 0) {
                // Key is usually the lowercased address
                const addrKey = address.toLowerCase();
                if (tokenRes.data.result[addrKey]) {
                    riskData = tokenRes.data.result[addrKey];
                    isToken = true;
                }
            }
        } catch (error) {
            console.error('Error fetching token security:', error.message);
        }

        // 2. If no token data found, fall back to Address Security API
        if (!riskData) {
            try {
                const addressRes = await axios.get(`https://api.gopluslabs.io/api/v1/address_security/${address}?chain_id=${chainId}`);
                if (addressRes.data && addressRes.data.result) {
                    riskData = addressRes.data.result;
                }
            } catch (error) {
                console.error('Error fetching address security:', error.message);
            }
        }

        if (!riskData) {
            return res.status(404).json({ error: 'No risk data found for this address.' });
        }

        // 3. Generate Verdict via Gemini
        const prompt = `
You are a crypto security expert. Analyze the following GoPlus Security risk data for a ${isToken ? 'Token Contract' : 'Wallet Address'}.
Based on the data, provide a structured risk assessment.

IMPORTANT CONTEXT RULES for your analysis:
1. "Unlocked LP" interpretation: If LP tokens are listed as unlocked, check who holds them. If they are held by a dead/burn address (e.g. containing 'dead', '0x0000000000000000000000000000000000000000') or the token contract address itself, they are effectively locked/burned and NOT a rug pull risk. Do not penalize the token for this.
2. Weighing Holder Count and Age: Contextualize boolean risk flags (like "is_blacklisted": "1") against the token's adoption. A blacklist function on a token with >100,000 holders and listings on major DEX/CEX is a completely different risk profile (e.g. Medium or Low risk) than the same flag on a new token with 12 holders (Critical risk). Do not blindly assign Critical risk to massive, established tokens just because they contain standard admin functions.

Return a valid JSON object with EXACTLY these three keys (no markdown, just raw JSON):
- "riskScore": A string, exactly one of "Low", "Medium", "High", or "Critical".
- "explanation": A 2-3 sentence plain-English explanation of why this score was given, focusing on the most alarming or reassuring metrics in the data, while accounting for the token's holder count and LP distribution.
- "recommendation": A one-line actionable recommendation.

Risk Data:
${JSON.stringify(riskData, null, 2)}
`;

        let response;
        let retries = 3;
        let delay = 2000;

        for (let i = 0; i < retries; i++) {
            try {
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json',
                    }
                });
                break; // Success
            } catch (error) {
                if (error.status === 429 && i < retries - 1) {
                    console.log(`[Rate Limit] 429 Too Many Requests. Retrying in ${delay}ms... (Attempt ${i + 1} of ${retries - 1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                } else {
                    throw error; // Rethrow other errors or if out of retries
                }
            }
        }

        let verdict;
        try {
            const jsonText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            verdict = JSON.parse(jsonText);
        } catch (e) {
            console.error('Failed to parse Gemini response:', response.text);
            return res.status(500).json({ error: 'Failed to generate a structured verdict.', rawResponse: response.text });
        }

        // 4. Send Response
        res.json({
            address,
            chainId,
            isToken,
            verdict,
            rawGoPlusData: riskData
        });

    } catch (error) {
        console.error('Scan Endpoint Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.listen(PORT, () => {
    console.log(`RiskScan backend running on port ${PORT}`);
});
