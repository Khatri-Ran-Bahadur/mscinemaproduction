
async function testMoviesProxy() {
    // 1. Get Token
    const tokenRes = await fetch('http://localhost:3000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const { token } = await tokenRes.json();
    console.log(`Token acquired: ${token ? 'Yes' : 'No'}`);

    if (!token) return;

    // 2. Call Proxy for GetMovies
    const endpoint = '/MovieDetails/GetMovies';
    const proxyUrl = `http://localhost:3000/api/proxy?endpoint=${encodeURIComponent(endpoint)}`;
    console.log(`Calling proxy: ${proxyUrl}`);
    
    try {
        const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log(`Movies count: ${Array.isArray(data) ? data.length : 'Not an array'}`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testMoviesProxy();
