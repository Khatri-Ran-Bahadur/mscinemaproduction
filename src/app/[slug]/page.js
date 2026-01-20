import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import SlugStyles from './SlugStyles';
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const page = await prisma.page.findUnique({
    where: { slug: resolvedParams.slug }
  });
  
  if (!page) {
    return {
      title: 'Page Not Found'
    };
  }
  
  return {
    title: `${page.title} | MS Cinema`
  };
}

export default async function DynamicPage({ params }) {
  const resolvedParams = await params;
  const page = await prisma.page.findFirst({
    where: { 
      slug: resolvedParams.slug,
      isActive: true
    }
  });

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      <Header />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
             <h1 className="text-3xl md:text-5xl font-bold text-[#FFCA20] mb-8 pb-4 border-b border-[#333]"> 
               {page.title} 
             </h1>
             <div 
               className="cms-content w-full break-words text-[#D3D3D3]"
               dangerouslySetInnerHTML={{ __html: page.content }} 
             />
             <SlugStyles />
        </div>
      </main>
      <Footer />
    </div>
  );
}
