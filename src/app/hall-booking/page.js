'use client';

import React, { useState } from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';

export default function BookHallPage() {
    const [activeTab, setActiveTab] = useState('All');

    const halls = [
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
            title: "Book a Hall",
            subtitle: "Everything that you want under one theatre"
        },
        {
            id: 2,
            image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&q=80",
            title: "Book a Hall",
            subtitle: "Everything that you want under one theatre"
        },
        {
            id: 3,
            image: "https://images.unsplash.com/photo-1568876694728-451bbf694b83?w=800&q=80",
            title: "Book a Hall",
            subtitle: "Everything that you want under one theatre"
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
                            <a href="#" className="text-yellow-500 border-b-2 border-yellow-500 pb-1">Book a Hall</a>
                            <a href="#" className="text-white hover:text-yellow-500 transition">Our Screens</a>
                            <a href="#" className="text-white hover:text-yellow-500 transition">More</a>
                        </div>
                    </div>
                    <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
                        Sign In
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative h-[60vh] overflow-hidden pt-16">
                <div className="absolute inset-0">
                    <img 
                        src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80" 
                        alt="Cinema Hall" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
                </div>

                <div className="relative container mx-auto px-6 h-full flex flex-col justify-center z-10">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 max-w-xl">Book a hall</h1>
                    <p className="text-gray-300 text-lg mb-8 max-w-lg">
                        Host your preferred hall and create the perfect setting for an unforgettable cinema experience
                    </p>
                    <button className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition w-fit">
                        Book Now
                    </button>
                </div>
            </section>

            {/* Tabs Section */}
            <section className="container mx-auto px-6 py-12">
                <div className="flex gap-8 border-b border-gray-800 mb-8">
                    {['All', 'Celebrations', 'Weddings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-2 text-sm font-medium transition relative ${
                                activeTab === tab 
                                    ? 'text-white' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Hall Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {halls.map((hall) => (
                        <div key={hall.id} className="group cursor-pointer">
                            <div className="relative h-64 rounded-xl overflow-hidden mb-4">
                                <img 
                                    src={hall.image} 
                                    alt={hall.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{hall.title}</h3>
                            <p className="text-gray-400 text-sm">{hall.subtitle}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black border-t border-gray-800 mt-20">
                <div className="container mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Column 1 */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Home</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><a href="#" className="hover:text-white transition">About us</a></li>
                                <li><a href="#" className="hover:text-white transition">Food & Drinks</a></li>
                                <li><a href="#" className="hover:text-white transition">Hall Booking</a></li>
                            </ul>
                        </div>

                        {/* Column 2 */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">About us</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
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
                                    <Youtube size={18} />
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