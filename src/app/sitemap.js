import { movies } from '@/services/api';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mscinemas.com.my';

  // Base routes
  const routes = [
    '',
    '/movies',
    '/experiences',
    '/about',
    '/contact',
    '/hall-booking',
    '/foods-drinks',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    // Dynamic movie routes
    const allMovies = await movies.getMovies();
    const movieRoutes = (Array.isArray(allMovies) ? allMovies : []).map((movie) => ({
      url: `${baseUrl}/movie-detail?movieId=${movie.movieID || movie.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [...routes, ...movieRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return routes;
  }
}
