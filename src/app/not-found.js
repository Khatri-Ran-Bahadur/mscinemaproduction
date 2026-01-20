import Link from 'next/link';
import { Home, AlertCircle } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-[#FAFAFA] flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-lg mx-auto">
          {/* 404 Number */}
          <h1 className="text-9xl font-bold text-[#FFCA20] mb-4 opacity-90 drop-shadow-[0_0_15px_rgba(255,202,32,0.3)]">
            404
          </h1>
          
          {/* Message */}
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#FAFAFA]">
            Page Not Found
          </h2>
          
          <p className="text-[#D3D3D3] mb-8 text-lg leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          {/* Action Button */}
          <div className="flex justify-center">
            <Link 
              href="/" 
              className="group flex items-center gap-2 bg-[#FFCA20] text-black px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#FFCA20]/90 transition-all shadow-[0_0_20px_rgba(255,202,32,0.3)] hover:shadow-[0_0_30px_rgba(255,202,32,0.5)] transform hover:-translate-y-1"
            >
              <Home size={20} className="group-hover:scale-110 transition-transform" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
