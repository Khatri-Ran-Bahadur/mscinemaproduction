
async function testTokenProxy() {
    const url = 'http://localhost:3000/api/auth/token';
    console.log(`Requesting token from: ${url}`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testTokenProxy();
