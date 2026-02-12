import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ReadMoreContent from '@/components/ReadMoreContent';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'About Us',
  description: 'Learn more about MS Cinemas, your ultimate destination for an immersive cinematic experience in Kampar, Perak. Featuring state-of-the-art screens, Dolby Atmos sound, and premium comfort.',
};

async function getAboutContent() {
  try {
    const content = await prisma.aboutContent.findMany({
      where: { isActive: true }
    });
    // Convert to object for easier access
    return content.reduce((acc, curr) => {
      acc[curr.section] = curr;
      return acc;
    }, {});
  } catch (error) {
    console.error('Failed to fetch about content:', error);
    return {};
  }
}

const getIcon = (iconName) => {
    switch(iconName?.toLowerCase()) {
        case 'phone': return Phone;
        case 'mail': return Mail;
        case 'map-pin': return MapPin;
        case 'location': return MapPin;
        default: return MapPin;
    }
};

export default async function AboutUsPage() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const getValidUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        // For local relative paths, ensure they start with /
        if (path.startsWith('/')) return path;
        return `/${path}`;
    };

    const content = await getAboutContent();
    const contactInfos = await prisma.contactInfo.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
    });

    // Fallbacks
    const hero = content['hero'] || {
        title: 'About us',
        content: 'Book your preferred experience and stay connected with us',
        image: 'img/about-banner.jpg'
    };
    
    const main = content['main'] || {
        title: 'About MS Cinemas',
        content: `Located in the heart of Kampar, Perak, MS Cinemas is the ultimate destination for movie goers seeking a complete and immersive cinematic experience. Featuring 8 state-of-the-art screens, our cinema offers the perfect blend of comfort, technology, and entertainment. Whether you're catching the latest Hollywood blockbuster, a heartwarming local film, or an international release, MS Cinemas provides crystal clear visuals, powerful surround sound (One hall with multi speaker Dolby Atmos surround sound setup that delivers pristine, crystal clear audio and two halls equipped 2 XL screen hall brings to life high octane action), the cinema hall provides an immersive sound and picture quality, making every movie experience unforgettable. The halls use silver screens, which guarantee excellent presentation quality, and spacious seating with ample legroom that ensures you feel comfortable throughout the entire movie.\n\nMS Cinemas also offers something for the whole family, with Kids Family Halls and a designated kids’ toilet. Additionally, there’s a party area available for birthdays or other celebrations, providing a unique and fun environment to celebrate special occasions.\n\nBesides movie screenings, MS Cinemas also offers versatile facilities that can be used for presentations or seminars, making it an excellent venue for corporate events. And for those who want to grab a bite or enjoy a cup of coffee, the cinema has an MS Cafe where you can relax and enjoy refreshments before or after the movie.\n\nWith a total seating capacity of approximately 1200, MS Cinemas has something for everyone. Whether you’re looking to catch the latest blockbuster or host an event, MS Cinemas in Kampar Perak has it all, and more.`,
        image: 'img/about-mid-section.jpg'
    };

    const contact = content['contact'] || {};

    const formatTextToHtml = (text) => {
        if (!text) return '';
        // If it looks like HTML (starts with tag), return as is
        if (/^\s*<[a-z][^>]*>/i.test(text)) return text;
        
        // Split by double newlines for paragraphs
        return text
            .split(/\n\s*\n/)
            .map(para => {
                // For each paragraph, replace single newlines with space to join lines
                // Also handle the case where a word was hyphenated at end of line (e.g. "movie-\ngoers" -> "movie-goers")
                // We keep the hyphen but remove the newline.
                return `<p>${para.trim().replace(/-\n/g, '-').replace(/\n/g, ' ')}</p>`;
            })
            .join('');
    };

    return (
        <div className="min-h-screen bg-black text-[#FAFAFA]">
            <Header />

            {/* Hero Section */}
            <section className="relative h-[70vh] sm:h-[65vh] md:h-[75vh] overflow-hidden pt-16 sm:pt-20 md:pt-24">
                <div className="absolute inset-0">
                    <img 
                        src={getValidUrl(hero.image)} 
                        alt="About MS Cinemas" 
                        className="w-full h-full object-cover"
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
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 text-[#FAFAFA]">{hero.title}</h1>
                    <p className="text-[#D3D3D3] text-lg md:text-xl mb-8 max-w-2xl">
                        {hero.content}
                    </p>
                    <Link href="/contact" className="bg-[#FFCA20] text-black px-8 py-3 rounded-lg font-semibold hover:bg-[#FFCA20]/90 transition w-fit inline-block">
                        Contact now
                    </Link>
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
                        {/* Modified Layout: Image Left, Content Right for 'main' section */}
                        <div className="flex flex-col lg:flex-row gap-12 items-start">
                             {/* Image - 40% width on Desktop, Sticky for balanced layout */}
                             <div className="w-full lg:w-2/5 lg:sticky lg:top-32">
                                <div className="rounded-xl overflow-hidden h-[400px] lg:h-[calc(100vh-200px)] relative shadow-2xl border border-[#3a3a3a]">
                                    <img 
                                        src={getValidUrl(main.image)} 
                                        alt="Cinema Interior" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                             </div>

                             {/* Text Content - 60% width on Desktop */}
                            <div className="w-full lg:w-3/5 space-y-6">
                                <h2 className="text-3xl md:text-4xl font-bold text-[#FFCA20] border-b border-[#3a3a3a] pb-4 inline-block">
                                    {main.title}
                                </h2>
                                <ReadMoreContent content={formatTextToHtml(main.content)} maxHeightPercentage={53} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information Section - Dynamic */}
                <div className="py-16">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {contactInfos.slice(0,3).map((info) => {
                                const IconComponent = getIcon(info.icon || info.type);
                                return (
                                    <div key={info.id} className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a] hover:border-[#FFCA20] transition group">
                                        <div className="w-12 h-12 bg-[#333] group-hover:bg-[#FFCA20] rounded-full flex items-center justify-center mb-4 transition">
                                            <IconComponent size={24} className="text-[#FFCA20] group-hover:text-black transition" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2 text-[#FAFAFA] capitalize">{info.title}</h3>
                                        <p className="text-[#D3D3D3] text-sm leading-relaxed whitespace-pre-line">{info.value}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>


            </section>

            <Footer />
        </div>
    );
}
