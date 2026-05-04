
async function testApi() {
    const baseUrl = 'https://apiv5.mscinemas.my/api';
    const passwords = ['c!nem@$MS8118', 'c!nem@\\$MS8118'];
    
    for (const password of passwords) {
        console.log(`--- Testing Password: ${password} ---`);
        const credentials = {
            UserName: 'OnlineMSCinema',
            Password: password
        };
        
        const tokenUrl = `${baseUrl}/APIUser/GetToken`;
        try {
            const tokenRes = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            
            console.log(`Token Status: ${tokenRes.status}`);
            if (tokenRes.ok) {
                const tokenData = await tokenRes.json();
                console.log(`Token acquired: ${tokenData.token ? 'Yes' : 'No'}`);
                if (tokenData.token) {
                    console.log('--- Success! ---');
                }
            } else {
                const text = await tokenRes.text();
                console.log(`Error Body: ${text.substring(0, 200)}`);
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
}

testApi();
