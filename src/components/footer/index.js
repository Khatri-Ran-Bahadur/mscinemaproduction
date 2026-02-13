"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { home } from '@/services/api';

export default function Footer() {
    const [contactInfo, setContactInfo] = useState({ email: '', address: '' });

    useEffect(() => {
        home.getContactInfo()
            .then(data => {
                if (Array.isArray(data)) {
                    const emailInfo = data.find(info => info.type === 'email');
                    const addressInfo = data.find(info => info.type === 'address');
                    const phoneInfo = data.find(info => info.type === 'phone');
                    
                    if (emailInfo || addressInfo) {
                        setContactInfo({
                            phone: phoneInfo?.value || '',
                            email: emailInfo?.value || '',
                            address: addressInfo?.value || ''
                        });
                    }
                }
            })
            .catch(err => console.error('Contact info fetch error:', err));
    }, []);

    const year=new Date('Y')

    return (
        <footer className="bg-[#1a1a1a] text-[#FAFAFA]">
            <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
                {/* Top Section - 4 Columns on Desktop, Stacked on Mobile */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8 md:mb-12">
                     {/* ... (rest of the content remains the same until bottom section) ... */}
                    {/* Left Column - Navigation Links */}
                    <div>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/" className="hover:text-[#FFCA20] transition">Home</Link></li>
                            <li><Link href="/movies" className="hover:text-[#FFCA20] transition">Movies</Link></li>
                            {/* <li><Link href="/foods-drinks" className="hover:text-[#FFCA20] transition">Food & Drinks</Link></li> */}
                            <li><Link href="/hall-booking" className="hover:text-[#FFCA20] transition">Hall booking</Link></li>
                        </ul>
                    </div>

                    {/* Middle Column 1 - Navigation Links */}
                    <div>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/about" className="hover:text-[#FFCA20] transition">About us</Link></li>
                            {/* <li><Link href="#" className="hover:text-[#FFCA20] transition">Support</Link></li> */}
                            <li><Link href="/contact" className="hover:text-[#FFCA20] transition">Contact us</Link></li>
                        </ul>
                    </div>

                    {/* Middle Column 2 - Contact Info */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="text-[#FAFAFA] text-sm font-medium mb-4">Contact</h4>
                        <ul className="space-y-4 text-sm text-[#D3D3D3]">
                            {contactInfo.email && (
                                <li className="flex items-start gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-[#FFCA20]">
                                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                    </svg>
                                    <span className="break-all">{contactInfo.email}</span>
                                </li>
                            )}
                            {contactInfo.phone && (
                                <li className="flex items-start gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-[#FFCA20]"><path id="primary" d="M21,15v3.93a2,2,0,0,1-2.29,2A18,18,0,0,1,3.14,5.29,2,2,0,0,1,5.13,3H9a1,1,0,0,1,1,.89,10.74,10.74,0,0,0,1,3.78,1,1,0,0,1-.42,1.26l-.86.49a1,1,0,0,0-.33,1.46,14.08,14.08,0,0,0,3.69,3.69,1,1,0,0,0,1.46-.33l.49-.86A1,1,0,0,1,16.33,13a10.74,10.74,0,0,0,3.78,1A1,1,0,0,1,21,15Z" ></path></svg>
                                    <span className="break-all">{contactInfo.phone}</span>
                                </li>
                            )}

                            {contactInfo.address && (
                                <li className="flex items-start gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-[#FFCA20]">
                                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    <span>{contactInfo.address}</span>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Right Column - Connect with us */}
                    <div className="col-span-2 md:col-span-1 text-center md:text-left">
                        <h4 className="text-[#FAFAFA] font-medium mb-4 md:mb-6">Connect with us</h4>
                        
                        {/* Social Media Icons */}
                        <div className="flex justify-center md:justify-start gap-4 md:gap-6 mb-6 md:mb-8">
                            {/* Facebook */}
                            <a href="https://www.facebook.com/profile.php?id=100087528683670" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#3a3a3a] flex items-center justify-center hover:border-[#FFCA20] transition">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#FAFAFA]">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            
                            {/* Instagram */}
                            <a href="https://www.instagram.com/mscinemas/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#3a3a3a] flex items-center justify-center hover:border-[#FFCA20] transition">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#FAFAFA]">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                            </a>
                            
                            
                            {/* Twitter/X */}
                            <a href="https://twitter.com/mscinemas" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#3a3a3a] flex items-center justify-center hover:border-[#FFCA20] transition">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#FAFAFA]">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                            </a>
                            
                            {/* TikTok */}
                            <a href="https://www.tiktok.com/@mscinemas?lang=en" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#3a3a3a] flex items-center justify-center hover:border-[#FFCA20] transition">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#FAFAFA]">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                            </a>
                        </div>

                        {/* App Download Buttons */}
                        <div className="flex flex-row justify-center md:justify-start gap-2 md:gap-6">
                            {/* App Store Button */}
                            <a href="#" className="inline-flex items-center gap-2 md:gap-3 bg-black border border-[#FAFAFA] text-[#FAFAFA] px-2 md:px-4 py-2 md:py-3 rounded hover:bg-[#2a2a2a] transition flex-1 md:flex-initial max-w-[180px] md:max-w-none">
                                <svg width="20" height="20" className="md:w-6 md:h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.18 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                                </svg>
                                <div className="flex flex-col text-left min-w-0">
                                    <span className="text-[9px] md:text-[10px] leading-tight">Download on the</span>
                                    <span className="text-[10px] md:text-xs font-semibold">App Store</span>
                                </div>
                            </a>
                            
                            {/* Google Play Button */}
                            <a href="#" className="inline-flex items-center gap-2 md:gap-3 bg-black border border-[#FAFAFA] text-[#FAFAFA] px-2 md:px-4 py-2 md:py-3 rounded hover:bg-[#2a2a2a] transition flex-1 md:flex-initial max-w-[180px] md:max-w-none">
                                <svg width="20" height="20" className="md:w-6 md:h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm-1.64-4.24L6.05 2.66l10.72 6.22-2.27 2.27zm1.64 4.24l2.27 2.27L21.94 12l-2.27-2.27L21.94 12l-2.27 2.27z"/>
                                </svg>
                                <div className="flex flex-col text-left min-w-0">
                                    <span className="text-[9px] md:text-[10px] leading-tight">GET IT ON</span>
                                    <span className="text-[10px] md:text-xs font-semibold">Google Play</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Section - Legal Links and Copyright */}
                <div className="border-t border-[#3a3a3a] pt-6 md:pt-8">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-[#D3D3D3] text-xs md:text-sm">
                        {/* Legal Links - Left aligned on Desktop, Centered on Mobile */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6">
                            <Link href="/terms-and-conditions" className="hover:text-[#FFCA20] transition">Terms & Conditions</Link>
                            <Link href="/privacy-policy" className="hover:text-[#FFCA20] transition">Privacy Policy</Link>
                            <Link href="/disclaimer" className="hover:text-[#FFCA20] transition">Disclaimer</Link>
                            <Link href="/cookie-policy" className="hover:text-[#FFCA20] transition">Cookie Policy</Link>
                            <Link href="/faqs" className="hover:text-[#FFCA20] transition">FAQ</Link>
                        </div>
                        
                        {/* Copyright - Right aligned on Desktop, Centered on Mobile */}
                        <div className="text-center md:text-right">
                            <p>Copyright ©️ {new Date().getFullYear()} MS Cinemas Sdn Bhd. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

