/**
 * Public About Content API
 * GET /api/about - Get active about page content
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const sections = await prisma.aboutContent.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Transform to object keyed by section name for easier frontend consumption
    const aboutData = sections.reduce((acc, curr) => {
      // Normalize key if needed, or use exact section name
      // Using lowercase for consistency if the frontend expects keys like 'hero', 'main'
      const key = curr.section.toLowerCase().includes('hero') ? 'hero' : 
                 curr.section.toLowerCase().includes('main') ? 'main' : 
                 curr.section.toLowerCase(); // fallback to lowercase regular
      
      // If we want to preserve exact keys as stored in DB, strictly use curr.section
      // But based on "Hero section" vs "hero", normalization helps.
      // Let's stick to what the user likely has set up or simple keying.
      // Reverting to simple keying to be safe, but maybe handle "Hero section" -> "hero" mapping if distinct.
      // simpler: 
      acc[key] = curr;
      return acc;
    }, {});

    // Fetch contact info
    const contactInfos = await prisma.contactInfo.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: {
         about: aboutData,
         contacts: contactInfos
      }
    });
  } catch (error) {
    console.error('Get public about content error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about content', message: error.message },
      { status: 500 }
    );
  }
}

