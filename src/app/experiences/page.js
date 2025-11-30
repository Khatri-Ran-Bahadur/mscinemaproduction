'use client';

import React from 'react';
import { Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

export default function ExperiencesPage() {
    const experiences = [
        {
            id: 1,
            image: "img/experiences1.jpg",
            title: "INDULGE",
            description: "Relax in luxurious comfort and let the big screen take you on a cinematic journey beyond the ordinary."
        },
        {
            id: 2,
            image: "img/experiences2.jpg",
            title: "IMAX",
            description: "Dive into a cutting-edge cinematic adventure, with crystal-clear visuals and mind-blowing sound."
        },
        {
            id: 3,
            image: "img/experiences3.jpg",
            title: "JUNIOR",
            description: "A fun, safe space designed for young movie lovers to enjoy their favorite films in ultimate comfort."
        },
        {
            id: 4,
            image: "img/experiences4.jpg",
            title: "BLANK",
            description: "Where it's just you, your movie, and an unforgettable cinema experience. Perfect for those seeking an intimate setting."
        },
        {
            id: 5,
            image: "img/experiences5.jpg",
            title: "DOLBY ATMOS",
            description: "Experience the next level of immersive sound. Dolby Atmos delivers powerful, flowing audio that moves all around you."
        },
        {
            id: 6,
            image: "img/experiences6.jpg",
            title: "3D",
            description: "Step into the action and feel the movie come to life with cutting-edge 3D technology. A truly immersive experience."
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
                            <a href="#" className="text-white hover:text-yellow-500 transition">Movies</a>
                            <a href="#" className="text-white hover:text-yellow-500 transition">Food & Drinks</a>
                            <a href="#" className="text-white hover:text-yellow-500 transition">Hall booking</a>
                            <a href="#" className="text-white hover:text-yellow-500 transition">About us</a>
                        </div>
                    </div>
                    <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
                        Sign In
                    </button>
                </div>
            </nav>

            {/* Hero Section with Title */}
            <section className="pt-32 pb-8">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold">Experiences</h1>
                        <div className="flex gap-3">
                            <button className="text-white hover:text-yellow-500 transition text-sm">
                                View All
                            </button>
                            <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition text-sm">
                                Experience
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Experiences Grid */}
            <section className="container mx-auto px-6 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {experiences.map((exp) => (
                        <div key={exp.id} className="group cursor-pointer">
                            <div className="relative h-64 rounded-xl overflow-hidden mb-4">
                                <img 
                                    src={exp.image} 
                                    alt={exp.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                                
                                {/* Content Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 className="text-2xl font-bold mb-2 text-white">{exp.title}</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">{exp.description}</p>
                                </div>
                            </div>
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
                                <li><a href="#" className="hover:text-white transition">Experiences</a></li>
                                <li><a href="#" className="hover:text-white transition">Hall booking</a></li>
                            </ul>
                        </div>

                        {/* Column 2 */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">About us</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><a href="#" className="hover:text-white transition">Support</a></li>
                                <li><a href="#" className="hover:text-white transition">Our Story</a></li>
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