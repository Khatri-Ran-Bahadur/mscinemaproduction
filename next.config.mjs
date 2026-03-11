/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'standalone', 
  reactCompiler: false, // Disabling this can significantly reduce CPU usage during build
  typescript: {
    ignoreBuildErrors: true, // Disables type checking during build
  },
  // Disabled Turbopack - using webpack instead to fix missing chunks
  // turbopack: {
  //   root: process.cwd(),
  // },
  compress: true, // Enables gzip compression to reduce CPU/Bandwidth
  poweredByHeader: false, // Security and slight performance gain
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
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Increase max upload size
    },
  },
};

export default nextConfig;
