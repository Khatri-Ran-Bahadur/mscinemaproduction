"use client";

import React, { useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function FoodDrinksPage() {
    const [activeTab, setActiveTab] = useState('best-sellers');
    const [selectedItem, setSelectedItem] = useState(null);

    const foodItems = [
        {
            id: 1,
            image: "img/foods1.jpg",
            title: "MS Large popcorn with Soft Drink",
            price: "RM 12.00",
            tag: null
        },
        {
            id: 2,
            image: "img/foods2.jpg",
            title: "Large nachos with Cheese Dip and Soft Drink",
            price: "RM 15.00",
            tag: "NEW"
        },
        {
            id: 3,
            image: "img/foods3.jpg",
            title: "Spicy Chicken Wings with Soft Drink",
            price: "RM 18.00",
            tag: null
        },
        {
            id: 4,
            image: "img/foods4.jpg",
            title: "Spicy Chicken Wings with Latte",
            price: "RM 10.00",
            tag: null
        },
        {
            id: 5,
            image: "img/foods5.jpg",
            title: "MS Regular popcorn with Latte",
            price: "RM 20.00",
            tag: null
        },
        {
            id: 6,
            image: "img/foods6.png",
            title: "Large nachos with Cheese Dip and Soft Drink",
            price: "RM 10.00",
            tag: null
        },
        {
            id: 7,
            image: "img/foods7.jpg",
            title: "MS Regular popcorn with Soft Drink",
            price: "RM 8.00",
            tag: null
        }
    ];

    return (
        <div className="min-h-screen bg-black text-[#FAFAFA]">
            <Header />

            {/* Hero Section */}
            <section className="relative h-[70vh] sm:h-[65vh] md:h-[75vh] overflow-hidden pt-16 sm:pt-20 md:pt-24">
                <div className="absolute inset-0">
                    {/* Mobile Image */}
                    <img 
                        src="img/foodanddriksmobie.jpg" 
                        alt="Food & Drinks" 
                        className="w-full h-full object-cover object-center md:hidden"
                        onError={(e) => { e.target.src = 'img/food.jpg'; }}
                    />
                    {/* Desktop Image */}
                    <img 
                        src="img/foodanddrinksdesktop.jpg" 
                        alt="Food & Drinks" 
                        className="hidden md:block w-full h-full object-cover object-center"
                        onError={(e) => { e.target.src = 'img/food.jpg'; }}
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

                <div className="relative container mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-6 sm:pb-8 md:pb-12 z-10">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 text-[#FAFAFA]">Grab Your Snacks</h1>
                    <p className="text-[#D3D3D3] text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 md:mb-8 max-w-2xl">
                        Add your favorite snacks and drinks to enjoy with your movie for a seamless cinema experience.
                    </p>
                    <button className="bg-[#FFCA20] text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-[#FFCA20]/90 transition w-fit">
                        Order now
                    </button>
                    {/* Background Text */}
                    <div className="absolute bottom-10 sm:bottom-16 md:bottom-20 right-4 sm:right-10 md:right-20 text-[#FFCA20]/10 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold hidden lg:block">
                        SIGNATURE ROYALE
                    </div>
                </div>
            </section>

            {/* Tabs Section */}
            <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex gap-4 sm:gap-6 md:gap-8 border-b border-[#3a3a3a] mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('best-sellers')}
                        className={`pb-3 sm:pb-4 px-2 text-xs sm:text-sm font-medium transition relative whitespace-nowrap flex-shrink-0 ${
                            activeTab === 'best-sellers' 
                                ? 'text-[#FFCA20]' 
                                : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                        }`}
                    >
                        Best sellers
                        {activeTab === 'best-sellers' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('popcorn-combo')}
                        className={`pb-3 sm:pb-4 px-2 text-xs sm:text-sm font-medium transition relative whitespace-nowrap flex-shrink-0 ${
                            activeTab === 'popcorn-combo' 
                                ? 'text-[#FFCA20]' 
                                : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                        }`}
                    >
                        Popcorn combo
                        {activeTab === 'popcorn-combo' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('hot-bites-combo')}
                        className={`pb-3 sm:pb-4 px-2 text-xs sm:text-sm font-medium transition relative whitespace-nowrap flex-shrink-0 ${
                            activeTab === 'hot-bites-combo' 
                                ? 'text-[#FFCA20]' 
                                : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                        }`}
                    >
                        Hot bites combo
                        {activeTab === 'hot-bites-combo' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                        )}
                    </button>
                </div>

                {/* Food Items Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                    {foodItems.map((item) => (
                        <div 
                            key={item.id} 
                            className={`group cursor-pointer ${selectedItem === item.id ? 'ring-2 ring-[#FFCA20] rounded-lg' : ''}`}
                            onClick={() => setSelectedItem(item.id)}
                        >
                            <div className="relative bg-white rounded-t-xl overflow-hidden aspect-square">
                                <img 
                                    src={item.image} 
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                    onError={(e) => { e.target.src = 'img/movies1.png'; }}
                                />
                                {item.tag && (
                                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-[#FFCA20] text-black px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded">
                                        {item.tag}
                                    </div>
                                )}
                            </div>
                            <div 
                                className="rounded-b-xl p-2 sm:p-3 md:p-4"
                                style={{
                                    background: 'linear-gradient(292.49deg, rgba(17, 17, 17, 0) -13.98%, rgba(83, 65, 12, 0.5) 15.02%, #947206 80.6%)'
                                }}
                            >
                                <h3 className="text-white text-[10px] sm:text-xs md:text-sm font-medium mb-1 sm:mb-2 min-h-[32px] sm:min-h-[36px] md:min-h-[40px] leading-tight">{item.title}</h3>
                                <p className="text-[#FFCA20] font-bold text-sm sm:text-base md:text-lg">{item.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
}
