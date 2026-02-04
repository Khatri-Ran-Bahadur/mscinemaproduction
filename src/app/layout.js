import { Poppins } from "next/font/google";
import "./globals.css";
import MaintenanceCheck from "@/components/MaintenanceCheck";
import RecaptchaProvider from "@/components/RecaptchaProvider";


const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: {
    default: "MScinemas | Premium Movie Experience",
    template: "%s | MScinemas",
  },
  description: "Experience the ultimate cinematic journey at MScinemas. Book movie tickets online, explore showtimes, and enjoy the latest blockbusters with premium comfort.",
  keywords: "MScinemas, Movie Tickets, Online Booking, Cinema Malaysia, Latest Movies, Movie Showtimes",
  icons: {
    icon: "/img/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <MaintenanceCheck>
          <RecaptchaProvider>
            {children}
          </RecaptchaProvider>
        </MaintenanceCheck>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if ('${process.env.NEXT_PUBLIC_DISABLE_INSPECT}' === 'true') {
                  
                  // Disable right-click
                  document.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                  });

                  // Disable keyboard shortcuts for dev tools
                  document.addEventListener('keydown', function(e) {
                    // F12
                    if (e.key === 'F12' || e.keyCode === 123) {
                      e.preventDefault();
                      return false;
                    }
                    
                    // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element Inspector)
                    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
                      e.preventDefault();
                      return false;
                    }

                    // Ctrl+U (View Source)
                    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
                      e.preventDefault();
                      return false;
                    }
                  });
                  
                  // Console warning
                  console.log('%cWait!', 'color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0px black;');
                  console.log('%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or "hack" someone\\'s account, it is a scam and will give them access to your account.', 'font-size: 20px;');
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
