"use client";

import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function AboutUsPage() {
    return (
        <div className="min-h-screen bg-black text-[#FAFAFA]">
            <Header />

            {/* Hero Section */}
            <section className="relative h-[70vh] sm:h-[65vh] md:h-[75vh] overflow-hidden pt-16 sm:pt-20 md:pt-24">
                <div className="absolute inset-0">
                    <img 
                        src="img/about-banner.jpg" 
                        alt="About MS Cinemas" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'img/banner1.jpg'; }}
                    />
                    {/* Bottom Gradient Overlay - Desktop: from bottom */}
                    <div 
                        className="absolute inset-0 hidden md:block"
                        style={{
                            background: 'linear-gradient(180deg, rgba(34, 34, 34, 0) 42.53%, rgba(34, 34, 34, 0.5) 71.27%, #222222 100%)'
                        }}
                    />
                    {/* Top Gradient Overlay - Mobile: from top */}
                    <div 
                        className="absolute inset-0 md:hidden"
                        style={{
                            background: 'linear-gradient(180deg, rgba(17, 17, 17, 0) 46.79%, rgba(17, 17, 17, 0.5) 68.08%, #111111 94.68%)'
                        }}
                    />
                    {/* Bottom Gradient Overlay - Mobile: from bottom */}
                    <div 
                        className="absolute inset-0 md:hidden"
                        style={{
                            background: 'linear-gradient(180deg, rgba(17, 17, 17, 0) 46.79%, rgba(17, 17, 17, 0.5) 68.08%, #111111 94.68%)'
                        }}
                    />
                </div>

                {/* MS CINEMAS Logo on Screen */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-[#FFCA20] text-6xl md:text-8xl font-bold opacity-30">
                        MS CINEMAS
                    </div>
                </div>

                <div className="relative container mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-6 sm:pb-8 md:pb-12 z-20">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 text-[#FAFAFA]">About us</h1>
                    <p className="text-[#D3D3D3] text-lg md:text-xl mb-8 max-w-2xl">
                        Book your preferred experience and stay connected with us
                    </p>
                    <button className="bg-[#FFCA20] text-black px-8 py-3 rounded-lg font-semibold hover:bg-[#FFCA20]/90 transition w-fit">
                        Contact now
                    </button>
                </div>
            </section>

            {/* Main Section with Gradient Background */}
            <section 
                style={{
                    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 30%, #2a2a2a 50%, rgba(103, 80, 2, 0.7) 70%, rgba(103, 80, 2, 0.6) 100%)'
                }}
            >
                {/* About MS Cinemas Section */}
                <div className="py-16">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Image */}
                            <div className="rounded-xl overflow-hidden">
                                <img 
                                    src="img/about-mid-section.jpg" 
                                    alt="Cinema Interior" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = 'img/hall_booking2.jpg'; }}
                                />
                            </div>

                            {/* Text Content */}
                            <div className="space-y-6">
                                <h2 className="text-3xl md:text-4xl font-bold text-[#FAFAFA]">About MS Cinemas</h2>
                                <div className="space-y-4 text-[#FAFAFA] leading-relaxed">
                                    <p>
                                        Located in the heart of Kampar, Perak, MS Cinemas is the ultimate destination for movie lovers seeking a complete and immersive cinematic experience. Featuring 8 state-of-the-art screens, our cinema offers the perfect blend of comfort, technology, and entertainment. Whether you're catching the latest Hollywood blockbuster, a heartwarming local film, or an international release, MS Cinemas provides crystal-clear visuals, powerful surround sound, and cozy seating to ensure every visit is memorable.
                                    </p>
                                    <p>
                                        At MS Cinemas, we believe that watching a movie is more than just seeing a film - it's about creating moments, sharing emotions, and enjoying the magic of cinema together.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information Section */}
                <div className="py-16">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Contact Number Card */}
                            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
                                <div className="w-12 h-12 bg-[#FFCA20] rounded-full flex items-center justify-center mb-4">
                                    <Phone size={24} className="text-black" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-[#FAFAFA]">Contact number</h3>
                                <p className="text-[#D3D3D3]">+60 5467 0962</p>
                            </div>

                            {/* Email Card */}
                            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
                                <div className="w-12 h-12 bg-[#FFCA20] rounded-full flex items-center justify-center mb-4">
                                    <Mail size={24} className="text-black" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-[#FAFAFA]">Email</h3>
                                <p className="text-[#D3D3D3]">msckampar@mscinemas.my</p>
                            </div>

                            {/* Location Card */}
                            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
                                <div className="w-12 h-12 bg-[#FFCA20] rounded-full flex items-center justify-center mb-4">
                                    <MapPin size={24} className="text-black" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-[#FAFAFA]">Location</h3>
                                <p className="text-[#D3D3D3] text-sm leading-relaxed">
                                    TK1701, Terminal Kampar Putra, PT53493 & PT53494, Jalan Putra Permata 9, Taman Kampar, 31900 Kampar, Perak Malaysia
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
