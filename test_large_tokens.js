const axios = require('axios');

const addresses = [
    { name: 'PEPE (Eth)', address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', chainId: '1' },
    { name: 'SHIB (Eth)', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', chainId: '1' },
    { name: 'UNI (Eth)', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', chainId: '1' }
];

async function runTests() {
    console.log('Testing Large Established Tokens...');
    
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
