/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'standalone', 
  reactCompiler: false, // Disabling this can significantly reduce CPU usage during build
  eslint: {
    ignoreDuringBuilds: true, // Disables linting during build to save CPU and time
  },
  typescript: {
    ignoreBuildErrors: true, // Disables type checking during build
  },
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
