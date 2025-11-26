'use client';

import React, { useState } from 'react';
import { Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

export default function MoviesPage() {
    const [activeTab, setActiveTab] = useState('now-showing');

    const movies = [
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
            title: "BADLANDS",
            genre: "Action, Thriller",
            rating: "U/A",
            languages: "English, Hindi",
            isComingSoon: false
        },
        {
            id: 2,
            image: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&q=80",
            title: "BADLANDS",
            genre: "Action, Thriller",
            rating: "U/A",
            languages: "English, Hindi",
            isComingSoon: false
        },
        {
            id: 3,
            image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80",
            title: "MALAM TERLALANG",
            genre: "Horror, Thriller",
            rating: "A",
            languages: "Indonesian",
            isComingSoon: true
        },
        {
            id: 4,
            image: "https://images.unsplash.com/photo-1574267432644-f02b82a76bb5?w=400&q=80",
            title: "BANDUAN",
            genre: "Drama, Crime",
            rating: "U/A",
            languages: "Tamil, Hindi",
            isComingSoon: false
        },
        {
            id: 5,
            image: "https://images.unsplash.com/photo-1574267432644-f02b82a76bb5?w=400&q=80",
            title: "BANDUAN",
            genre: "Drama, Crime",
            rating: "U/A",
            languages: "Tamil, Hindi",
            isComingSoon: false
        },
        {
            id: 6,
            image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80",
            title: "KANG SALAS",
            genre: "Action, Adventure",
            rating: "U/A",
            languages: "Indonesian",
            isComingSoon: true
        },
        {
            id: 7,
            image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80",
            title: "MALAM TERLALANG",
            genre: "Horror, Thriller",
            rating: "A",
            languages: "Indonesian",
            isComingSoon: false
        },
        {
            id: 8,
            image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
            title: "BADLANDS",
            genre: "Action, Thriller",
            rating: "U/A",
            languages: "English, Hindi",
            isComingSoon: false
        },
        {
            id: 9,
            image: "https://images.unsplash.com/photo-1574267432644-f02b82a76bb5?w=400&q=80",
            title: "BANDUAN",
            genre: "Drama, Crime",
            rating: "U/A",
            languages: "Tamil, Hindi",
            isComingSoon: false
        },
        {
            id: 10,
            image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80",
            title: "KANG SALAS",
            genre: "Action, Adventure",
            rating: "U/A",
            languages: "Indonesian",
            isComingSoon: false
        },
        {
            id: 11,
            image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80",
            title: "MALAM TERLALANG",
            genre: "Horror, Thriller",
            rating: "A",
            languages: "Indonesian",
            isComingSoon: false
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-sm z-50 border-b border-gray-800">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="text-2xl font-bold text-yellow-500">MS CINEMAS</div>
                        <div className="hidden md:flex gap-6 text-sm">
                            <a href="#" className="text-white hover:text-yellow-500 transition">Home</a>
                            <a href="#" className="text-yellow-500 border-b-2 border-yellow-500 pb-1">Movies</a>
                            <a href="#" className="text-white hover:text-yellow-500 transition">Food & Drinks</a>
                            <a href="#" className="text-white hover:text-yellow-500 transition">Our Screens</a>
                            <a href="#" className="text-white hover:text-yellow-500 transition">More</a>
                        </div>
                    </div>
                    <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
                        Sign In
                    </button>
                </div>
            </nav>

            {/* Header Section */}
            <section className="pt-32 pb-8">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold">Cinemas</h1>
                        <div className="flex gap-3">
                            <button className="border border-white text-white px-6 py-2 rounded-lg hover:bg-white hover:text-black transition text-sm font-semibold">
                                Movie List
                            </button>
                            <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition text-sm">
                                Experiences
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tabs Section */}
            <section className="container mx-auto px-6">
                <div className="flex gap-8 border-b border-gray-700 mb-8">
                    <button
                        onClick={() => setActiveTab('now-showing')}
                        className={`pb-4 px-2 text-sm font-medium transition relative ${
                            activeTab === 'now-showing' 
                                ? 'text-white' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Now showing
                        {activeTab === 'now-showing' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('advance-booking')}
                        className={`pb-4 px-2 text-sm font-medium transition relative ${
                            activeTab === 'advance-booking' 
                                ? 'text-white' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Advance booking
                        {activeTab === 'advance-booking' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('popular')}
                        className={`pb-4 px-2 text-sm font-medium transition relative ${
                            activeTab === 'popular' 
                                ? 'text-white' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Popular
                        {activeTab === 'popular' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                        )}
                    </button>
                </div>

                {/* Movies Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 pb-16">
                    {movies.map((movie) => (
                        <div key={movie.id} className="group cursor-pointer">
                            <div className="relative mb-3 rounded-lg overflow-hidden">
                                <img 
                                    src={movie.image} 
                                    alt={movie.title}
                                    className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition duration-300"
                                />
                                {movie.isComingSoon && (
                                    <div className="absolute top-3 left-0 bg-yellow-500 text-black px-3 py-1 text-xs font-bold">
                                        Coming Soon
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-white font-bold text-base">{movie.title}</h3>
                                <p className="text-gray-400 text-xs">{movie.genre}</p>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="border border-gray-500 text-gray-300 px-2 py-0.5 rounded">{movie.rating}</span>
                                    <span className="text-gray-400">{movie.languages}</span>
                                </div>
                            </div>
                            <button className="w-full mt-3 bg-yellow-500 text-black py-2 rounded-lg font-semibold hover:bg-yellow-400 transition text-sm">
                                Book Ticket
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black border-t border-gray-800">
                <div className="container mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Column 1 */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Home</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><a href="#" className="hover:text-white transition">Movies</a></li>
                                <li><a href="#" className="hover:text-white transition">Food & Drinks</a></li>
                                <li><a href="#" className="hover:text-white transition">Hall booking</a></li>
                            </ul>
                        </div>

                        {/* Column 2 */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">About us</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><a href="#" className="hover:text-white transition">Support</a></li>
                                <li><a href="#" className="hover:text-white transition">Contact us</a></li>
                            </ul>
                        </div>

                        {/* Column 3 */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Connect with us</h4>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-yellow-500 hover:text-black transition">
                                    <Facebook size={18} />
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-yellow-500 hover:text-black transition">
                                    <Instagram size={18} />
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-yellow-500 hover:text-black transition">
                                    <Twitter size={18} />
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-yellow-500 hover:text-black transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Column 4 - App Download */}
                        <div>
                            <div className="space-y-3">
                                <a href="#" className="block">
                                    <img 
                                        src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                                        alt="App Store" 
                                        className="h-10"
                                    />
                                </a>
                                <a href="#" className="block">
                                    <img 
                                        src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                                        alt="Google Play" 
                                        className="h-10"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="border-t border-gray-800 pt-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-xs">
                            <div className="flex gap-6">
                                <a href="#" className="hover:text-white transition">Terms & Conditions</a>
                                <a href="#" className="hover:text-white transition">Privacy Policy</a>
                                <a href="#" className="hover:text-white transition">Disclaimer</a>
                                <a href="#" className="hover:text-white transition">Cookie Policy</a>
                                <a href="#" className="hover:text-white transition">FAQ</a>
                            </div>
                            <p>Copyright © 2025 MS Cinemas. All rights reserved</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}