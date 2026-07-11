const axios = require('axios');

const addresses = [
    // Tokens
    { name: 'USDT (Eth)', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', chainId: '1' },
    { name: 'USDC (Eth)', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chainId: '1' },
    { name: 'SHIB (Eth)', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', chainId: '1' },
    { name: 'PEPE (Eth)', address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', chainId: '1' },
    { name: 'Random Token 1', address: '0x408Ba1092a013Cb2aDF27A7951B422A530a5EBb0', chainId: '1' },
    
    // Wallets / Other
    { name: 'Vitalik Wallet', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', chainId: '1' },
    { name: 'Binance Hot Wallet', address: '0x28C6c06298d514Db089934071355E22Af164F5CE', chainId: '1' },
    { name: 'Random Wallet 1', address: '0x1234567890123456789012345678901234567890', chainId: '1' },
    { name: 'Random Contract', address: '0x0000000000000000000000000000000000000000', chainId: '1' },
    { name: 'Fake Scam Token (Mock)', address: '0x9999999999999999999999999999999999999999', chainId: '1' }
];

async function runTests() {
    console.log('Starting Phase 1 Tests...');
    
    for (const item of addresses) {
        console.log(`\nTesting: ${item.name} (${item.address})`);
        try {
            const res = await axios.post('http://localhost:3000/scan', {
                address: item.address,
                chainId: item.chainId
            });
            
            const verdict = res.data.verdict;
            console.log(`- Type: ${res.data.isToken ? 'Token' : 'Wallet'}`);
            console.log(`- Risk Score: ${verdict.riskScore}`);
            console.log(`- Explanation: ${verdict.explanation}`);
            console.log(`- Recommendation: ${verdict.recommendation}`);
        } catch (error) {
            console.error(`- Error: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
        }
    }
}

runTests();
