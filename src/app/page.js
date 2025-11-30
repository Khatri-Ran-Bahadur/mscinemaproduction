'use client';

import React, { useState } from 'react';
import { Play, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Header from '@/components/header';

export default function MovieStreamingSite() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroMovies = [
    {
      title: "BADLANDS",
      subtitle: "Predator Badlands - Now Streaming",
      image: "img/banner1.jpg"
    }
  ];

  const featuredMovies = [
    { title: "The Dark Knight", image: "img/movies1.png", rating: "9.0" },
    { title: "Inception", image: "img/movies2.png", rating: "8.8" },
    { title: "Interstellar", image: "img/movies3.png", rating: "8.6" },
    { title: "The Matrix", image: "img/movies4.png", rating: "8.7" },
    // { title: "Gladiator", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&q=80", rating: "8.5" },
    // { title: "The Prestige", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&q=80", rating: "8.5" },
    // { title: "Fight Club", image: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=500&q=80", rating: "8.8" },
    // { title: "Pulp Fiction", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80", rating: "8.9" }
  ];

  const newReleases = [
    { title: "Mission Impossible", year: "2024", image: "img/promotions1.jpg" },
    { title: "Fast X", year: "2024", image: "img/promotions2.jpg" },
    { title: "Guardians", year: "2024", image: "img/promotions3.jpg" },
    { title: "The Flash", year: "2024", image: "img/promotions2.jpg" },
    { title: "Aquaman 2", year: "2024", image: "img/promotions1.jpg" },
    { title: "Shazam 2", year: "2024", image: "img/promotions3.jpg" },
    // { title: "Deadpool 3", year: "2024", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&q=80" },
    // { title: "Blade", year: "2024", image: "https://images.unsplash.com/photo-1515634928627-2a4e0dae3ddf?w=500&q=80" }
  ];

  const tamilMovies = [
    { title: "Vikram", image: "img/our_hall.jpg" },
    { title: "Ponniyin Selvan", image: "img/our_hall2.jpg" },
    { title: "Varisu", image: "img/our_hall3.jpg" },
    { title: "Jailer", image: "img/our_hall4.jpg" },
    { title: "Leo", image: "img/our_hall5.jpg" },
    { title: "Maaveeran", image: "img/our_hall6.jpg" },
    { title: "Mark Antony", image: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=500&q=80" },
    { title: "Captain Miller", image: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=500&q=80" }
  ];

  const teluguMovies = [
    { title: "RRR", image: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=500&q=80" },
    { title: "Pushpa", image: "https://images.unsplash.com/photo-1515634928627-2a4e0dae3ddf?w=500&q=80" },
    { title: "Salaar", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&q=80" },
    { title: "HanuMan", image: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=500&q=80" },
    { title: "Baahubali", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80" },
    { title: "Eega", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&q=80" },
    { title: "Ala Vaikunthapurramuloo", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80" },
    { title: "Arjun Reddy", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&q=80" }
  ];

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Header */}
      <Header />
      {/* Hero Section */}
      <div className="relative h-screen">
        <div className="absolute inset-0">
          <img 
            src={heroMovies[currentSlide].image}
            alt={heroMovies[currentSlide].title}
            className="w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative h-full flex items-center px-8 md:px-16">
          <div className="max-w-3xl">
            <div className="mb-8">
              <h2 className="text-7xl md:text-8xl font-bold tracking-wider mb-4" style={{letterSpacing: '0.2em'}}>
                BADLANDS
              </h2>
            </div>
            <h3 className="text-4xl md:text-5xl font-light mb-6">Predator: Badlands</h3>
            <div className="flex items-center space-x-4 mb-8 text-sm text-gray-300">
              <span className="border border-gray-400 px-3 py-1 rounded">2D</span>
              <span>|</span>
              <span>ATMOS</span>
            </div>
            <div className="flex space-x-4">
              <button className="bg-yellow-400 text-black px-8 py-3 rounded font-semibold hover:bg-yellow-500 transition text-sm uppercase tracking-wide">
                Watch Trailer
              </button>
              <button className="bg-yellow-400 text-black px-8 py-3 rounded font-semibold hover:bg-yellow-500 transition text-sm uppercase tracking-wide">
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Movies */}
      <div className="px-8 md:px-16 py-12">
        <h3 className="text-2xl font-bold mb-6">Featured Movies</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {featuredMovies.slice(0, 8).map((movie, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-3">
                <img 
                  src={movie.image}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end justify-center pb-4">
                  <button className="bg-yellow-400 text-black p-3 rounded-full">
                    <Play size={20} fill="currentColor" />
                  </button>
                </div>
                <div className="absolute top-3 right-3 bg-black/80 px-2 py-1 rounded flex items-center space-x-1">
                  <Star size={14} fill="#FCD34D" className="text-yellow-400" />
                  <span className="text-sm">{movie.rating}</span>
                </div>
              </div>
              <h4 className="font-semibold">{movie.title}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* New Releases */}
      <div className="px-8 md:px-16 py-12 bg-zinc-900/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">New Releases</h3>
          <div className="flex space-x-2">
            <button className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition">
              <ChevronLeft size={20} />
            </button>
            <button className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {newReleases.slice(0, 8).map((movie, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-3">
                <img 
                  src={movie.image}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end justify-center pb-4">
                  <button className="bg-yellow-400 text-black p-3 rounded-full">
                    <Play size={20} fill="currentColor" />
                  </button>
                </div>
                <div className="absolute top-3 left-3 bg-red-600 px-3 py-1 rounded text-xs font-bold">
                  NEW
                </div>
              </div>
              <h4 className="font-semibold">{movie.title}</h4>
              <p className="text-sm text-gray-400">{movie.year}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tamil Movies */}
      <div className="px-8 md:px-16 py-12">
        <h3 className="text-2xl font-bold mb-6">Popular Tamil Movies</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {tamilMovies.slice(0, 8).map((movie, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-3">
                <img 
                  src={movie.image}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end justify-center pb-4">
                  <button className="bg-yellow-400 text-black p-3 rounded-full">
                    <Play size={20} fill="currentColor" />
                  </button>
                </div>
              </div>
              <h4 className="font-semibold">{movie.title}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* Telugu Movies */}
      {/* <div className="px-8 md:px-16 py-12 bg-zinc-900/50">
        <h3 className="text-2xl font-bold mb-6">Popular Telugu Movies</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {teluguMovies.slice(0, 8).map((movie, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-3">
                <img 
                  src={movie.image}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end justify-center pb-4">
                  <button className="bg-yellow-400 text-black p-3 rounded-full">
                    <Play size={20} fill="currentColor" />
                  </button>
                </div>
              </div>
              <h4 className="font-semibold">{movie.title}</h4>
            </div>
          ))}
        </div>
      </div> */}

      {/* Footer */}
      <footer className="px-8 md:px-16 py-12 border-t border-zinc-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                <span className="text-xs">f</span>
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                <span className="text-xs">t</span>
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                <span className="text-xs">i</span>
              </a>
            </div>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2024 BADLANDS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}