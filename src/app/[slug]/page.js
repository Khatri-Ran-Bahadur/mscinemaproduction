import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import DynamicContent from '@/components/DynamicContent';
import './slug-content.css';
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

const formatTextToHtml = (text) => {
    if (!text) return '';
    // If it looks like HTML (starts with tag), return as is
    if (/^\s*<[a-z][^>]*>/i.test(text)) return text;
    
    // Split by double newlines for paragraphs
    return text
        .split(/\n\s*\n/)
        .map(para => {
            // For each paragraph, replace single newlines with space to join lines
            return `<p>${para.trim().replace(/-\n/g, '-').replace(/\n/g, ' ')}</p>`;
        })
        .join('');
};

const cleanContent = (content) => {
    if (!content) return "";
    
    // CRITICAL STEP 1: Replace ALL &nbsp; with regular spaces
    // The rich editor is putting &nbsp; between EVERY word, preventing natural wrapping
    let cleaned = content.replace(/&nbsp;/g, " ");
    
    // Also replace the actual non-breaking space character (Unicode 160)
    cleaned = cleaned.replace(/\u00A0/g, " ");
    
    // Step 2: Remove zero-width spaces and invisible characters
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, "");
    
    // Step 3: Fix words that are split across lines in the database
    cleaned = cleaned.replace(/([a-z])\s*\n\s*([a-z])/gi, '$1$2');
    
    // Step 4: Fix splits at tag boundaries
    cleaned = cleaned.replace(/([a-z])(<\/[^>]+>)\s*\n\s*(<[^>]+>)([a-z])/gi, '$1$4');
    
    // Step 5: Remove ALL style attributes
    cleaned = cleaned.replace(/\s+style\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Step 6: Remove class attributes
    cleaned = cleaned.replace(/\s+class\s*=\s*["'][^"']*["']/gi, '');
    
    // Step 7: Remove width, height attributes
    cleaned = cleaned.replace(/\s+width\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s+height\s*=\s*["'][^"']*["']/gi, '');
    
    // Step 8: Remove data attributes
    cleaned = cleaned.replace(/\s+data-[a-z-]+\s*=\s*["'][^"']*["']/gi, '');
    
    // Step 9: Remove span tags
    cleaned = cleaned.replace(/<span[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/span>/gi, '');
    
    // Step 10: Clean up multiple spaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    
    // Step 11: Trim spaces around tags
    cleaned = cleaned.replace(/\s*(<[^>]+>)\s*/g, '$1');
    
    return cleaned;
};

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
        <div className="container mx-auto px-6">
             <h1 className="text-3xl md:text-5xl font-bold text-[#FFCA20] mb-8 pb-4 border-b border-[#333]"> 
               {page.title} 
             </h1>
             <DynamicContent content={cleanContent(formatTextToHtml(page.content))} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
