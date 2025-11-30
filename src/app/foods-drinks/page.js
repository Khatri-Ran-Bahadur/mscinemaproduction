'use client';

import React, { useState } from 'react';
import { Facebook, Instagram, Youtube, Twitter } from 'lucide-react';
import Header from '@/components/header';

export default function FoodDrinksPage() {
    const [activeTab, setActiveTab] = useState('best-sellers');

    const foodItems = [
        {
            id: 1,
            image: "img/foods1.jpg",
            title: "Mini Popcorn with Coke",
            price: "₹180/-"
        },
        {
            id: 2,
            image: "img/foods2.jpg",
            title: "Large popcorn with Cheese Dip with Coke",
            price: "₹250/-"
        },
        {
            id: 3,
            image: "img/foods3.jpg",
            title: "Large Coke(single) with Cheese Nachos",
            price: "₹200/-"
        },
        {
            id: 4,
            image: "img/foods4.jpg",
            title: "Mini Coke(2) combo with Fries",
            price: "₹160/-"
        },
        {
            id: 5,
            image: "img/foods5.jpg",
            title: "Mid Regular popcorn with Coke",
            price: "₹200/-"
        },
        {
            id: 6,
            image: "img/foods6.png",
            title: "Large popcorn with Cheese Dip with Coke",
            price: "₹250/-"
        },
        {
            id: 7,
            image: "img/foods7.jpg",
            title: "Mid Regular popcorn with Coke",
            price: "₹200/-"
        }
    ];

    return (
        <div className="min-h-screen bg-neutral-900 text-white">
            <Header/>

            {/* Hero Section */}
            <section className="relative h-[50vh] overflow-hidden pt-16">
                <div className="absolute inset-0">
                    <img 
                        src="img/food.jpg" 
                        alt="Food & Drinks" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
                </div>

                <div className="relative container mx-auto px-6 h-full flex flex-col justify-center z-10">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">Grab Your Snacks</h1>
                    <p className="text-gray-300 text-lg mb-8 max-w-lg">
                        Get your favorite snacks and drinks to enjoy with your movie for a complete cinema experience.
                    </p>
                    <button className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition w-fit">
                        Order Now
                    </button>
                </div>
            </section>

            {/* Tabs Section */}
            <section className="container mx-auto px-6 py-12">
                <div className="flex gap-8 border-b border-gray-700 mb-8">
                    <button
                        onClick={() => setActiveTab('best-sellers')}
                        className={`pb-4 px-2 text-sm font-medium transition relative ${
                            activeTab === 'best-sellers' 
                                ? 'text-white' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Best sellers
                        {activeTab === 'best-sellers' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('popcorn-combos')}
                        className={`pb-4 px-2 text-sm font-medium transition relative ${
                            activeTab === 'popcorn-combos' 
                                ? 'text-white' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Popcorn combos
                        {activeTab === 'popcorn-combos' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('hot-eats-combos')}
                        className={`pb-4 px-2 text-sm font-medium transition relative ${
                            activeTab === 'hot-eats-combos' 
                                ? 'text-white' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Hot eats combos
                        {activeTab === 'hot-eats-combos' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                        )}
                    </button>
                </div>

                {/* Food Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {foodItems.map((item) => (
                        <div key={item.id} className="group cursor-pointer">
                            <div className="relative bg-white rounded-xl overflow-hidden mb-4 aspect-square">
                                <img 
                                    src={item.image} 
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                />
                            </div>
                            <div className="bg-yellow-600 rounded-lg p-4">
                                <h3 className="text-white text-sm font-medium mb-2 min-h-[40px]">{item.title}</h3>
                                <p className="text-white font-bold text-lg">{item.price}</p>
                            </div>
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