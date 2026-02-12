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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://mscinemas.com.my'),
  title: {
    default: "MScinemas | Premium Movie Experience",
    template: "%s | MScinemas",
  },
  description: "Experience the ultimate cinematic journey at MScinemas. Book movie tickets online, explore showtimes, and enjoy the latest blockbusters with premium comfort.",
  keywords: "MScinemas, Movie Tickets, Online Booking, Cinema Malaysia, Latest Movies, Movie Showtimes, Kampar Cinema, Perak Cinema",
  authors: [{ name: "MS Cinemas" }],
  creator: "MS Cinemas",
  publisher: "MS Cinemas Sdn Bhd",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/img/logo.png",
    shortcut: "/img/logo.png",
    apple: "/img/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://mscinemas.com.my',
    siteName: "MScinemas",
    title: "MScinemas | Premium Movie Experience",
    description: "Experience the ultimate cinematic journey at MScinemas. Book movie tickets online, explore showtimes, and enjoy the latest blockbusters with premium comfort.",
    images: [
      {
        url: "/img/logo.png",
        width: 1200,
        height: 630,
        alt: "MScinemas - Premium Movie Experience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MScinemas | Premium Movie Experience",
    description: "Experience the ultimate cinematic journey at MScinemas. Book movie tickets online, explore showtimes, and enjoy the latest blockbusters with premium comfort.",
    images: ["/img/logo.png"],
    creator: "@mscinemas",
    site: "@mscinemas",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "MS Cinemas",
              "url": "https://mscinemas.com.my",
              "logo": "https://mscinemas.com.my/img/logo.png",
              "description": "Experience the ultimate cinematic journey at MScinemas. Book movie tickets online, explore showtimes, and enjoy the latest blockbusters.",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "TK1 7-01, Terminal Kampar Putra",
                "addressLocality": "Kampar",
                "addressRegion": "Perak",
                "postalCode": "31900",
                "addressCountry": "MY"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "email": "admin@mscinemas.my"
              }
            })
          }}
        />
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
