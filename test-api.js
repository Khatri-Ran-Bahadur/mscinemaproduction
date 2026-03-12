const { home } = require('./src/services/api');
const baseUrl = 'http://localhost:3000'; // or whatever it uses internally

async function run() {
    try {
        const banners = await home.getBanners();
        console.log("Banners:", JSON.stringify(banners, null, 2));
    } catch(e) {
        console.error(e);
    }
}
run();
