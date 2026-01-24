/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'standalone', // Reduces deployment size significantly by bundling only necessary files
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'cinemaapi5.ddns.net',
      },
      {
        protocol: 'https',
        hostname: 'apiv5.mscinemas.my',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
  },
};

export default nextConfig;
