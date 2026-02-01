"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { User, Ticket, LogOut, ChevronDown, Menu, X, Film, Clock, Volume2, UserCircle } from 'lucide-react';
import { getToken, getUserData, removeToken, removeUserData } from '@/utils/storage';
import { useRouter } from 'next/navigation';
import { movies as moviesAPI } from '@/services/api';

const Header = () => {
    const router = useRouter();
    const [activePage, setActivePage] = useState('home');
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMoreDropdown, setShowMoreDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showMobileMoreDropdown, setShowMobileMoreDropdown] = useState(false);
    const [userData, setUserData] = useState(null);
    const [menuMovies, setMenuMovies] = useState([]);
    const lastUserStrRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const scrollPositionRef = useRef(0);

    // Helper function to lock body scroll and preserve position
    const lockBodyScroll = () => {
        scrollPositionRef.current = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPositionRef.current}px`;
        document.body.style.width = '100%';
    };

    // Helper function to unlock body scroll and restore position
    const unlockBodyScroll = () => {
        const scrollY = scrollPositionRef.current;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
    };

    useEffect(() => {
        // Check if user is logged in
        const checkAuth = () => {
            const rawUser = localStorage.getItem('ms_cinema_user_data');
            
            if (rawUser !== lastUserStrRef.current) {
                lastUserStrRef.current = rawUser;
                const user = getUserData();
                setIsLoggedIn(!!user);
                setUserData(user);
            }
        };

        checkAuth();

        // Get current path from URL
        const path = window.location.pathname;
        
        // Map paths to menu items
        if (path === '/' || path === '/home') {
            setActivePage('home');
        } else if (path.includes('/movies')) {
            setActivePage('movies');
        } else if (path.includes('/foods-drinks')) {
            setActivePage('foods-drinks');
        } else if (path.includes('/hall-booking')) {
            setActivePage('hall-booking');
        } else if (path.includes('/more') || path.includes('/about') || path.includes('/events') || path.includes('/contact') || path.includes('/faq')) {
            setActivePage('more');
        }

        // Add scroll listener for background transition
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        // Listen for storage changes (login/logout)
        const handleStorageChange = () => {
            checkAuth();
        };

        // Handle click outside mobile menu
        const handleClickOutside = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setShowMobileMenu(false);
                unlockBodyScroll();
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('storage', handleStorageChange);
        document.addEventListener('mousedown', handleClickOutside);
        
        // Check auth periodically (in case of same-tab logout)
        const interval = setInterval(checkAuth, 1000);

        // Load movies for mobile menu
        const loadMenuMovies = async () => {
            try {
                const data = await moviesAPI.getMovies();
                if (Array.isArray(data) && data.length > 0) {
                    const transformedMovies = data.slice(0, 4).map((movie) => ({
                        id: movie.movieID || movie.id,
                        title: movie.movieName || movie.title || "Unknown Movie",
                        image: movie.imageURL || movie.image || "img/movies1.png",
                        genre: movie.genre || "Action",
                        duration: movie.duration || "1 hr 48 mins",
                        language: movie.language || "English",
                    }));
                    setMenuMovies(transformedMovies);
                }
            } catch (error) {
                console.error('Error loading menu movies:', error);
                // Use default movies on error
                setMenuMovies([
                    { id: 1, title: "Predator: Badlands", image: "img/movies1.png", genre: "Action", duration: "1 hr 48 mins", language: "English" },
                    { id: 2, title: "Predator: Badlands", image: "img/movies2.png", genre: "Action", duration: "1 hr 48 mins", language: "English" },
                ]);
            }
        };

        loadMenuMovies();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('storage', handleStorageChange);
            document.removeEventListener('mousedown', handleClickOutside);
            clearInterval(interval);
            // Restore body scroll on unmount
            unlockBodyScroll();
        };
    }, []);

    const menuItems = [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'movies', label: 'Movies', href: '/movies' },
        // { id: 'foods-drinks', label: 'Food & Drinks', href: '/foods-drinks' },
        { id: 'hall-booking', label: 'Hall Booking', href: '/hall-booking' },
        { 
            id: 'more', 
            label: 'More', 
            href: '#',
            dropdown: [
                { id: 'about', label: 'About us', href: '/about' }
                
            ]
        }
    ];

    const handleClick = (id) => {
        setActivePage(id);
        setShowMobileMenu(false);
    };

    const handleLogout = () => {
        removeToken();
        removeUserData();
        setIsLoggedIn(false);
        setUserData(null);
        setShowDropdown(false);
        router.push('/');
        // Trigger storage event for other tabs
        window.dispatchEvent(new Event('storage'));
    };

    const getUserInitials = () => {
        if (userData && userData.name) {
            return userData.name.charAt(0).toUpperCase();
        }
        if (userData && userData.email) {
            return userData.email.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const hasValidImage = () => {
        return userData?.imageURL && 
               userData.imageURL.trim() && 
               userData.imageURL !== ' ' &&
               userData.imageURL !== 'null' &&
               userData.imageURL !== 'undefined';
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled ? 'bg-black/90 backdrop-blur-sm border-b border-gray-800' : 'bg-gradient-to-b from-black/60 to-transparent'
        }`}>
            {/* Menu Shadow Gradient Overlay */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(0deg, rgba(17, 17, 17, 0) 0%, rgba(17, 17, 17, 0.5) 29.48%, #111111 81.77%)'
                }}
            />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-8">
                    <div className="relative">
                        <Link href="/">
                            <img 
                                src="/img/logo.png" 
                                alt="MS Cinemas Logo" 
                                className="h-20 w-auto sm:h-14"
                                onError={(e) => {
                                    // Fallback to SVG if image fails to load
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'block';
                                }}
                            />
                            <svg width="60" height="50" viewBox="0 0 60 50" className="text-[#FFCA20] hidden">
                            <path d="M5 5 L30 0 L55 5 L55 35 L30 45 L5 35 Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                            <path d="M8 8 L30 3 L52 8 L52 33 L30 42 L8 33 Z" fill="#1a1a1a" stroke="currentColor" strokeWidth="0.5" />
                            <line x1="8" y1="20" x2="52" y2="20" stroke="currentColor" strokeWidth="0.5" />
                            <text x="30" y="17" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold" fontFamily="serif">MS</text>
                            <text x="30" y="32" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="normal" fontFamily="serif" letterSpacing="2">CINEMAS</text>
                        </svg>
                        </Link>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-6 text-sm">
                        {menuItems.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {item.id === 'more' ? (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                                            className={`flex items-center gap-1 transition ${
                                                activePage === item.id
                                                    ? 'text-[#FFCA20] border-b-2 border-[#FFCA20] pb-1'
                                                    : 'text-[#D3D3D3] hover:text-[#FFCA20]'
                                            }`}
                                        >
                                            {item.label}
                                            <ChevronDown className={`w-4 h-4 transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {/* More Dropdown Menu */}
                                        {showMoreDropdown && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setShowMoreDropdown(false)}
                                                />
                                                <div className="absolute top-full left-0 mt-2 w-48 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-xl z-50 overflow-hidden">
                                                    <div className="py-1">
                                                        <Link
                                                            href="/about"
                                                            onClick={() => {
                                                                setShowMoreDropdown(false);
                                                                handleClick('more');
                                                            }}
                                                            className="block px-4 py-3 text-[#FAFAFA] hover:bg-[#3a3a3a] transition text-sm border-b border-[#3a3a3a] last:border-b-0"
                                                        >
                                                            About us
                                                        </Link>
                                                        <Link
                                                            href="/contact"
                                                            onClick={() => {
                                                                setShowMoreDropdown(false);
                                                                handleClick('more');
                                                            }}
                                                            className="block px-4 py-3 text-[#FAFAFA] hover:bg-[#3a3a3a] transition text-sm border-b border-[#3a3a3a] last:border-b-0"
                                                        >
                                                            Contact us
                                                        </Link>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                href={item.href}
                                onClick={() => handleClick(item.id)}
                                className={`transition ${
                                    activePage === item.id
                                                ? 'text-[#FFCA20] border-b-2 border-[#FFCA20] pb-1'
                                                : 'text-[#D3D3D3] hover:text-[#FFCA20]'
                                }`}
                            >
                                {item.label}
                            </Link>
                                )}
                                {index < menuItems.length - 1 && (
                                    <span className="text-[#D3D3D3]/30">|</span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* User Menu / Sign In Button / Mobile Menu Toggle */}
                <div className="relative flex items-center gap-4">
                    {/* Desktop User Menu / Sign In */}
                    <div className="hidden md:block">
                        {isLoggedIn ? (
                            <>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="relative focus:outline-none"
                                >
                                    {hasValidImage() ? (
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FFCA20] shadow-lg">
                                            <img
                                                src={userData.imageURL}
                                                alt={userData.name || 'User'}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // If image fails to load, show avatar icon instead
                                                    e.target.style.display = 'none';
                                                    const avatarEl = e.target.nextElementSibling;
                                                    if (avatarEl) {
                                                        avatarEl.style.display = 'flex';
                                                    }
                                                }}
                                            />
                                            <div className="w-full h-full hidden items-center justify-center bg-[#1a1a1a]">
                                                <UserCircle className="w-10 h-10 text-[#FFCA20]" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full  bg-[#1a1a1a] flex items-center justify-center shadow-lg">
                                            <UserCircle className="w-10 h-10 text-[#FFCA20]" />
                                        </div>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {showDropdown && (
                                    <>
                                        {/* Backdrop to close dropdown */}
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowDropdown(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl z-50 overflow-hidden">
                                            <div className="py-0">
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-4 px-5 py-4 text-white hover:bg-[#2a2a2a] transition border-b border-[#2a2a2a]/50"
                                                >
                                                    <User className="w-5 h-5 text-white" strokeWidth={2} fill="none" />
                                                    <span className="text-sm font-normal text-white">My profile</span>
                                                </Link>
                                                <Link
                                                    href="/my-tickets"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-4 px-5 py-4 text-white hover:bg-[#2a2a2a] transition border-b border-[#2a2a2a]/50"
                                                >
                                                    <Ticket className="w-5 h-5 text-white" strokeWidth={2} fill="none" />
                                                    <span className="text-sm font-normal text-white">My tickets</span>
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-[#2a2a2a] transition text-left"
                                                >
                                                    <LogOut className="w-5 h-5 text-white" strokeWidth={2} fill="none" />
                                                    <span className="text-sm font-normal text-white">Logout</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <Link href='/sign-in' className="bg-[#FFCA20] text-black px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-[#FFCA20]/90 transition text-sm md:text-base inline-block">
                                Sign in
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => {
                            if (!showMobileMenu) {
                                lockBodyScroll();
                                setShowMobileMenu(true);
                            } else {
                                setShowMobileMenu(false);
                                unlockBodyScroll();
                            }
                        }}
                        className="md:hidden text-[#FAFAFA] p-2 z-50 relative"
                    >
                        {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Full-Width Overlay Menu */}
            {showMobileMenu && (
                <div 
                    ref={mobileMenuRef}
                    className="fixed md:hidden"
                    style={{ 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0,
                        height: '100vh',
                        width: '100vw',
                        zIndex: 99999
                    }}
                >
                    {/* Semi-transparent overlay that allows background to show through */}
                    <div 
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => {
                            setShowMobileMenu(false);
                            unlockBodyScroll();
                        }}
                    />
                    
                    {/* Full-width menu container */}
                    <div className="absolute inset-0 flex flex-col">
                        {/* Header with Logo and Close */}
                        <div className="flex items-center justify-between p-4 md:p-6 bg-black/20 backdrop-blur-md z-10">
                            <img 
                                src="/img/logo.png" 
                                alt="MS Cinemas Logo" 
                                className="h-10 w-auto"
                                onError={(e) => {
                                    // Fallback to SVG if image fails to load
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'block';
                                }}
                            />
                            <svg width="50" height="40" viewBox="0 0 60 50" className="text-[#FFCA20] hidden">
                                <path d="M5 5 L30 0 L55 5 L55 35 L30 45 L5 35 Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                <path d="M8 8 L30 3 L52 8 L52 33 L30 42 L8 33 Z" fill="#1a1a1a" stroke="currentColor" strokeWidth="0.5" />
                                <line x1="8" y1="20" x2="52" y2="20" stroke="currentColor" strokeWidth="0.5" />
                                <text x="30" y="17" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold" fontFamily="serif">MS</text>
                                <text x="30" y="32" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="normal" fontFamily="serif" letterSpacing="2">CINEMAS</text>
                            </svg>
                            <button
                                onClick={() => {
                                    setShowMobileMenu(false);
                                    unlockBodyScroll();
                                }}
                                className="text-[#FAFAFA] hover:text-[#FFCA20] transition p-2"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Menu Items - Left Side */}
                        <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
                            <div className="w-full sm:w-80 bg-black/50 backdrop-blur-lg flex flex-col" style={{ height: '100%' }}>
                                {/* Scrollable Main Menu Items */}
                                <div className="flex flex-col flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                                    <div className="flex flex-col p-4">
                                        {menuItems.map((item) => (
                                            <React.Fragment key={item.id}>
                                                {item.dropdown ? (
                                                    <div className="mb-1">
                                                        <button
                                                            onClick={() => setShowMobileMoreDropdown(!showMobileMoreDropdown)}
                                                            className={`w-full flex items-center justify-between py-4 px-2 text-[#FAFAFA] hover:text-[#FFCA20] transition border-b border-[#3a3a3a]/50 ${
                                                                activePage === item.id ? 'text-[#FFCA20]' : ''
                                                            }`}
                                                        >
                                                            <span className="text-base font-medium">{item.label}</span>
                                                            <ChevronDown className={`w-5 h-5 transition-transform ${showMobileMoreDropdown ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        
                                                        {/* More Dropdown Items */}
                                                        {showMobileMoreDropdown && (
                                                            <div className="pl-4 mt-1 space-y-1 ">
                                                                {item.dropdown.map((dropItem) => (
                                                                    <Link
                                                                        key={dropItem.id}
                                                                        href={dropItem.href}
                                                                        onClick={() => {
                                                                            handleClick(dropItem.id);
                                                                            setShowMobileMoreDropdown(false);
                                                                            setShowMobileMenu(false);
                                                                            unlockBodyScroll();
                                                                        }}
                                                                        className="block py-3 text-sm text-[#D3D3D3] hover:text-[#FFCA20] transition"
                                                                    >
                                                                        {dropItem.label}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={item.href}
                                                        onClick={() => {
                                                            handleClick(item.id);
                                                            setShowMobileMenu(false);
                                                            unlockBodyScroll();
                                                        }}
                                                        className={`py-4 px-2 text-base font-medium border-b border-[#3a3a3a]/50 transition ${
                                                            activePage === item.id
                                                                ? 'text-[#FFCA20]'
                                                                : 'text-[#FAFAFA] hover:text-[#FFCA20]'
                                                        }`}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                )}
                                            </React.Fragment>
                                        ))}

                                        {/* User Menu Items - After Main Menu */}
                                        {isLoggedIn ? (
                                            <>
                                                <Link
                                                    href="/profile"
                                                    onClick={() => {
                                                        setShowMobileMenu(false);
                                                        unlockBodyScroll();
                                                    }}
                                                    className="flex items-center gap-4 py-4 px-2 text-white hover:text-[#FFCA20] transition border-b border-[#3a3a3a]/50"
                                                >
                                                    <User className="w-5 h-5 text-white" strokeWidth={2} fill="none" />
                                                    <span className="text-base font-medium text-white">My profile</span>
                                                </Link>
                                                <Link
                                                    href="/my-tickets"
                                                    onClick={() => {
                                                        setShowMobileMenu(false);
                                                        unlockBodyScroll();
                                                    }}
                                                    className="flex items-center gap-4 py-4 px-2 text-white hover:text-[#FFCA20] transition border-b border-[#3a3a3a]/50"
                                                >
                                                    <Ticket className="w-5 h-5 text-white" strokeWidth={2} fill="none" />
                                                    <span className="text-base font-medium text-white">My tickets</span>
                                                </Link>
                                                <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setShowMobileMenu(false);
                                                    unlockBodyScroll();
                                                }}
                                                    className="w-full flex items-center gap-4 py-4 px-2 text-white hover:text-[#FFCA20] transition text-left border-b border-[#3a3a3a]/50"
                                                >
                                                    <LogOut className="w-5 h-5 text-white" strokeWidth={2} fill="none" />
                                                    <span className="text-base font-medium text-white">Logout</span>
                                                </button>
                                            </>
                                        ) : (
                                            <Link
                                                href="/sign-in"
                                                onClick={() => {
                                                    setShowMobileMenu(false);
                                                    unlockBodyScroll();
                                                }}
                                                className="flex items-center gap-4 py-4 px-2 text-white hover:text-[#FFCA20] transition border-b border-[#3a3a3a]/50"
                                            >
                                                <User className="w-5 h-5 text-white" strokeWidth={2} fill="none" />
                                                <span className="text-base font-medium text-white">Sign in</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Header;
