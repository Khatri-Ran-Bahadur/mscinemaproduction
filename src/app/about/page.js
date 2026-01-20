import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
        content: `Located in the heart of Kampar, Perak, MS Cinemas is the ultimate destination for movie lovers seeking a complete and immersive cinematic experience. Featuring 8 state-of-the-art screens, our cinema offers the perfect blend of comfort, technology, and entertainment. Whether you're catching the latest Hollywood blockbuster, a heartwarming local film, or an international release, MS Cinemas provides crystal-clear visuals, powerful surround sound, and cozy seating to ensure every visit is memorable.\n\nAt MS Cinemas, we believe that watching a movie is more than just seeing a film - it's about creating moments, sharing emotions, and enjoying the magic of cinema together.`,
        image: 'img/about-mid-section.jpg'
    };

    const contact = content['contact'] || {};

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
                             {/* Image - 40% width on Desktop */}
                             <div className="w-full lg:w-2/5">
                                <div className="rounded-xl overflow-hidden aspect-[4/3] relative shadow-2xl border border-[#3a3a3a]">
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
                                <div 
                                    className="prose prose-invert max-w-none text-[#D3D3D3] leading-relaxed text-lg prose-p:mb-4 prose-headings:text-[#FFCA20] w-full overflow-hidden break-words [&>img]:max-w-full [&>img]:h-auto"
                                    dangerouslySetInnerHTML={{ __html: main.content }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information Section - Dynamic */}
                <div className="py-16">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {contactInfos.map((info) => {
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
