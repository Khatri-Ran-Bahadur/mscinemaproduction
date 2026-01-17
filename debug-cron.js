
// Native fetch used


// Hardcoded for testing script
const API_BASE_URL = 'http://cinemaapi5.ddns.net/api'; 

async function check() {
  console.log('Fetching Half Way Bookings...');
  try {
    // Using the same parameters as the cron job: m1=2, m2=50
    const res = await fetch(`${API_BASE_URL}/Booking/GetHalfWayBookings/2/50`);
    if (!res.ok) {
        console.error('API Error:', res.status, res.statusText);
        return;
    }
    const bookings = await res.json();
    console.log(`Found ${bookings.length} bookings.`);
    
    // Log details of all Status 1 bookings
    const confirmed = bookings.filter(b => b.status === 1);
    console.log(`Found ${confirmed.length} bookings with Status 1 (Confirmed Locked).`);
    
    confirmed.forEach(b => {
        console.log('--- Booking ---');
        console.log(`Ref: ${b.referenceNo}`);
        console.log(`Date: ${b.bookingDateTime}`);
        console.log(`Status: ${b.status}`);
        
        // Check time logic
         if (b.bookingDateTime) {
             const [datePart, timePart] = b.bookingDateTime.split(' ');
             if (datePart && timePart) {
                 const [d, m, y] = datePart.split('-');
                 const bookingTime = new Date(`${y}-${m}-${d}T${timePart}+08:00`);
                 const now = new Date();
                 const diffMinutes = (now - bookingTime) / (1000 * 60);
                 console.log(`Age: ${diffMinutes.toFixed(2)} minutes`);
                 console.log(`Should Release (>10): ${diffMinutes > 10}`);
             }
         }
    });

  } catch (e) {
    console.error('Error:', e);
  }
}

check();
