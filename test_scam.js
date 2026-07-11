const axios = require('axios');

async function runTests() {
    console.log('Testing SQUID Token on BSC...');
    try {
        const res = await axios.post('http://localhost:3000/scan', {
            address: '0x87230146e138d3f296a9a77e497a2a83012e9bc5',
            chainId: '56'
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

runTests();
