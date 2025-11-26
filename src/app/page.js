"use client"
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentMovieSlide, setCurrentMovieSlide] = useState(0);

  const heroSlides = [
    {
      title: "Predator: Badlands",
      format: "2D | ATMOS",
      image: "/api/placeholder/1200/600"
    }
  ];

  const movies = [
    { title: "Badlands", label: "New release", image: "https://placehold.co/350x450" },
    { title: "Predator: Badlands", duration: "1 hr 45 mins", genre: "Action", language: "English", image: "https://placehold.co/350x450" },
    { title: "Malam Terlarang", label: "New releases", image: "https://placehold.co/350x450" },
    { title: "Banduan", image: "https://placehold.co/350x450" },
    { title: "Kasuari", image: "https://placehold.co/350x450" }
  ];

  const halls = [
    { title: "INDULGE", desc: "An exclusive cinematic experience offering premium comfort, gourmet dining on the big screen.", image: "https://placehold.co/400x300", color: "from-red-900/80" },
    { title: "IMAX", desc: "Immerse yourself in the ultimate movie experience with breathtaking visuals, powerful sound.", image: "https://placehold.co/400x300", color: "from-yellow-900/80" },
    { title: "JUNIOR", desc: "A fun-filled cinema experience designed especially for kids, featuring playful seating.", image: "https://placehold.co/400x300", color: "from-blue-900/80" },
    { title: "BEANIE", desc: "Relax in cozy bean bag seating and enjoy a laid-back, comfort-first movie experience like no other.", image: "https://placehold.co/400x300", color: "from-red-900/80" },
    { title: "DOLBY ATMOS", desc: "Experience cinema with stunningly realistic sound that moves all around you for total immersion.", image: "https://placehold.co/400x300", color: "from-red-950/80" },
    { title: "3D", desc: "Step into the story with lifelike depth and stunning visuals that bring every scene closer than ever.", image: "https://placehold.co/400x300", color: "from-purple-900/80" }
  ];

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-yellow-500 font-bold text-2xl">MS CINEMAS</div>
            <div className="hidden md:flex space-x-6 text-sm">
              <a href="#" className="hover:text-yellow-500">Home</a>
              <a href="#" className="hover:text-yellow-500">Movies</a>
              <a href="#" className="hover:text-yellow-500">Food & Drinks</a>
              <a href="#" className="hover:text-yellow-500">Hall booking</a>
              <a href="#" className="hover:text-yellow-500">More</a>
            </div>
          </div>
          <button className="bg-yellow-500 text-black px-6 py-2 rounded font-semibold hover:bg-yellow-400">
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-screen">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black">
          <img src="/api/placeholder/1920/1080" alt="Hero" className="w-full h-full object-cover opacity-60" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-6 h-full flex flex-col justify-center">
          <div className="text-red-600 text-5xl font-bold mb-2" style={{letterSpacing: '0.2em'}}>PREDATOR</div>
          <div className="text-6xl font-bold mb-4" style={{letterSpacing: '0.15em'}}>BADLANDS</div>
          <div className="text-gray-400 mb-6">2D | ATMOS</div>
          <div className="flex space-x-4">
            <button className="bg-yellow-500 text-black px-6 py-3 rounded font-semibold hover:bg-yellow-400 flex items-center">
              <Play className="w-4 h-4 mr-2" fill="currentColor" />
              Watch trailer
            </button>
            <button className="bg-yellow-500 text-black px-6 py-3 rounded font-semibold hover:bg-yellow-400">
              Book now
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-yellow-500' : 'bg-gray-500'}`}
              onClick={() => setCurrentSlide(i)}
            />
          ))}
        </div>
      </div>

      {/* Now Showing Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex space-x-8">
            <button className="text-white border-b-2 border-yellow-500 pb-2">Now showing</button>
            <button className="text-gray-400 pb-2 hover:text-white">Top rated</button>
            <button className="text-gray-400 pb-2 hover:text-white">Upcoming</button>
          </div>
          <a href="#" className="text-yellow-500 flex items-center hover:text-yellow-400">
            View all
            <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </div>

        <div className="relative">
          <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
            {movies.map((movie, idx) => (
              <div key={idx} className="flex-none w-64 group cursor-pointer">
                <div className="relative rounded-lg overflow-hidden mb-3">
                  {movie.label && (
                    <div className="absolute top-3 left-3 bg-yellow-500 text-black text-xs px-3 py-1 rounded-full font-semibold z-10">
                      {movie.label}
                    </div>
                  )}
                  <img src={movie.image} alt={movie.title} className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    {movie.genre && (
                      <>
                        <div className="flex items-center text-yellow-500 text-sm mb-2">
                          <span className="mr-2">⭐</span>
                          <span>{movie.genre}</span>
                        </div>
                        <div className="text-sm text-gray-300 mb-2">⏱ {movie.duration}</div>
                        <div className="text-sm text-gray-300 mb-3">🗣 {movie.language}</div>
                        <div className="flex space-x-2">
                          <button className="flex-1 bg-transparent border border-yellow-500 text-yellow-500 py-2 rounded text-sm hover:bg-yellow-500 hover:text-black transition-colors">
                            Watch trailer
                          </button>
                          <button className="flex-1 bg-yellow-500 text-black py-2 rounded text-sm hover:bg-yellow-400 transition-colors">
                            Book now
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold">{movie.title}</h3>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6 space-x-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-yellow-500' : 'bg-gray-600'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Experience our hall Section */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8">Experience our hall</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {halls.map((hall, idx) => (
            <div key={idx} className="relative rounded-lg overflow-hidden h-64 group cursor-pointer">
              <img src={hall.image} alt={hall.title} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-t ${hall.color} to-transparent`} />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-bold mb-2">{hall.title}</h3>
                <p className="text-sm text-gray-300">{hall.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Home</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Movies</a></li>
                <li><a href="#" className="hover:text-white">Food & Drinks</a></li>
                <li><a href="#" className="hover:text-white">Hall booking</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About us</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Support</a></li>
                <li><a href="#" className="hover:text-white">Contact us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect with us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <div className="flex space-x-2">
                <a href="#" className="inline-block">
                  <img src="/api/placeholder/120/40" alt="App Store" className="h-10" />
                </a>
                <a href="#" className="inline-block">
                  <img src="/api/placeholder/120/40" alt="Google Play" className="h-10" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-wrap justify-between items-center text-sm text-gray-400">
            <div className="flex flex-wrap space-x-4 mb-4 md:mb-0">
              <a href="#" className="hover:text-white">Terms & Conditions</a>
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Disclaimer</a>
              <a href="#" className="hover:text-white">Cookie Policy</a>
              <a href="#" className="hover:text-white">FAQ</a>
            </div>
            <div>Copyright © 2025 MS Cinemas. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}