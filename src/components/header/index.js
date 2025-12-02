import { useEffect, useState } from 'react';

const Header = () => {
    const [activePage, setActivePage] = useState('home');
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
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
        } else if (path.includes('/more')) {
            setActivePage('more');
        }

        // Add scroll listener for background transition
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const menuItems = [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'movies', label: 'Movies', href: '/movies' },
        { id: 'foods-drinks', label: 'Food & Drinks', href: '/foods-drinks' },
        { id: 'hall-booking', label: 'Hall Booking', href: '/hall-booking' },
        { id: 'more', label: 'More', href: '/more' }
    ];

    const handleClick = (id) => {
        setActivePage(id);
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled ? 'bg-black/90 backdrop-blur-sm border-b border-gray-800' : 'bg-gradient-to-b from-black/60 to-transparent'
        }`}>
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="relative">
                        <svg width="60" height="50" viewBox="0 0 60 50" className="text-yellow-400">
                            <path d="M5 5 L30 0 L55 5 L55 35 L30 45 L5 35 Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                            <path d="M8 8 L30 3 L52 8 L52 33 L30 42 L8 33 Z" fill="#1a1a1a" stroke="currentColor" strokeWidth="0.5" />
                            <line x1="8" y1="20" x2="52" y2="20" stroke="currentColor" strokeWidth="0.5" />
                            <text x="30" y="17" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold" fontFamily="serif">MS</text>
                            <text x="30" y="32" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="normal" fontFamily="serif" letterSpacing="2">CINEMAS</text>
                        </svg>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex gap-6 text-sm">
                        {menuItems.map((item) => (
                            <a
                                key={item.id}
                                href={item.href}
                                onClick={() => handleClick(item.id)}
                                className={`transition ${
                                    activePage === item.id
                                        ? 'text-yellow-500 border-b-2 border-yellow-500 pb-1'
                                        : 'text-white hover:text-yellow-500'
                                }`}
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>
                </div>
                <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
                    <a href='/sign-in'>Sign in</a>
                </button>
            </div>
        </nav>
    );
};

export default Header;