'use client';

import React from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

export default function AboutUsPage() {
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
                            <a href="#" className="text-yellow-500 border-b-2 border-yellow-500 pb-1">About us</a>
                        </div>
                    </div>
                    <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
                        Sign In
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative h-[50vh] overflow-hidden pt-16">
                <div className="absolute inset-0">
                    <img 
                        src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80" 
                        alt="Cinema Hall" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60"></div>
                </div>

                <div className="relative container mx-auto px-6 h-full flex flex-col justify-center z-10">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">About us</h1>
                    <p className="text-gray-300 text-lg mb-8 max-w-lg">
                        Book your preferred experience and stay connected with us
                    </p>
                    <button className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition w-fit">
                        Contact Now
                    </button>
                </div>
            </section>

            {/* About MS Cinemas Section */}
            <section className="container mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold mb-8">About MS Cinemas</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Image */}
                    <div className="rounded-xl overflow-hidden">
                        <img 
                            src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80" 
                            alt="Cinema Interior" 
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Text Content */}
                    <div className="text-gray-300 space-y-4 leading-relaxed">
                        <p>
                            Welcome to MS Cinemas, a place where cinema meets comfort in the most spectacular way. Established with the vision to redefine the movie-watching experience, we are committed to bringing you world-class entertainment wrapped in luxury and innovation.
                        </p>
                        <p>
                            At MS Cinemas, we believe that going to the movies is more than just watching a film—it's an experience to be cherished. Our state-of-the-art screens, cutting-edge sound systems, and plush seating are designed to transport you into the heart of every story. Whether you're catching the latest blockbuster, an indie gem, or a timeless classic, we ensure that every visit is memorable.
                        </p>
                        <p>
                            Beyond movies, we offer a range of services like hall bookings for celebrations, corporate events, and more. Paired with our gourmet food and beverage options, MS Cinemas provides a complete entertainment experience, ensuring that your time with us is nothing short of extraordinary.
                        </p>
                        <p>
                            Join us as we continue to set new benchmarks in entertainment. At MS Cinemas, every seat is the best seat, and every screening is a grand event.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Cards Section */}
            <section className="container mx-auto px-6 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Contact Number Card */}
                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
                            <Phone size={24} className="text-black" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-black">Contact number</h3>
                        <p className="text-black/80">+91-XXX-XXX-XXXX</p>
                    </div>

                    {/* Email Card */}
                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
                            <Mail size={24} className="text-black" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-black">Email</h3>
                        <p className="text-black/80">mscinemas@example.com</p>
                    </div>

                    {/* Location Card */}
                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
                            <MapPin size={24} className="text-black" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-black">Location</h3>
                        <p className="text-black/80">No:10, Sample Street, PO Box 16122, 
                        CD Road, 2XXX, Ernakulam / Near Perumbavoor, Kochi-Kerala</p>
                    </div>
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