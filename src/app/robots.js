export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mscinemas.com.my'; // Fallback to a production URL if possible
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/maintenance',
          '/admin',
          '/api/',
          '/_next/',
          '/static/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
