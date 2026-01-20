"use client";

import React, { useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { X, Calendar, ChevronDown } from 'lucide-react';
import { getUserData } from '@/utils/storage';
import ReCAPTCHA from "react-google-recaptcha";

export default function BookHallPage() {
    const [activeTab, setActiveTab] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        contactNumber: '',
        email: '',
        eventType: '',
        preferredHall: '',
        preferredLocation: '',
        date: '',
        numberOfPeople: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recaptchaValue, setRecaptchaValue] = useState(null);

    // Pre-fill form with user data if logged in
    const handleOpenModal = () => {
        const userData = getUserData();
        if (userData) {
            setFormData(prev => ({
                ...prev,
                fullName: userData.name || userData.Name || '',
                email: userData.email || userData.Email || '',
                contactNumber: userData.mobile || userData.Mobile || ''
            }));
        }
        setShowModal(true);
        setErrors({});
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            fullName: '',
            contactNumber: '',
            email: '',
            eventType: '',
            preferredHall: '',
            preferredLocation: '',
            date: '',
            numberOfPeople: ''
        });
        setErrors({});
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        // Validate form
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email';
        if (!formData.eventType.trim()) newErrors.eventType = 'Event type is required';
        if (!formData.preferredHall.trim()) newErrors.preferredHall = 'Preferred hall is required';
        if (!formData.preferredLocation.trim()) newErrors.preferredLocation = 'Preferred location is required';
        if (!formData.date.trim()) newErrors.date = 'Date is required';
        if (!formData.numberOfPeople.trim()) newErrors.numberOfPeople = 'Number of people is required';
        if (isNaN(formData.numberOfPeople) || parseInt(formData.numberOfPeople) < 1) {
            newErrors.numberOfPeople = 'Please enter a valid number';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }


        if (!recaptchaValue) {
            setErrors(prev => ({ ...prev, recaptcha: 'Please confirm you are not a robot' }));
            setIsSubmitting(false);
            return;
        }


        try {
            const res = await fetch('/api/hall-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit booking');
            }
            
            // Close modal and show success message
            // alert('Booking request submitted successfully!'); // Using toast logic via simple alert for now as requested or stick to existing flow
            // Actually, let's keep the alert as it was in the original code, maybe upgrade to toast if user asked but they didn't.
            // The user just said "send this booking information".
            
            alert('Booking request submitted successfully! We will contact you soon.');
            handleCloseModal();

        } catch (error) {
            console.error('Error submitting booking:', error);
            setErrors({ general: 'Failed to submit booking. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const halls = [
        {
            id: 1,
            image: "img/hall_booking1.jpg",
            title: "Book a Hall",
            description: "Enjoy a movie night out with your family and friends"
        },
        {
            id: 2,
            image: "img/hall_booking2.jpg",
            title: "Book a Hall",
            description: "Enjoy a movie night out with your family and friends"
        },
        {
            id: 3,
            image: "img/hall_booking3.jpg",
            title: "Book a Hall",
            description: "Enjoy a movie night out with your family and friends"
        }
    ];

    const filteredHalls = () => {
        if (activeTab === 'All') {
            return halls;
        }
        // Filter logic can be added here based on hall type
        return halls;
    };

    return (
        <div className="min-h-screen bg-black text-[#FAFAFA]">
            <Header />

            {/* Hero Section */}
            <section className="relative h-[70vh] sm:h-[65vh] md:h-[75vh] overflow-hidden pt-16 sm:pt-20 md:pt-24">
                <div className="absolute inset-0">
                    {/* Mobile Image */}
                    <img 
                        src="img/sm-bookinall.jpg" 
                        alt="Cinema Hall" 
                        className="w-full h-full object-cover object-center md:hidden"
                        onError={(e) => { e.target.src = 'img/hall_booking.jpg'; }}
                    />
                    {/* Desktop Image */}
                    <img 
                        src="img/booking-desktop.jpg" 
                        alt="Cinema Hall" 
                        className="hidden md:block w-full h-full object-cover object-center"
                        onError={(e) => { e.target.src = 'img/hall_booking.jpg'; }}
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
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 text-[#FAFAFA]">Book a hall</h1>
                    <p className="text-[#D3D3D3] text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 md:mb-8 max-w-2xl">
                        Book your preferred hall and create the perfect setting for an unforgettable cinema experience
                    </p>
                    <button 
                        onClick={handleOpenModal}
                        className="bg-[#FFCA20] text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-[#FFCA20]/90 transition w-fit"
                    >
                        Book
                    </button>
                    {/* Background Text */}
                    <div className="absolute bottom-10 sm:bottom-16 md:bottom-20 right-4 sm:right-10 md:right-20 text-[#FFCA20]/10 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold hidden lg:block">
                        SIGNATURE ROYALE
                    </div>
                </div>
            </section>

            {/* Tabs and Hall Cards Section */}
            <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Tabs */}
                <div className="flex gap-4 sm:gap-6 md:gap-8 border-b border-[#3a3a3a] mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('All')}
                        className={`pb-3 sm:pb-4 px-2 text-xs sm:text-sm font-medium transition relative whitespace-nowrap shrink-0 ${
                            activeTab === 'All' 
                                ? 'text-[#FFCA20]' 
                                : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                        }`}
                    >
                        All
                        {activeTab === 'All' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('Celebration')}
                        className={`pb-3 sm:pb-4 px-2 text-xs sm:text-sm font-medium transition relative whitespace-nowrap shrink-0 ${
                            activeTab === 'Celebration' 
                                ? 'text-[#FFCA20]' 
                                : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                        }`}
                    >
                        Celebration
                        {activeTab === 'Celebration' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('weddings')}
                        className={`pb-3 sm:pb-4 px-2 text-xs sm:text-sm font-medium transition relative whitespace-nowrap shrink-0 ${
                            activeTab === 'weddings' 
                                ? 'text-[#FFCA20]' 
                                : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                        }`}
                    >
                        weddings
                        {activeTab === 'weddings' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                        )}
                    </button>
                </div>

                {/* Hall Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    {filteredHalls().map((hall) => (
                        <div key={hall.id} className="group cursor-pointer">
                            <div className="relative h-80 sm:h-96 md:h-[450px] rounded-xl overflow-hidden">
                                <img
                                    src={hall.image}
                                    alt={hall.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                    onError={(e) => { e.target.src = 'img/movies1.png'; }}
                                />
                                {/* Gradient overlay for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
                                {/* Text overlay at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
                                    <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 text-white">{hall.title}</h3>
                                    <p className="text-[#D3D3D3] text-sm sm:text-base">{hall.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />

            {/* Booking Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="relative w-full max-w-lg bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] my-8">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[#3a3a3a]">
                            <h2 className="text-xl font-semibold text-[#FAFAFA]">Experience the great event with us</h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-[#D3D3D3] hover:text-[#FAFAFA] transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Error Message */}
                            {errors.general && (
                                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                    {errors.general}
                                </div>
                            )}

                            {/* Full Name */}
                            <div>
                                <input
                                    type="text"
                                    placeholder="Full name"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-[#FAFAFA] placeholder-[#D3D3D3] focus:outline-none focus:border-[#FFCA20] transition ${
                                        errors.fullName ? 'border-red-500' : 'border-[#3a3a3a]'
                                    }`}
                                />
                                {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
                            </div>

                            {/* Contact Number */}
                            <div>
                                <input
                                    type="tel"
                                    placeholder="Contact number"
                                    value={formData.contactNumber}
                                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                                    className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-[#FAFAFA] placeholder-[#D3D3D3] focus:outline-none focus:border-[#FFCA20] transition ${
                                        errors.contactNumber ? 'border-red-500' : 'border-[#3a3a3a]'
                                    }`}
                                />
                                {errors.contactNumber && <p className="text-red-400 text-sm mt-1">{errors.contactNumber}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-[#FAFAFA] placeholder-[#D3D3D3] focus:outline-none focus:border-[#FFCA20] transition ${
                                        errors.email ? 'border-red-500' : 'border-[#3a3a3a]'
                                    }`}
                                />
                                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                            </div>

                            {/* Event Type */}
                            <div>
                                <input
                                    type="text"
                                    placeholder="Event type"
                                    value={formData.eventType}
                                    onChange={(e) => handleInputChange('eventType', e.target.value)}
                                    className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-[#FAFAFA] placeholder-[#D3D3D3] focus:outline-none focus:border-[#FFCA20] transition ${
                                        errors.eventType ? 'border-red-500' : 'border-[#3a3a3a]'
                                    }`}
                                />
                                {errors.eventType && <p className="text-red-400 text-sm mt-1">{errors.eventType}</p>}
                            </div>

                            {/* Preferred Hall */}
                            <div className="relative">
                                <select
                                    value={formData.preferredHall}
                                    onChange={(e) => handleInputChange('preferredHall', e.target.value)}
                                    className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFCA20] transition appearance-none cursor-pointer ${
                                        errors.preferredHall ? 'border-red-500' : 'border-[#3a3a3a]'
                                    } ${!formData.preferredHall ? 'text-[#D3D3D3]' : ''}`}
                                >
                                    <option value="" disabled>Preferred Hall</option>
                                    <option value="hall1">Hall 1</option>
                                    <option value="hall2">Hall 2</option>
                                    <option value="hall3">Hall 3</option>
                                    <option value="hall4">Hall 4</option>
                                    <option value="hall5">Hall 5</option>
                                    <option value="hall6">Hall 6</option>

                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#D3D3D3] pointer-events-none" />
                                {errors.preferredHall && <p className="text-red-400 text-sm mt-1">{errors.preferredHall}</p>}
                            </div>

                            {/* Preferred Location */}
                            <div>
                                <input
                                    type="text"
                                    placeholder="Preferred Location"
                                    value={formData.preferredLocation}
                                    onChange={(e) => handleInputChange('preferredLocation', e.target.value)}
                                    className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-[#FAFAFA] placeholder-[#D3D3D3] focus:outline-none focus:border-[#FFCA20] transition ${
                                        errors.preferredLocation ? 'border-red-500' : 'border-[#3a3a3a]'
                                    }`}
                                />
                                {errors.preferredLocation && <p className="text-red-400 text-sm mt-1">{errors.preferredLocation}</p>}
                            </div>

                            {/* Date */}
                            <div className="relative">
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => handleInputChange('date', e.target.value)}
                                    className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-[#FAFAFA] placeholder-[#D3D3D3] focus:outline-none focus:border-[#FFCA20] transition ${
                                        errors.date ? 'border-red-500' : 'border-[#3a3a3a]'
                                    }`}
                                />
                                <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#D3D3D3] pointer-events-none" />
                                {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
                            </div>

                            {/* Number of People */}
                            <div>
                                <input
                                    type="number"
                                    placeholder="Number of people"
                                    value={formData.numberOfPeople}
                                    onChange={(e) => handleInputChange('numberOfPeople', e.target.value)}
                                    min="1"
                                    className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-[#FAFAFA] placeholder-[#D3D3D3] focus:outline-none focus:border-[#FFCA20] transition ${
                                        errors.numberOfPeople ? 'border-red-500' : 'border-[#3a3a3a]'
                                    }`}
                                />
                                {errors.numberOfPeople && <p className="text-red-400 text-sm mt-1">{errors.numberOfPeople}</p>}
                            </div>

                            {/* ReCAPTCHA */}
                            <div className="flex justify-center sm:justify-start mb-4">
                                <ReCAPTCHA
                                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                                    onChange={(val) => {
                                        setRecaptchaValue(val);
                                        if (val) setErrors(prev => ({ ...prev, recaptcha: null }));
                                    }}
                                    theme="dark"
                                />
                            </div>
                            {errors.recaptcha && <p className="text-red-400 text-sm mt-1 mb-4">{errors.recaptcha}</p>}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#FFCA20] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#FFCA20]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
