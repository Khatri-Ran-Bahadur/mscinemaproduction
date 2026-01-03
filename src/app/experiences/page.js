"use client";

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function ExperiencesPage() {
    const experiences = [
        {
            id: 1,
            image: "img/experiences1.jpg",
            title: "INDULGE",
            description: "An exclusive cinematic experience offering premium comfort, gourmet dining on the big screen."
        },
        {
            id: 2,
            image: "img/experiences2.jpg",
            title: "IMAX",
            description: "Immerse yourself in the ultimate movie experience with breathtaking visuals, powerful sound."
        },
        {
            id: 3,
            image: "img/experiences3.jpg",
            title: "JUNIOR",
            description: "A fun-filled cinema experience designed especially for kids, featuring playful seating."
        },
        {
            id: 4,
            image: "img/experiences4.jpg",
            title: "BEANIE",
            description: "Relax in cozy bean bag seating and enjoy a laid-back, comfort-first movie experience like no other."
        },
        {
            id: 5,
            image: "img/experiences5.jpg",
            title: "DOLBY ATMOS",
            description: "Experience cinema with stunningly realistic sound that moves all around you for total immersion."
        },
        {
            id: 6,
            image: "img/experiences6.jpg",
            title: "3D",
            description: "Step into the story with lifelike depth and stunning visuals that bring every scene closer than ever."
        }
    ];

    return (
        <div className="min-h-screen bg-black text-[#FAFAFA]">
            <Header />
            
            {/* Main Content */}
            <div className="pt-24 pb-16">
                <div className="container mx-auto px-6">
                    {/* Experiences Section Header */}
                    <div className="flex items-center justify-between mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-[#FFCA20]">Experiences</h1>
                        <div className="flex gap-3">
                            <button className="bg-[#2a2a2a] text-[#FAFAFA] px-6 py-2 rounded-lg font-semibold hover:bg-[#3a3a3a] transition text-sm">
                                Near me
                            </button>
                            <button className="bg-[#FFCA20] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#FFCA20]/90 transition text-sm">
                                Experiences
                            </button>
                        </div>
                    </div>

            {/* Experiences Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {experiences.map((exp) => (
                        <div key={exp.id} className="group cursor-pointer">
                                <div className="relative h-80 rounded-xl overflow-hidden mb-4">
                                <img 
                                    src={exp.image} 
                                    alt={exp.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                        onError={(e) => { e.target.src = 'img/movies1.png'; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                                
                                {/* Content Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                        <h3 className="text-2xl md:text-3xl font-bold mb-3 text-[#FAFAFA]">{exp.title}</h3>
                                        <p className="text-[#D3D3D3] text-sm leading-relaxed">{exp.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
