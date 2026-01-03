import { Poppins } from "next/font/google";
import "./globals.css";
import MaintenanceCheck from "@/components/MaintenanceCheck";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "MS Cinemas",
  description: "MS Cinemas, Malasiya",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <MaintenanceCheck>
        {children}
        </MaintenanceCheck>
      </body>
    </html>
  );
}
